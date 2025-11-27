import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TapsService } from './taps.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('TapsService', () => {
  let service: TapsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    round: {
      findUnique: jest.fn(),
    },
    tap: {
      findFirst: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TapsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TapsService>(TapsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('tap', () => {
    const roundId = 'round-id';
    const userId = 'user-id';
    const now = new Date('2025-01-01T12:00:00Z');
    const startDate = new Date('2025-01-01T11:00:00Z');
    const endDate = new Date('2025-01-01T13:00:00Z');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(now);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('для пользователя Nikita', () => {
      it('должен проверить активность раунда и вернуть ответ без сохранения', async () => {
        const mockRound = {
          id: roundId,
          startDate,
          endDate,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          totalScore: 0,
        };

        mockPrismaService.round.findUnique.mockResolvedValue(mockRound);

        const result = await service.tap(roundId, userId, UserRole.NIKITA);

        expect(result).toEqual({
          tapId: '',
          score: 0,
          myTotalScore: 0,
          tapNumber: 0,
        });
        expect(mockPrismaService.round.findUnique).toHaveBeenCalledWith({
          where: { id: roundId },
        });
        expect(mockPrismaService.tap.create).not.toHaveBeenCalled();
        expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
      });

      it('должен выбросить ошибку если раунд не найден (Nikita)', async () => {
        mockPrismaService.round.findUnique.mockResolvedValue(null);

        await expect(
          service.tap(roundId, userId, UserRole.NIKITA),
        ).rejects.toThrow(NotFoundException);
      });

      it('должен выбросить ошибку если раунд еще не начался (Nikita)', async () => {
        const futureStartDate = new Date('2025-01-01T13:00:00Z');
        const mockRound = {
          id: roundId,
          startDate: futureStartDate,
          endDate,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          totalScore: 0,
        };

        mockPrismaService.round.findUnique.mockResolvedValue(mockRound);

        await expect(
          service.tap(roundId, userId, UserRole.NIKITA),
        ).rejects.toThrow(BadRequestException);
      });

      it('должен выбросить ошибку если раунд уже завершен (Nikita)', async () => {
        const pastEndDate = new Date('2025-01-01T11:00:00Z');
        const mockRound = {
          id: roundId,
          startDate,
          endDate: pastEndDate,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          totalScore: 0,
        };

        mockPrismaService.round.findUnique.mockResolvedValue(mockRound);

        await expect(
          service.tap(roundId, userId, UserRole.NIKITA),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('для обычных пользователей', () => {
      it('должен создать тап с правильным номером и очками', async () => {
        const mockRound = {
          id: roundId,
          startDate,
          endDate,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          totalScore: 0,
        };

        const mockTap = {
          id: 'tap-id',
          userId,
          roundId,
          score: 1,
          tapNumber: 1,
          createdAt: now,
        };

        mockPrismaService.$transaction.mockImplementation(async (callback) => {
          const tx = {
            round: {
              findUnique: jest.fn().mockResolvedValue(mockRound),
              update: jest.fn().mockResolvedValue(mockRound),
            },
            tap: {
              findFirst: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockResolvedValue(mockTap),
              aggregate: jest.fn().mockResolvedValue({ _sum: { score: 1 } }),
            },
          };
          return callback(tx);
        });

        const result = await service.tap(roundId, userId, UserRole.SURVIVOR);

        expect(result).toEqual({
          tapId: 'tap-id',
          score: 1,
          myTotalScore: 1,
          tapNumber: 1,
        });
        expect(mockPrismaService.$transaction).toHaveBeenCalled();
      });

      it('должен дать 10 очков за 11-й тап', async () => {
        const mockRound = {
          id: roundId,
          startDate,
          endDate,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          totalScore: 10,
        };

        const mockLastTap = {
          id: 'last-tap-id',
          tapNumber: 10,
        };

        const mockTap = {
          id: 'tap-id',
          userId,
          roundId,
          score: 10,
          tapNumber: 11,
          createdAt: now,
        };

        mockPrismaService.$transaction.mockImplementation(async (callback) => {
          const tx = {
            round: {
              findUnique: jest.fn().mockResolvedValue(mockRound),
              update: jest.fn().mockResolvedValue({ ...mockRound, totalScore: 20 }),
            },
            tap: {
              findFirst: jest.fn().mockResolvedValue(mockLastTap),
              create: jest.fn().mockResolvedValue(mockTap),
              aggregate: jest.fn().mockResolvedValue({ _sum: { score: 20 } }),
            },
          };
          return callback(tx);
        });

        const result = await service.tap(roundId, userId, UserRole.SURVIVOR);

        expect(result.score).toBe(10);
        expect(result.tapNumber).toBe(11);
      });

      it('должен выбросить ошибку если раунд не найден', async () => {
        mockPrismaService.$transaction.mockImplementation(async (callback) => {
          const tx = {
            round: {
              findUnique: jest.fn().mockResolvedValue(null),
            },
            tap: {},
          };
          return callback(tx);
        });

        await expect(
          service.tap(roundId, userId, UserRole.SURVIVOR),
        ).rejects.toThrow(NotFoundException);
      });

      it('должен выбросить ошибку если раунд еще не начался', async () => {
        const futureStartDate = new Date('2025-01-01T13:00:00Z');
        const mockRound = {
          id: roundId,
          startDate: futureStartDate,
          endDate,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          totalScore: 0,
        };

        mockPrismaService.$transaction.mockImplementation(async (callback) => {
          const tx = {
            round: {
              findUnique: jest.fn().mockResolvedValue(mockRound),
            },
            tap: {},
          };
          return callback(tx);
        });

        await expect(
          service.tap(roundId, userId, UserRole.SURVIVOR),
        ).rejects.toThrow(BadRequestException);
      });

      it('должен выбросить ошибку если раунд уже завершен', async () => {
        const pastEndDate = new Date('2025-01-01T11:00:00Z');
        const mockRound = {
          id: roundId,
          startDate,
          endDate: pastEndDate,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          totalScore: 0,
        };

        mockPrismaService.$transaction.mockImplementation(async (callback) => {
          const tx = {
            round: {
              findUnique: jest.fn().mockResolvedValue(mockRound),
            },
            tap: {},
          };
          return callback(tx);
        });

        await expect(
          service.tap(roundId, userId, UserRole.SURVIVOR),
        ).rejects.toThrow(BadRequestException);
      });

      it('должен правильно рассчитывать номер следующего тапа', async () => {
        const mockRound = {
          id: roundId,
          startDate,
          endDate,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          totalScore: 5,
        };

        const mockLastTap = {
          id: 'last-tap-id',
          tapNumber: 5,
        };

        const mockTap = {
          id: 'tap-id',
          userId,
          roundId,
          score: 1,
          tapNumber: 6,
          createdAt: now,
        };

        mockPrismaService.$transaction.mockImplementation(async (callback) => {
          const tx = {
            round: {
              findUnique: jest.fn().mockResolvedValue(mockRound),
              update: jest.fn().mockResolvedValue({ ...mockRound, totalScore: 6 }),
            },
            tap: {
              findFirst: jest.fn().mockResolvedValue(mockLastTap),
              create: jest.fn().mockResolvedValue(mockTap),
              aggregate: jest.fn().mockResolvedValue({ _sum: { score: 6 } }),
            },
          };
          return callback(tx);
        });

        const result = await service.tap(roundId, userId, UserRole.SURVIVOR);

        expect(result.tapNumber).toBe(6);
      });

      it('должен правильно обновлять totalScore раунда', async () => {
        const mockRound = {
          id: roundId,
          startDate,
          endDate,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          totalScore: 10,
        };

        const mockTap = {
          id: 'tap-id',
          userId,
          roundId,
          score: 1,
          tapNumber: 1,
          createdAt: now,
        };

        const updateMock = jest.fn().mockResolvedValue({ ...mockRound, totalScore: 11 });

        mockPrismaService.$transaction.mockImplementation(async (callback) => {
          const tx = {
            round: {
              findUnique: jest.fn().mockResolvedValue(mockRound),
              update: updateMock,
            },
            tap: {
              findFirst: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockResolvedValue(mockTap),
              aggregate: jest.fn().mockResolvedValue({ _sum: { score: 1 } }),
            },
          };
          return callback(tx);
        });

        await service.tap(roundId, userId, UserRole.SURVIVOR);

        expect(updateMock).toHaveBeenCalledWith({
          where: { id: roundId },
          data: { totalScore: { increment: 1 } },
        });
      });

      it('должен использовать Serializable isolation level для транзакции', async () => {
        const mockRound = {
          id: roundId,
          startDate,
          endDate,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          totalScore: 0,
        };

        const mockTap = {
          id: 'tap-id',
          userId,
          roundId,
          score: 1,
          tapNumber: 1,
          createdAt: now,
        };

        mockPrismaService.$transaction.mockImplementation(async (callback) => {
          const tx = {
            round: {
              findUnique: jest.fn().mockResolvedValue(mockRound),
              update: jest.fn().mockResolvedValue(mockRound),
            },
            tap: {
              findFirst: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockResolvedValue(mockTap),
              aggregate: jest.fn().mockResolvedValue({ _sum: { score: 1 } }),
            },
          };
          return callback(tx);
        });

        await service.tap(roundId, userId, UserRole.SURVIVOR);

        expect(mockPrismaService.$transaction).toHaveBeenCalledWith(
          expect.any(Function),
          { isolationLevel: 'Serializable' },
        );
      });

      it('должен правильно обрабатывать случай когда myTotalScore равен null', async () => {
        const mockRound = {
          id: roundId,
          startDate,
          endDate,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          totalScore: 0,
        };

        const mockTap = {
          id: 'tap-id',
          userId,
          roundId,
          score: 1,
          tapNumber: 1,
          createdAt: now,
        };

        mockPrismaService.$transaction.mockImplementation(async (callback) => {
          const tx = {
            round: {
              findUnique: jest.fn().mockResolvedValue(mockRound),
              update: jest.fn().mockResolvedValue(mockRound),
            },
            tap: {
              findFirst: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockResolvedValue(mockTap),
              aggregate: jest.fn().mockResolvedValue({ _sum: { score: null } }),
            },
          };
          return callback(tx);
        });

        const result = await service.tap(roundId, userId, UserRole.SURVIVOR);

        expect(result.myTotalScore).toBe(0);
      });

      it('должен правильно обрабатывать тапы для ADMIN роли', async () => {
        const mockRound = {
          id: roundId,
          startDate,
          endDate,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          totalScore: 0,
        };

        const mockTap = {
          id: 'tap-id',
          userId,
          roundId,
          score: 1,
          tapNumber: 1,
          createdAt: now,
        };

        mockPrismaService.$transaction.mockImplementation(async (callback) => {
          const tx = {
            round: {
              findUnique: jest.fn().mockResolvedValue(mockRound),
              update: jest.fn().mockResolvedValue(mockRound),
            },
            tap: {
              findFirst: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockResolvedValue(mockTap),
              aggregate: jest.fn().mockResolvedValue({ _sum: { score: 1 } }),
            },
          };
          return callback(tx);
        });

        const result = await service.tap(roundId, userId, UserRole.ADMIN);

        expect(result.tapId).toBe('tap-id');
        expect(result.score).toBe(1);
      });
    });
  });
});

