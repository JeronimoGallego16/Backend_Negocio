import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { MatchDto } from './dto/match.dto';
import { MatchResponseDto } from './dto/match-response.dto';
import { Match } from './entities/match.entity';
import { MatchMapper } from './mappers/match.mapper';

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
    const matches = await this.matchRepository.find();
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
    });
    if (!match) {
      throw ApplicationErrors.notFound(`Match with id ${id} not found`);
    }

    const saved = await this.matchRepository.save(
      this.matchMapper.mergeEntity(match, dto),
    );
    return this.matchMapper.toResponseDto(saved);
  }
}
