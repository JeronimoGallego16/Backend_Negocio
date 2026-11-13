import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { SportDto } from './dto/sport.dto';
import { SportResponseDto } from './dto/sport-response.dto';
import { Sport } from './entities/sport.entity';
import { SportMapper } from './mappers/sport.mapper';
import { SportsRepository } from './repositories/sports.repository';

/**
 * Business logic for managing sports.
 */
@Injectable()
export class SportsService {
  /**
   * Creates the sports service.
   *
   * @param sportRepository - TypeORM repository used for sport CRUD.
   * @param sportsRepository - Repository for sport-specific queries.
   * @param sportMapper - Mapper for sport entities and DTOs.
   */
  constructor(
    @InjectRepository(Sport)
    private readonly sportRepository: Repository<Sport>,
    private readonly sportsRepository: SportsRepository,
    private readonly sportMapper: SportMapper,
  ) {}

  /**
   * Creates a sport after checking required fields and its unique name.
   *
   * @param dto - Required sport data.
   * @returns The created sport.
   * @throws ApplicationError When required fields are missing or a sport already exists.
   */
  async create(dto: SportDto): Promise<SportResponseDto> {
    if (!dto.name?.trim() || !dto.description?.trim()) {
      throw ApplicationErrors.invalidInput(
        'name and description are required for create',
      );
    }

    if (await this.sportsRepository.existsByName(dto.name)) {
      throw ApplicationErrors.conflict('A sport with this name already exists');
    }

    const sport = this.sportMapper.toEntity(dto);
    if (dto.parentSportId !== undefined && dto.parentSportId !== null) {
      sport.parentSport = await this.getValidParent(
        dto.parentSportId,
        undefined,
      );
    }

    const saved = await this.sportRepository.save(sport);
    return this.sportMapper.toResponseDto(saved);
  }

  /**
   * Retrieves every sport.
   *
   * @returns All sports.
   */
  async findAll(): Promise<SportResponseDto[]> {
    const sports = await this.sportRepository.find({
      relations: { parentSport: true },
    });
    return this.sportMapper.toResponseDtoList(sports);
  }

  /**
   * Retrieves a sport by its identifier.
   *
   * @param id - Sport identifier.
   * @returns The matching sport.
   * @throws ApplicationError When the sport does not exist.
   */
  async findOne(id: number): Promise<SportResponseDto> {
    const sport = await this.sportRepository.findOne({
      where: { sportId: id },
      relations: { parentSport: true },
    });
    if (!sport) {
      throw ApplicationErrors.notFound(`Sport with id ${id} not found`);
    }
    return this.sportMapper.toResponseDto(sport);
  }

  /**
   * Updates a sport's supplied fields.
   *
   * @param id - Sport identifier.
   * @param dto - Fields to update.
   * @returns The updated sport.
   * @throws ApplicationError When the sport does not exist or another sport has the new name.
   */
  async update(id: number, dto: SportDto): Promise<SportResponseDto> {
    const sport = await this.sportRepository.findOne({
      where: { sportId: id },
      relations: { parentSport: true },
    });
    if (!sport) {
      throw ApplicationErrors.notFound(`Sport with id ${id} not found`);
    }

    const merged = this.sportMapper.mergeEntity(sport, dto);
    if (await this.sportsRepository.existsByName(merged.name, id)) {
      throw ApplicationErrors.conflict('A sport with this name already exists');
    }

    if (dto.parentSportId !== undefined) {
      merged.parentSport =
        dto.parentSportId === null
          ? null
          : await this.getValidParent(dto.parentSportId, id);
    }

    const saved = await this.sportRepository.save(merged);
    return this.sportMapper.toResponseDto(saved);
  }
 
  /**
   * Prevents deleting a sport that still has subcategories.
   *
   * @param id - Sport identifier.
   * @returns A confirmation message after deleting the sport.
   * @throws ApplicationError When the sport does not exist or has children.
   */
  async remove(id: number): Promise<{ message: string }> {
    const sport = await this.sportRepository.findOne({
      where: { sportId: id },
    });
    if (!sport) {
      throw ApplicationErrors.notFound(`Sport with id ${id} not found`);
    }
    if (await this.sportsRepository.hasSubcategories(id)) {
      throw ApplicationErrors.conflict(
        `Sport with id ${id} cannot be deleted while it has subcategories`,
      );
    }

    await this.sportRepository.remove(sport);
    return { message: `Sport #${id} deleted successfully` };
  }

  /**
   * Retrieves a valid parent and prevents cyclic sport hierarchies.
   *
   * @param parentSportId - Proposed parent sport identifier.
   * @param sportId - Existing sport being updated, if any.
   * @returns The parent sport with its own parent loaded.
   * @throws ApplicationError When the parent does not exist or creates a cycle.
   */
  private async getValidParent(
    parentSportId: number,
    sportId: number | undefined,
  ): Promise<Sport> {
    const parent = await this.sportRepository.findOne({
      where: { sportId: parentSportId },
      relations: { parentSport: true },
    });
    if (!parent) {
      throw ApplicationErrors.notFound(
        `Parent sport with id ${parentSportId} not found`,
      );
    }

    const visited = new Set<number>();
    let ancestorId: number | null = parent.sportId;
    while (ancestorId !== null) {
      if (ancestorId === sportId) {
        throw ApplicationErrors.invalidInput(
          'A sport cannot be its own ancestor',
        );
      }
      if (visited.has(ancestorId)) {
        throw ApplicationErrors.conflict(
          'The existing sport hierarchy contains a cycle',
        );
      }
      visited.add(ancestorId);
      const ancestor = await this.sportRepository.findOne({
        where: { sportId: ancestorId },
        relations: { parentSport: true },
      });
      ancestorId = ancestor?.parentSport?.sportId ?? null;
    }

    return parent;
  }
}
