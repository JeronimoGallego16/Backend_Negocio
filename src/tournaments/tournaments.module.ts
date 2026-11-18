import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registration } from '../registrations/entities/registration.entity';
import { Sport } from '../sports/entities/sport.entity';
import { Tournament } from './entities/tournament.entity';
import { TournamentMapper } from './mappers/tournament.mapper';
import { TournamentsController } from './tournaments.controller';
import { TournamentsRepository } from './repositories/tournaments.repository';
import { TournamentsService } from './tournaments.service';

/**
 * NestJS module for the tournaments domain.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Tournament, Registration, Sport])],
  controllers: [TournamentsController],
  providers: [TournamentsService, TournamentMapper, TournamentsRepository],
  exports: [TournamentsService],
})
export class TournamentsModule {}
