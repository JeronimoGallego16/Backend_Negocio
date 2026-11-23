import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../matches/entities/match.entity';
import { GroupPhase } from '../phases/entities/group-phase.entity';
import { Team } from '../teams/entities/team.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { CompetitionGroup } from './entities/competition-group.entity';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { CompetitionGroupMapper } from './mappers/competition-group.mapper';

/**
 * NestJS module for competition group CRUD and assignments.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompetitionGroup,
      GroupPhase,
      Team,
      TeamSport,
      Tournament,
      Match,
    ]),
  ],
  controllers: [GroupsController],
  providers: [GroupsService, CompetitionGroupMapper],
  exports: [GroupsService],
})
export class GroupsModule {}
