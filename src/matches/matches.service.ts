import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { MatchDto } from './dto/match.dto';
import { MatchResponseDto } from './dto/match-response.dto';
import { Match } from './entities/match.entity';
import { MatchMapper } from './mappers/match.mapper';
import { Phase } from '../phases/entities/phase.entity';

/**
 * Business logic for managing matches.
 */
@Injectable()
export class MatchesService {
  /**
   * Creates the matches service.
   *
   * @param matchRepository - TypeORM repository used for match CRUD.
   * @param matchMapper - Mapper for match entities and DTOs.
   */
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Phase)
    private readonly phaseRepository: Repository<Phase>,
    private readonly matchMapper: MatchMapper,
  ) {}

  /**
   * Creates a match after checking required fields.
   *
   * @param dto - Required match data.
   * @returns The created match.
   * @throws ApplicationError When a required field is missing or blank.
   */
  async create(dto: MatchDto): Promise<MatchResponseDto> {
    if (!dto.duration?.trim() || !dto.state?.trim()) {
      throw ApplicationErrors.invalidInput(
        'duration and state are required for create',
      );
    }

    if (dto.phaseId !== undefined) {
      const phase = await this.phaseRepository.findOne({
        where: { phaseId: dto.phaseId },
      });
      if (!phase) {
        throw ApplicationErrors.notFound(`Phase with id ${dto.phaseId} not found`);
      }
    }

    const saved = await this.matchRepository.save(
      this.matchMapper.toEntity(dto),
    );
    return this.matchMapper.toResponseDto(saved);
  }

  /**
   * Retrieves every match.
   *
   * @returns All matches.
   */
  async findAll(): Promise<MatchResponseDto[]> {
    const matches = await this.matchRepository.find({ relations: { phase: true } });
    return this.matchMapper.toResponseDtoList(matches);
  }

  /**
   * Retrieves a match by its identifier.
   *
   * @param id - Match identifier.
   * @returns The matching match.
   * @throws ApplicationError When the match does not exist.
   */
  async findOne(id: number): Promise<MatchResponseDto> {
    const match = await this.matchRepository.findOne({
      where: { matchId: id },
      relations: { phase: true },
    });
    if (!match) {
      throw ApplicationErrors.notFound(`Match with id ${id} not found`);
    }
    return this.matchMapper.toResponseDto(match);
  }

  /**
   * Updates a match's supplied fields.
   *
   * @param id - Match identifier.
   * @param dto - Fields to update.
   * @returns The updated match.
   * @throws ApplicationError When the match does not exist.
   */
  async update(id: number, dto: MatchDto): Promise<MatchResponseDto> {
    const match = await this.matchRepository.findOne({
      where: { matchId: id },
      relations: { phase: true },
    });
    if (!match) {
      throw ApplicationErrors.notFound(`Match with id ${id} not found`);
    }

    if (dto.phaseId !== undefined) {
      const phase = await this.phaseRepository.findOne({
        where: { phaseId: dto.phaseId },
      });
      if (!phase) {
        throw ApplicationErrors.notFound(`Phase with id ${dto.phaseId} not found`);
      }
    }

    const saved = await this.matchRepository.save(
      this.matchMapper.mergeEntity(match, dto),
    );
    return this.matchMapper.toResponseDto(saved);
  }
}
