import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { TeamSportsModule } from '../team-sports/team-sports.module';
import { TeamMapper } from './mappers/team.mapper';
import { TeamsRepository } from './repositories/teams.repository';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

/**
 * NestJS module for the teams domain.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Team]), TeamSportsModule],
  controllers: [TeamsController],
  providers: [TeamsService, TeamMapper, TeamsRepository],
  exports: [TeamsService],
})
export class TeamsModule {}
