import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayersModule } from '../players/players.module';
import { AnotacionesController } from './anotaciones.controller';
import { AnotacionesService } from './anotaciones.service';
import { Anotacion } from './entities/anotacion.entity';
import { Match } from './entities/match.entity';
import { AnotacionMapper } from './mappers/anotacion.mapper';
import { MatchMapper } from './mappers/match.mapper';
import { AnotacionesRepository } from './repositories/anotaciones.repository';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

/**
 * NestJS module for the matches domain.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Match, Anotacion]), PlayersModule],
  controllers: [MatchesController, AnotacionesController],
  providers: [
    MatchesService,
    MatchMapper,
    AnotacionesService,
    AnotacionesRepository,
    AnotacionMapper,
  ],
  exports: [MatchesService],
})
export class MatchesModule {}
