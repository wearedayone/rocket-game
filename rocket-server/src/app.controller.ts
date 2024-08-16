import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import Round from './model/round.model';
import FireRocketDto from './dto/fire-rocket.dto';
import RoundRepository from './repository/round.repository';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private roundRepo: RoundRepository,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('fires')
  async fireRocket(@Body() dto: FireRocketDto) {
    const round = new Round(dto.hitTargets);
    await this.roundRepo.save(round);
  }

  @Get('rounds')
  async listRound(): Promise<Round[]> {
    return this.roundRepo.list();
  }
}
