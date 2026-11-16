import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayersModule } from '../players/players.module';
import { Anotacion } from './entities/anotacion.entity';
import { Match } from './entities/match.entity';
import { MatchMapper } from './mappers/match.mapper';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

/**
 * NestJS module for the matches domain.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Match, Anotacion]), PlayersModule],
  controllers: [MatchesController],
  providers: [MatchesService, MatchMapper],
  exports: [MatchesService],
})
export class MatchesModule {}
