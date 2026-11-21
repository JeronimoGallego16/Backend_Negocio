import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registration } from '../registrations/entities/registration.entity';
import { Sport } from '../sports/entities/sport.entity';
import { Phase } from '../phases/entities/phase.entity';
import { Tournament } from './entities/tournament.entity';
import { TournamentMapper } from './mappers/tournament.mapper';
import { TournamentsController } from './tournaments.controller';
import { TournamentsRepository } from './repositories/tournaments.repository';
import { Match } from '../matches/entities/match.entity';
import { CompetitionGroup } from '../groups/entities/competition-group.entity';
import { Team } from '../teams/entities/team.entity';
import { TournamentsService } from './tournaments.service';

/**
 * NestJS module for the tournaments domain.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tournament,
      Registration,
      Sport,
      Phase,
      Match,
      CompetitionGroup,
      Team,
    ]),
  ],
  controllers: [TournamentsController],
  providers: [TournamentsService, TournamentMapper, TournamentsRepository],
  exports: [TournamentsService],
})
export class TournamentsModule {}
