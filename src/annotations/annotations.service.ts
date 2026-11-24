import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { PlayersService } from '../players/players.service';
import { PlayerTeamsService } from '../player-teams/player-teams.service';
import { UpdateAnnotationDto } from './dto/update-annotation.dto';
import { AnnotationDto } from './dto/annotation.dto';
import { AnnotationResponseDto } from './dto/annotation-response.dto';
import { Annotation } from './entities/annotation.entity';
import { AnnotationMapper } from './mappers/annotation.mapper';
import { AnnotationsRepository } from './repositories/annotations.repository';
import { MatchesService } from '../matches/matches.service';

@Injectable()
export class AnnotationsService {
  constructor(
    @InjectRepository(Annotation)
    private readonly annotationRepository: Repository<Annotation>,
    private readonly annotationsRepository: AnnotationsRepository,
    private readonly matchesService: MatchesService,
    private readonly playersService: PlayersService,
    private readonly playerTeamsService: PlayerTeamsService,
    private readonly annotationMapper: AnnotationMapper,
  ) {}

  async create(
    matchId: number,
    dto: AnnotationDto,
  ): Promise<AnnotationResponseDto> {
    if (
      dto.playerId === undefined ||
      dto.minute === undefined ||
      !dto.type?.trim()
    ) {
      throw ApplicationErrors.invalidInput(
        'playerId, minute and type are required for creation',
      );
    }

    const match = await this.matchesService.findOne(matchId);
    if (match.state.trim().toUpperCase() !== 'ACTIVE') {
      throw ApplicationErrors.conflict(
        'Annotations can only be created while the match is active',
      );
    }
    if (match.homeTeamId === null || match.awayTeamId === null) {
      throw ApplicationErrors.conflict(
        'Annotations can only be created after both match teams are assigned',
      );
    }

    await this.playersService.findOne(dto.playerId);
    const currentDate = new Date().toISOString().slice(0, 10);
    const belongsToMatchTeam = await Promise.all([
      this.playerTeamsService.belongsToTeam(
        dto.playerId,
        match.homeTeamId,
        currentDate,
      ),
      this.playerTeamsService.belongsToTeam(
        dto.playerId,
        match.awayTeamId,
        currentDate,
      ),
    ]);
    if (!belongsToMatchTeam.some(Boolean)) {
      throw ApplicationErrors.invalidInput(
        'The player must belong to one of the match teams',
      );
    }

    const saved = await this.annotationRepository.save(
      this.annotationMapper.toEntity(matchId, dto),
    );
    const reloaded = await this.annotationsRepository.findOneWithPlayer(
      saved.annotationId,
    );
    if (!reloaded) {
      throw new Error('Saved scoring record could not be reloaded');
    }
    return this.annotationMapper.toResponseDto(reloaded);
  }

  async findByMatch(matchId: number): Promise<AnnotationResponseDto[]> {
    await this.matchesService.findOne(matchId);
    const annotations = await this.annotationsRepository.findByMatch(matchId);
    return this.annotationMapper.toResponseDtoList(annotations);
  }

  async update(
    annotationId: number,
    dto: UpdateAnnotationDto,
  ): Promise<AnnotationResponseDto> {
    const annotation =
      await this.annotationsRepository.findOneWithPlayer(annotationId);
    if (!annotation) {
      throw ApplicationErrors.notFound(
        `Scoring record with id ${annotationId} not found`,
      );
    }
    if (annotation.voided) {
      throw ApplicationErrors.conflict(
        'A voided scoring record cannot be modified',
      );
    }

    const saved = await this.annotationRepository.save(
      this.annotationMapper.mergeEntity(annotation, dto),
    );
    return this.annotationMapper.toResponseDto(saved);
  }

  async voidAnnotation(annotationId: number): Promise<void> {
    const annotation =
      await this.annotationsRepository.findOneWithPlayer(annotationId);
    if (!annotation) {
      throw ApplicationErrors.notFound(
        `Scoring record with id ${annotationId} not found`,
      );
    }

    annotation.voided = true;
    await this.annotationRepository.save(annotation);
  }
}
