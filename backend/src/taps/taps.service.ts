import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, Round } from "@prisma/client";

@Injectable()
export class TapsService {
  private readonly logger = new Logger(TapsService.name);

  constructor(private prisma: PrismaService) {}

  private validateRound(round: Round | null, now: Date) {
    if (!round) {
      throw new NotFoundException('Раунд не найден');
    }
    // Проверяем активность раунда на основе серверного времени
    if (now < round.startDate) {
      throw new BadRequestException('Раунд еще не начался');
    }
    if (now >= round.endDate) {
      throw new BadRequestException('Раунд уже завершен');
    }
  }

  async tap(roundId: string, userId: string, userRole: UserRole) {
    const now = new Date();

    // Для Nikita просто проверяем активность раунда и возвращаем ответ без сохранения
    if (userRole === UserRole.NIKITA) {
      const round = await this.prisma.round.findUnique({
        where: { id: roundId },
      });
      this.validateRound(round, now);

      this.logger.log(`Tap (Nikita): userId=${userId}, roundId=${roundId} - not saved`);
      return {
        tapId: '',
        score: 0,
        myTotalScore: 0,
        tapNumber: 0,
      };
    }

    // Для обычных пользователей выполняем транзакцию с сохранением тапа
    return this.prisma.$transaction(
      async (tx) => {
        // Блокируем запись раунда для чтения с блокировкой
        const round = await tx.round.findUnique({
          where: { id: roundId },
        });
        this.validateRound(round, now);

        // Получаем последний тап пользователя в этом раунде
        const lastTap = await tx.tap.findFirst({
          where: { userId, roundId },
          orderBy: { tapNumber: 'desc' },
        });

        const nextTapNumber = (lastTap?.tapNumber || 0) + 1;
        // Определяем очки: каждый 11-й тап дает 10 очков, остальные - 1
        const score = nextTapNumber % 11 === 0 ? 10 : 1;

        // Создаем тап
        const tap = await tx.tap.create({
          data: {
            userId,
            roundId,
            score,
            tapNumber: nextTapNumber,
            createdAt: now,
          },
        });

        // Обновляем общий счет раунда
        await tx.round.update({
          where: { id: roundId },
          data: { totalScore: { increment: score } },
        });

        // Получаем общий счет пользователя в раунде
        const userTaps = await tx.tap.aggregate({
          where: { userId, roundId },
          _sum: { score: true },
        });

        const myTotalScore = userTaps._sum.score || 0;

        this.logger.log(
          `Tap: userId=${userId}, roundId=${roundId}, score=${score}, tapNumber=${nextTapNumber}`,
        );

        return {
          tapId: tap.id,
          score,
          myTotalScore,
          tapNumber: nextTapNumber,
        };
      },
      {
        isolationLevel: 'Serializable',
      },
    );
  }
}

