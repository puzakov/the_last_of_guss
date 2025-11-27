import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUsername', () => {
    it('должен вернуть пользователя по username', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        password: 'hashed-password',
        role: UserRole.SURVIVOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('должен вернуть null если пользователь не найден', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('должен вернуть пользователя по id', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        password: 'hashed-password',
        role: UserRole.SURVIVOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('user-id');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id' },
      });
    });
  });

  describe('create', () => {
    it('должен создать пользователя с хешированным паролем', async () => {
      const hashedPassword = 'hashed-password-123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        password: hashedPassword,
        role: UserRole.SURVIVOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create('testuser', 'password123');

      expect(result).toEqual(mockUser);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: 'testuser',
          password: hashedPassword,
          role: UserRole.SURVIVOR,
        },
      });
    });

    it('должен определить роль ADMIN для username "admin"', async () => {
      const hashedPassword = 'hashed-password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const mockUser = {
        id: 'admin-id',
        username: 'admin',
        password: hashedPassword,
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.create.mockResolvedValue(mockUser);

      await service.create('admin', 'password123');

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: 'admin',
          password: hashedPassword,
          role: UserRole.ADMIN,
        },
      });
    });

    it('должен определить роль NIKITA для username "Никита"', async () => {
      const hashedPassword = 'hashed-password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const mockUser = {
        id: 'nikita-id',
        username: 'Никита',
        password: hashedPassword,
        role: UserRole.NIKITA,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.create.mockResolvedValue(mockUser);

      await service.create('Никита', 'password123');

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: 'Никита',
          password: hashedPassword,
          role: UserRole.NIKITA,
        },
      });
    });

    it('должен определить роль NIKITA для username "nikita" (латиница)', async () => {
      const hashedPassword = 'hashed-password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      mockPrismaService.user.create.mockResolvedValue({
        id: 'nikita-id',
        username: 'nikita',
        password: hashedPassword,
        role: UserRole.NIKITA,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.create('nikita', 'password123');

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: 'nikita',
          password: hashedPassword,
          role: UserRole.NIKITA,
        },
      });
    });

    it('должен определить роль SURVIVOR для обычного username', async () => {
      const hashedPassword = 'hashed-password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-id',
        username: 'regularuser',
        password: hashedPassword,
        role: UserRole.SURVIVOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.create('regularuser', 'password123');

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: 'regularuser',
          password: hashedPassword,
          role: UserRole.SURVIVOR,
        },
      });
    });
  });

  describe('validatePassword', () => {
    it('должен вернуть true для правильного пароля', async () => {
      const password = 'password123';
      const hashedPassword = 'hashed-password';
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validatePassword(password, hashedPassword);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('должен вернуть false для неправильного пароля', async () => {
      const password = 'wrong-password';
      const hashedPassword = 'hashed-password';
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validatePassword(password, hashedPassword);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });
  });
});

