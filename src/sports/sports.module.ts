import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sport } from './entities/sport.entity';
import { TeamSportsModule } from '../team-sports/team-sports.module';
import { SportMapper } from './mappers/sport.mapper';
import { SportsRepository } from './repositories/sports.repository';
import { SportsController } from './sports.controller';
import { SportsService } from './sports.service';

/**
 * NestJS module for the sports domain.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Sport]), TeamSportsModule],
  controllers: [SportsController],
  providers: [SportsService, SportMapper, SportsRepository],
  exports: [SportsService],
})
export class SportsModule {}
