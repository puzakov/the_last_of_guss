import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from "@prisma/client";
import { ConfigService } from '@nestjs/config';

export enum RoundStatus {
  COOLDOWN = 'COOLDOWN',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
}

@Injectable()
export class RoundsService {
  private readonly logger = new Logger(RoundsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async findAll() {
    const rounds = await this.prisma.round.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        winner: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return rounds.map((round) => ({
      ...round,
      status: this.getRoundStatus(round),
    }));
  }

  async findOne(id: string, userId: string) {
    const round = await this.prisma.round.findUnique({
      where: { id },
      include: {
        winner: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!round) {
      throw new NotFoundException('Раунд не найден');
    }

    // Вычисляем победителя если раунд завершен и победитель не установлен
    if (this.getRoundStatus(round) === RoundStatus.FINISHED && !round.winnerId) {
      await this.calculateWinner(round.id);
      // Перезагружаем раунд с победителем
      const updatedRound = await this.prisma.round.findUnique({
        where: { id },
        include: {
          winner: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });
      const winnerScore = updatedRound?.winnerId
        ? await this.getUserScore(id, updatedRound.winnerId)
        : 0;
      return {
        ...updatedRound,
        status: RoundStatus.FINISHED,
        myScore: await this.getUserScore(id, userId),
        winnerScore,
      };
    }

    const winnerScore = round.winnerId ? await this.getUserScore(id, round.winnerId) : 0;

    return {
      ...round,
      status: this.getRoundStatus(round),
      myScore: await this.getUserScore(id, userId),
      winnerScore,
    };
  }

  async create(userRole: UserRole) {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Только администратор может создавать раунды');
    }

    const cooldownDuration = this.configService.get<number>('COOLDOWN_DURATION') || 30;
    const roundDuration = this.configService.get<number>('ROUND_DURATION') || 60;

    const now = new Date();
    const startDate = new Date(now.getTime() + cooldownDuration * 1000);
    const endDate = new Date(startDate.getTime() + roundDuration * 1000);

    const round = await this.prisma.round.create({
      data: {
        startDate,
        endDate,
        createdAt: now,
        totalScore: 0,
      },
    });

    this.logger.log(`Round created: id=${round.id}, startDate=${startDate.toISOString()}`);

    return {
      ...round,
      status: this.getRoundStatus(round),
    };
  }

  getRoundStatus(round: { startDate: Date; endDate: Date; createdAt: Date }): RoundStatus {
    const now = new Date();
    if (now < round.startDate) {
      return RoundStatus.COOLDOWN;
    }
    if (now >= round.startDate && now < round.endDate) {
      return RoundStatus.ACTIVE;
    }
    return RoundStatus.FINISHED;
  }

  private async getUserScore(roundId: string, userId: string): Promise<number> {
    const result = await this.prisma.tap.aggregate({
      where: {
        roundId,
        userId,
      },
      _sum: {
        score: true,
      },
    });

    return result._sum.score || 0;
  }

  private async calculateWinner(roundId: string) {
    // Находим пользователя с максимальными очками
    // При равенстве очков выбираем того, кто первый тапнул
    const winnerData = await this.prisma.tap.groupBy({
      by: ['userId'],
      where: { roundId },
      _sum: {
        score: true,
      },
      _min: {
        createdAt: true,
      },
      orderBy: [
        {
          _sum: {
            score: 'desc',
          },
        },
        {
          _min: {
            createdAt: 'asc',
          },
        },
      ],
      take: 1,
    });

    if (winnerData.length > 0 && winnerData[0]._sum.score && winnerData[0]._sum.score > 0) {
      await this.prisma.round.update({
        where: { id: roundId },
        data: { winnerId: winnerData[0].userId },
      });
    }
  }
}

