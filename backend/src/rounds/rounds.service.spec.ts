import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { RoundsService, RoundStatus } from './rounds.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';

describe('RoundsService', () => {
  let service: RoundsService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockPrismaService = {
    round: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    tap: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoundsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RoundsService>(RoundsService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('должен вернуть список всех раундов с вычисленным статусом', async () => {
      const now = new Date('2025-01-01T12:00:00Z');
      const startDate = new Date('2025-01-01T11:00:00Z');
      const endDate = new Date('2025-01-01T13:00:00Z');

      const mockRounds = [
        {
          id: 'round-1',
          startDate,
          endDate,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          totalScore: 100,
          winner: null,
          winnerId: null,
        },
        {
          id: 'round-2',
          startDate: new Date('2025-01-01T14:00:00Z'),
          endDate: new Date('2025-01-01T15:00:00Z'),
          createdAt: new Date('2025-01-01T13:30:00Z'),
          totalScore: 0,
          winner: null,
          winnerId: null,
        },
      ];

      mockPrismaService.round.findMany.mockResolvedValue(mockRounds);

      jest.useFakeTimers();
      jest.setSystemTime(now);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe(RoundStatus.ACTIVE);
      expect(result[1].status).toBe(RoundStatus.COOLDOWN);

      jest.useRealTimers();
    });
  });

  describe('findOne', () => {
    const roundId = 'round-id';
    const userId = 'user-id';

    it('должен вернуть информацию о раунде с моими очками', async () => {
      const now = new Date('2025-01-01T12:00:00Z');
      const startDate = new Date('2025-01-01T11:00:00Z');
      const endDate = new Date('2025-01-01T13:00:00Z');

      const mockRound = {
        id: roundId,
        startDate,
        endDate,
        createdAt: new Date('2025-01-01T10:00:00Z'),
        totalScore: 100,
        winner: null,
        winnerId: null,
      };

      mockPrismaService.round.findUnique.mockResolvedValue(mockRound);
      mockPrismaService.tap.aggregate.mockResolvedValue({ _sum: { score: 50 } });

      jest.useFakeTimers();
      jest.setSystemTime(now);

      const result = await service.findOne(roundId, userId);

      expect(result.status).toBe(RoundStatus.ACTIVE);
      expect(result.myScore).toBe(50);
      expect(mockPrismaService.tap.aggregate).toHaveBeenCalledWith({
        where: { roundId, userId },
        _sum: { score: true },
      });

      jest.useRealTimers();
    });

    it('должен выбросить ошибку если раунд не найден', async () => {
      mockPrismaService.round.findUnique.mockResolvedValue(null);

      await expect(service.findOne(roundId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('должен вычислить победителя для завершенного раунда', async () => {
      const now = new Date('2025-01-01T14:00:00Z');
      const startDate = new Date('2025-01-01T11:00:00Z');
      const endDate = new Date('2025-01-01T13:00:00Z');

      const mockRound = {
        id: roundId,
        startDate,
        endDate,
        createdAt: new Date('2025-01-01T10:00:00Z'),
        totalScore: 100,
        winner: null,
        winnerId: null,
      };

      const mockWinnerData = [
        {
          userId: 'winner-id',
          _sum: { score: 50 },
          _min: { createdAt: new Date('2025-01-01T11:00:00Z') },
        },
      ];

      const mockUpdatedRound = {
        ...mockRound,
        winnerId: 'winner-id',
        winner: { id: 'winner-id', username: 'winner' },
      };

      mockPrismaService.round.findUnique
        .mockResolvedValueOnce(mockRound)
        .mockResolvedValueOnce(mockUpdatedRound);
      mockPrismaService.tap.groupBy.mockResolvedValue(mockWinnerData);
      mockPrismaService.tap.aggregate
        .mockResolvedValueOnce({ _sum: { score: 50 } }) // для winnerScore
        .mockResolvedValueOnce({ _sum: { score: 30 } }); // для myScore

      jest.useFakeTimers();
      jest.setSystemTime(now);

      const result = await service.findOne(roundId, userId);

      expect(result.status).toBe(RoundStatus.FINISHED);
      expect(result.winnerId).toBe('winner-id');
      expect(result.winnerScore).toBe(50);
      expect(mockPrismaService.round.update).toHaveBeenCalledWith({
        where: { id: roundId },
        data: { winnerId: 'winner-id' },
      });

      jest.useRealTimers();
    });

    it('должен вернуть существующего победителя без пересчета', async () => {
      const now = new Date('2025-01-01T14:00:00Z');
      const startDate = new Date('2025-01-01T11:00:00Z');
      const endDate = new Date('2025-01-01T13:00:00Z');

      const mockRound = {
        id: roundId,
        startDate,
        endDate,
        createdAt: new Date('2025-01-01T10:00:00Z'),
        totalScore: 100,
        winner: { id: 'winner-id', username: 'winner' },
        winnerId: 'winner-id',
      };

      mockPrismaService.round.findUnique.mockResolvedValue(mockRound);
      mockPrismaService.tap.aggregate
        .mockResolvedValueOnce({ _sum: { score: 50 } }) // для winnerScore
        .mockResolvedValueOnce({ _sum: { score: 30 } }); // для myScore

      jest.useFakeTimers();
      jest.setSystemTime(now);

      const result = await service.findOne(roundId, userId);

      expect(result.winnerId).toBe('winner-id');
      expect(mockPrismaService.tap.groupBy).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('create', () => {
    it('должен создать раунд для администратора', async () => {
      const cooldownDuration = 30;
      const roundDuration = 60;
      const now = new Date('2025-01-01T12:00:00Z');

      mockConfigService.get
        .mockReturnValueOnce(cooldownDuration)
        .mockReturnValueOnce(roundDuration);

      const mockRound = {
        id: 'new-round-id',
        startDate: new Date(now.getTime() + cooldownDuration * 1000),
        endDate: new Date(now.getTime() + (cooldownDuration + roundDuration) * 1000),
        createdAt: now,
        totalScore: 0,
      };

      mockPrismaService.round.create.mockResolvedValue(mockRound);

      jest.useFakeTimers();
      jest.setSystemTime(now);

      const result = await service.create(UserRole.ADMIN);

      expect(result.id).toBe('new-round-id');
      expect(mockPrismaService.round.create).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('должен выбросить ошибку если пользователь не администратор', async () => {
      await expect(service.create(UserRole.SURVIVOR)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.create(UserRole.NIKITA)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrismaService.round.create).not.toHaveBeenCalled();
    });

    it('должен использовать значения по умолчанию если конфигурация не задана', async () => {
      const now = new Date('2025-01-01T12:00:00Z');
      mockConfigService.get.mockReturnValue(undefined);

      const mockRound = {
        id: 'new-round-id',
        startDate: new Date(now.getTime() + 30 * 1000),
        endDate: new Date(now.getTime() + 90 * 1000),
        createdAt: now,
        totalScore: 0,
      };

      mockPrismaService.round.create.mockResolvedValue(mockRound);

      jest.useFakeTimers();
      jest.setSystemTime(now);

      await service.create(UserRole.ADMIN);

      expect(mockPrismaService.round.create).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('getRoundStatus', () => {
    it('должен вернуть COOLDOWN если раунд еще не начался', () => {
      const now = new Date('2025-01-01T12:00:00Z');
      const startDate = new Date('2025-01-01T13:00:00Z');
      const endDate = new Date('2025-01-01T14:00:00Z');

      jest.useFakeTimers();
      jest.setSystemTime(now);

      const status = service.getRoundStatus({
        startDate,
        endDate,
        createdAt: new Date('2025-01-01T11:00:00Z'),
      });

      expect(status).toBe(RoundStatus.COOLDOWN);
      jest.useRealTimers();
    });

    it('должен вернуть ACTIVE если раунд активен', () => {
      const now = new Date('2025-01-01T12:30:00Z');
      const startDate = new Date('2025-01-01T12:00:00Z');
      const endDate = new Date('2025-01-01T13:00:00Z');

      jest.useFakeTimers();
      jest.setSystemTime(now);

      const status = service.getRoundStatus({
        startDate,
        endDate,
        createdAt: new Date('2025-01-01T11:00:00Z'),
      });

      expect(status).toBe(RoundStatus.ACTIVE);
      jest.useRealTimers();
    });

    it('должен вернуть FINISHED если раунд завершен', () => {
      const now = new Date('2025-01-01T14:00:00Z');
      const startDate = new Date('2025-01-01T12:00:00Z');
      const endDate = new Date('2025-01-01T13:00:00Z');

      jest.useFakeTimers();
      jest.setSystemTime(now);

      const status = service.getRoundStatus({
        startDate,
        endDate,
        createdAt: new Date('2025-01-01T11:00:00Z'),
      });

      expect(status).toBe(RoundStatus.FINISHED);
      jest.useRealTimers();
    });
  });

  describe('calculateWinner', () => {
    it('должен определить победителя по максимальным очкам', async () => {
      const roundId = 'round-id';
      const mockWinnerData = [
        {
          userId: 'winner-id',
          _sum: { score: 50 },
          _min: { createdAt: new Date('2025-01-01T11:00:00Z') },
        },
        {
          userId: 'loser-id',
          _sum: { score: 30 },
          _min: { createdAt: new Date('2025-01-01T11:00:00Z') },
        },
      ];

      mockPrismaService.tap.groupBy.mockResolvedValue(mockWinnerData);
      mockPrismaService.round.update.mockResolvedValue({});

      // Используем рефлексию для вызова приватного метода
      await (service as any).calculateWinner(roundId);

      expect(mockPrismaService.round.update).toHaveBeenCalledWith({
        where: { id: roundId },
        data: { winnerId: 'winner-id' },
      });
    });

    it('должен выбрать победителя по времени первого тапа при равенстве очков', async () => {
      const roundId = 'round-id';
      const mockWinnerData = [
        {
          userId: 'user-2-id',
          _sum: { score: 50 },
          _min: { createdAt: new Date('2025-01-01T11:00:00Z') },
        },
        {
          userId: 'user-1-id',
          _sum: { score: 50 },
          _min: { createdAt: new Date('2025-01-01T11:05:00Z') },
        },
      ];

      mockPrismaService.tap.groupBy.mockResolvedValue(mockWinnerData);
      mockPrismaService.round.update.mockResolvedValue({});

      await (service as any).calculateWinner(roundId);

      expect(mockPrismaService.round.update).toHaveBeenCalledWith({
        where: { id: roundId },
        data: { winnerId: 'user-2-id' },
      });
    });

    it('не должен устанавливать победителя если нет тапов с очками', async () => {
      const roundId = 'round-id';
      mockPrismaService.tap.groupBy.mockResolvedValue([]);

      await (service as any).calculateWinner(roundId);

      expect(mockPrismaService.round.update).not.toHaveBeenCalled();
    });

    it('не должен устанавливать победителя если все очки равны 0', async () => {
      const roundId = 'round-id';
      const mockWinnerData = [
        {
          userId: 'user-id',
          _sum: { score: 0 },
          _min: { createdAt: new Date('2025-01-01T11:00:00Z') },
        },
      ];

      mockPrismaService.tap.groupBy.mockResolvedValue(mockWinnerData);

      await (service as any).calculateWinner(roundId);

      expect(mockPrismaService.round.update).not.toHaveBeenCalled();
    });

    it('не должен устанавливать победителя если _sum.score равен null', async () => {
      const roundId = 'round-id';
      const mockWinnerData = [
        {
          userId: 'user-id',
          _sum: { score: null },
          _min: { createdAt: new Date('2025-01-01T11:00:00Z') },
        },
      ];

      mockPrismaService.tap.groupBy.mockResolvedValue(mockWinnerData);

      await (service as any).calculateWinner(roundId);

      expect(mockPrismaService.round.update).not.toHaveBeenCalled();
    });
  });

  describe('getUserScore', () => {
    it('должен вернуть 0 если у пользователя нет тапов', async () => {
      mockPrismaService.tap.aggregate.mockResolvedValue({ _sum: { score: null } });

      const score = await (service as any).getUserScore('round-id', 'user-id');

      expect(score).toBe(0);
    });

    it('должен вернуть сумму очков пользователя', async () => {
      mockPrismaService.tap.aggregate.mockResolvedValue({ _sum: { score: 42 } });

      const score = await (service as any).getUserScore('round-id', 'user-id');

      expect(score).toBe(42);
    });
  });
});

