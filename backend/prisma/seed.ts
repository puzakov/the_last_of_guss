import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Создаем пользователей
  const adminPassword = await bcrypt.hash('admin123', 10);
  const nikitaPassword = await bcrypt.hash('nikita123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  const nikita = await prisma.user.upsert({
    where: { username: 'Никита' },
    update: {},
    create: {
      username: 'Никита',
      password: nikitaPassword,
      role: UserRole.NIKITA,
    },
  });

  const user1 = await prisma.user.upsert({
    where: { username: 'user1' },
    update: {},
    create: {
      username: 'user1',
      password: userPassword,
      role: UserRole.SURVIVOR,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { username: 'user2' },
    update: {},
    create: {
      username: 'user2',
      password: userPassword,
      role: UserRole.SURVIVOR,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { username: 'user3' },
    update: {},
    create: {
      username: 'user3',
      password: userPassword,
      role: UserRole.SURVIVOR,
    },
  });

  console.log('Users created:', { admin, nikita, user1, user2, user3 });

  // Создаем завершенный раунд с тапами
  const now = new Date();
  const finishedRoundStart = new Date(now.getTime() - 60 * 60 * 1000); // 1 час назад
  const finishedRoundEnd = new Date(finishedRoundStart.getTime() + 60 * 1000); // +1 минута

  const finishedRound = await prisma.round.create({
    data: {
      startDate: finishedRoundStart,
      endDate: finishedRoundEnd,
      createdAt: new Date(finishedRoundStart.getTime() - 30 * 1000), // -30 секунд cooldown
      totalScore: 0,
    },
  });

  // Добавляем тапы для завершенного раунда
  // user1 делает 15 тапов (1+1+1+1+1+1+1+1+1+1+10+1+1+1+1 = 23 очка)
  for (let i = 1; i <= 15; i++) {
    const score = i % 11 === 0 ? 10 : 1;
    await prisma.tap.create({
      data: {
        userId: user1.id,
        roundId: finishedRound.id,
        score,
        tapNumber: i,
        createdAt: new Date(finishedRoundStart.getTime() + i * 1000),
      },
    });
    finishedRound.totalScore += score;
  }

  // user2 делает 10 тапов (1+1+1+1+1+1+1+1+1+1 = 10 очков)
  for (let i = 1; i <= 10; i++) {
    await prisma.tap.create({
      data: {
        userId: user2.id,
        roundId: finishedRound.id,
        score: 1,
        tapNumber: i,
        createdAt: new Date(finishedRoundStart.getTime() + 2000 + i * 1000), // начинаем через 2 сек после user1
      },
    });
    finishedRound.totalScore += 1;
  }

  // nikita делает 5 тапов (все по 0 очков)
  for (let i = 1; i <= 5; i++) {
    await prisma.tap.create({
      data: {
        userId: nikita.id,
        roundId: finishedRound.id,
        score: 0,
        tapNumber: i,
        createdAt: new Date(finishedRoundStart.getTime() + 5000 + i * 1000),
      },
    });
  }

  // Обновляем totalScore раунда
  await prisma.round.update({
    where: { id: finishedRound.id },
    data: { totalScore: finishedRound.totalScore },
  });

  // Определяем победителя (user1 с 23 очками)
  await prisma.round.update({
    where: { id: finishedRound.id },
    data: { winnerId: user1.id },
  });

  console.log('Finished round created:', finishedRound.id);

  // Создаем активный раунд
  const activeRoundStart = new Date(now.getTime() - 2 * 1000); // 2 секунды назад
  const activeRoundEnd = new Date(activeRoundStart.getTime() + 60 * 1000); // +1 минута

  const activeRound = await prisma.round.create({
    data: {
      startDate: activeRoundStart,
      endDate: activeRoundEnd,
      createdAt: new Date(activeRoundStart.getTime() - 32 * 1000),
      totalScore: 0,
    },
  });

  console.log('Active round created:', activeRound.id);

  // Создаем запланированный раунд (cooldown)
  const futureRoundStart = new Date(now.getTime() + 5 * 60 * 1000); // через 5 минут
  const futureRoundEnd = new Date(futureRoundStart.getTime() + 60 * 1000);

  const futureRound = await prisma.round.create({
    data: {
      startDate: futureRoundStart,
      endDate: futureRoundEnd,
      createdAt: now,
      totalScore: 0,
    },
  });

  console.log('Future round created:', futureRound.id);
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

