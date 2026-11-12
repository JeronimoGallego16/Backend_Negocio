import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { TeamDto } from './dto/team.dto';
import { TeamResponseDto } from './dto/team-response.dto';
import { Team } from './entities/team.entity';
import { TeamMapper } from './mappers/team.mapper';
import { TeamsRepository } from './repositories/teams.repository';

/**
 * Business logic for managing tournament teams.
 */
@Injectable()
export class TeamsService {
  /**
   * Creates the team service.
   *
   * @param teamRepository - TypeORM repository used for team CRUD.
   * @param teamsRepository - Repository for team-specific queries.
   * @param teamMapper - Mapper for team entities and DTOs.
   */
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    private readonly teamsRepository: TeamsRepository,
    private readonly teamMapper: TeamMapper,
  ) {}

  /**
   * Creates a team after checking required fields and its natural key.
   *
   * @param dto - Required team data.
   * @returns The created team.
   * @throws ApplicationError When required fields are missing or a team already exists.
   */
  async create(dto: TeamDto): Promise<TeamResponseDto> {
    if (!dto.name?.trim() || !dto.category?.trim()) {
      throw ApplicationErrors.invalidInput(
        'name and category are required for create',
      );
    }

    if (
      await this.teamsRepository.existsByNameAndCategory(dto.name, dto.category)
    ) {
      throw ApplicationErrors.conflict(
        'A team with this name and category already exists',
      );
    }

    const saved = await this.teamRepository.save(this.teamMapper.toEntity(dto));
    return this.teamMapper.toResponseDto(saved);
  }

  /**
   * Retrieves every team.
   *
   * @returns All teams.
   */
  async findAll(): Promise<TeamResponseDto[]> {
    const teams = await this.teamRepository.find();
    return this.teamMapper.toResponseDtoList(teams);
  }

  /**
   * Retrieves a team by its identifier.
   *
   * @param id - Team identifier.
   * @returns The matching team.
   * @throws ApplicationError When the team does not exist.
   */
  async findOne(id: number): Promise<TeamResponseDto> {
    const team = await this.teamRepository.findOne({ where: { teamId: id } });
    if (!team) {
      throw ApplicationErrors.notFound(`Team with id ${id} not found`);
    }
    return this.teamMapper.toResponseDto(team);
  }

  /**
   * Updates a team's supplied fields.
   *
   * @param id - Team identifier.
   * @param dto - Fields to update.
   * @returns The updated team.
   * @throws ApplicationError When the team does not exist or the new name and category belong to another team.
   */
  async update(id: number, dto: TeamDto): Promise<TeamResponseDto> {
    const team = await this.teamRepository.findOne({ where: { teamId: id } });
    if (!team) {
      throw ApplicationErrors.notFound(`Team with id ${id} not found`);
    }

    const merged = this.teamMapper.mergeEntity(team, dto);
    if (
      await this.teamsRepository.existsByNameAndCategory(
        merged.name,
        merged.category,
        id,
      )
    ) {
      throw ApplicationErrors.conflict(
        'A team with this name and category already exists',
      );
    }

    const saved = await this.teamRepository.save(merged);
    return this.teamMapper.toResponseDto(saved);
  }
}
