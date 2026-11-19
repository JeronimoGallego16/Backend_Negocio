import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sport } from '../sports/entities/sport.entity';
import { Team } from '../teams/entities/team.entity';
import { TeamSport } from './entities/team-sport.entity';
import { TeamSportMapper } from './mappers/team-sport.mapper';
import { TeamSportsController } from './team-sports.controller';
import { TeamSportsService } from './team-sports.service';

/**
 * NestJS module for team-sport assignments.
 */
@Module({
  imports: [TypeOrmModule.forFeature([TeamSport, Team, Sport])],
  controllers: [TeamSportsController],
  providers: [TeamSportsService, TeamSportMapper],
  exports: [TeamSportsService, TeamSportMapper],
})
export class TeamSportsModule {}
