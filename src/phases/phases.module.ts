import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../matches/entities/match.entity';
import { Team } from '../teams/entities/team.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { CompetitionGroup } from '../groups/entities/competition-group.entity';
import { FinalPhase } from './entities/final.entity';
import { GroupPhase } from './entities/group-phase.entity';
import { Phase } from './entities/phase.entity';
import { PhaseMapper } from './mappers/phase.mapper';
import { PhasesController } from './phases.controller';
import { PhasesRepository } from './repositories/phases.repository';
import { PhasesService } from './phases.service';

/**
 * NestJS module for tournament phases and group assignments.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Phase,
      GroupPhase,
      FinalPhase,
      CompetitionGroup,
      Tournament,
      Team,
      Match,
    ]),
  ],
  controllers: [PhasesController],
  providers: [
    PhasesService,
    PhasesRepository,
    PhaseMapper,
  ],
  exports: [PhasesService],
})
export class PhasesModule {}
