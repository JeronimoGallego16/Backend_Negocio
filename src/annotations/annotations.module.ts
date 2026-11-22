import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchesModule } from '../matches/matches.module';
import { PlayerTeamsModule } from '../player-teams/player-teams.module';
import { PlayersModule } from '../players/players.module';
import { Annotation } from './entities/annotation.entity';
import { AnnotationsController } from './annotations.controller';
import { AnnotationsService } from './annotations.service';
import { AnnotationMapper } from './mappers/annotation.mapper';
import { AnnotationsRepository } from './repositories/annotations.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Annotation]),
    MatchesModule,
    PlayersModule,
    PlayerTeamsModule,
  ],
  controllers: [AnnotationsController],
  providers: [AnnotationsService, AnnotationMapper, AnnotationsRepository],
})
export class AnnotationsModule {}
