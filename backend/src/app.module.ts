import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RoundsModule } from './rounds/rounds.module';
import { TapsModule } from './taps/taps.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtPublicGuard } from './common/guards/jwt-public.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RoundsModule,
    TapsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtPublicGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
