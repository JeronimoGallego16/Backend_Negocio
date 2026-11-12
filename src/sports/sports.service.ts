import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
   * @throws BadRequestException When a required field is missing or blank.
   * @throws ConflictException When a sport with the same name exists.
   */
  async create(dto: SportDto): Promise<SportResponseDto> {
    if (!dto.name?.trim() || !dto.description?.trim()) {
      throw new BadRequestException('name and description are required for create');
    }

    if (await this.sportsRepository.existsByName(dto.name)) {
      throw new ConflictException('A sport with this name already exists');
    }

    const saved = await this.sportRepository.save(this.sportMapper.toEntity(dto));
    return this.sportMapper.toResponseDto(saved);
  }

  /**
   * Retrieves every sport.
   *
   * @returns All sports.
   */
  async findAll(): Promise<SportResponseDto[]> {
    const sports = await this.sportRepository.find();
    return this.sportMapper.toResponseDtoList(sports);
  }

  /**
   * Retrieves a sport by its identifier.
   *
   * @param id - Sport identifier.
   * @returns The matching sport.
   * @throws NotFoundException When the sport does not exist.
   */
  async findOne(id: number): Promise<SportResponseDto> {
    const sport = await this.sportRepository.findOne({ where: { sportId: id } });
    if (!sport) {
      throw new NotFoundException(`Sport with id ${id} not found`);
    }
    return this.sportMapper.toResponseDto(sport);
  }

  /**
   * Updates a sport's supplied fields.
   *
   * @param id - Sport identifier.
   * @param dto - Fields to update.
   * @returns The updated sport.
   * @throws NotFoundException When the sport does not exist.
   * @throws ConflictException When another sport has the new name.
   */
  async update(id: number, dto: SportDto): Promise<SportResponseDto> {
    const sport = await this.sportRepository.findOne({ where: { sportId: id } });
    if (!sport) {
      throw new NotFoundException(`Sport with id ${id} not found`);
    }

    const merged = this.sportMapper.mergeEntity(sport, dto);
    if (await this.sportsRepository.existsByName(merged.name, id)) {
      throw new ConflictException('A sport with this name already exists');
    }

    const saved = await this.sportRepository.save(merged);
    return this.sportMapper.toResponseDto(saved);
  }
}
