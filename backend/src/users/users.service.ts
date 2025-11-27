import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from "@prisma/client";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(username: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = this.determineRole(username);

    return this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
      },
    });
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  private determineRole(username: string): UserRole {
    const lowerUsername = username.toLowerCase();
    if (lowerUsername === 'admin') {
      return UserRole.ADMIN;
    }
    if (lowerUsername === 'никита' || lowerUsername === 'nikita') {
      return UserRole.NIKITA;
    }
    return UserRole.SURVIVOR;
  }
}

