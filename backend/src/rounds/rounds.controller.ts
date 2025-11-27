import { Controller, Get, Post, Param, Req } from '@nestjs/common';
import { RoundsService } from './rounds.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from "@prisma/client";

@Controller('rounds')
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @Get()
  findAll() {
    return this.roundsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.roundsService.findOne(id, req.user.userId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Req() req: any) {
    return this.roundsService.create(req.user.role);
  }
}

