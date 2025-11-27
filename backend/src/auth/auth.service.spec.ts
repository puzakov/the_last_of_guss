import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findByUsername: jest.fn(),
    create: jest.fn(),
    validatePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      username: 'testuser',
      password: 'password123',
    };

    it('должен создать нового пользователя если его нет', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        password: 'hashed-password',
        role: UserRole.SURVIVOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockToken = 'jwt-token';

      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        token: mockToken,
        user: {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
        },
      });
      expect(mockUsersService.create).toHaveBeenCalledWith(
        loginDto.username,
        loginDto.password,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        userId: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });
    });

    it('должен войти существующего пользователя с правильным паролем', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        password: 'hashed-password',
        role: UserRole.SURVIVOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockToken = 'jwt-token';

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        token: mockToken,
        user: {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
        },
      });
      expect(mockUsersService.validatePassword).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('должен выбросить ошибку при неверном пароле', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        password: 'hashed-password',
        role: UserRole.SURVIVOR,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUsersService.create).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('должен правильно определять роль при создании пользователя', async () => {
      const adminDto: LoginDto = {
        username: 'admin',
        password: 'admin123',
      };

      const mockAdminUser = {
        id: 'admin-id',
        username: 'admin',
        password: 'hashed-password',
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockAdminUser);
      mockJwtService.sign.mockReturnValue('token');

      const result = await service.login(adminDto);

      expect(result.user.role).toBe(UserRole.ADMIN);
    });
  });
});

