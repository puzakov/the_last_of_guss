import { Controller, Post, Param, Req } from '@nestjs/common';
import { TapsService } from './taps.service';

@Controller('rounds/:roundId/tap')
export class TapsController {
  constructor(private readonly tapsService: TapsService) {}

  @Post()
  async tap(@Param('roundId') roundId: string, @Req() req: any) {
    return this.tapsService.tap(roundId, req.user.userId, req.user.role);
  }
}

