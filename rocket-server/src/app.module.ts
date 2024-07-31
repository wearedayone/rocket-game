import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import RoundRepository from './repository/round.repository';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, RoundRepository],
})
export class AppModule {}
