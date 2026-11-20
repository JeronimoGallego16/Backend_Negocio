import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { Team } from '../teams/entities/team.entity';
import { MatchMapper } from './mappers/match.mapper';
import { Phase } from '../phases/entities/phase.entity';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { Tournament } from '../tournaments/entities/tournament.entity';

/**
 * NestJS module for the matches domain.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Match, Team, Phase, Tournament]),
  ],
  controllers: [MatchesController],
  providers: [MatchesService, MatchMapper],
  exports: [MatchesService],
})
export class MatchesModule {}
