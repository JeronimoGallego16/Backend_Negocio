import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { Sport } from '../sports/entities/sport.entity';
import { Team } from '../teams/entities/team.entity';
import { CreateTeamSportDto } from './dto/create-team-sport.dto';
import { TeamSportResponseDto } from './dto/team-sport-response.dto';
import { UpdateTeamSportDto } from './dto/update-team-sport.dto';
import { TeamSport } from './entities/team-sport.entity';
import { TeamSportMapper } from './mappers/team-sport.mapper';

/**
 * Business logic for managing team-sport assignments.
 */
@Injectable()
export class TeamSportsService {
  /**
   * Creates the team-sports service.
   *
   * @param teamSportRepository - Repository used for assignment CRUD.
   * @param teamRepository - Repository used to validate team references.
   * @param sportRepository - Repository used to validate sport references.
   * @param teamSportMapper - Mapper for assignment entities and DTOs.
   */
  constructor(
    @InjectRepository(TeamSport)
    private readonly teamSportRepository: Repository<TeamSport>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Sport)
    private readonly sportRepository: Repository<Sport>,
    private readonly teamSportMapper: TeamSportMapper,
  ) {}

  /**
   * Assigns an existing sport to an existing team.
   *
   * @param dto - Team and sport identifiers.
   * @returns The created assignment.
   * @throws ApplicationError When either entity is missing or the assignment exists.
   */
  async create(dto: CreateTeamSportDto): Promise<TeamSportResponseDto> {
    const [team, sport] = await Promise.all([
      this.findTeam(dto.teamId),
      this.findSport(dto.sportId),
    ]);

    if (await this.existsByTeamAndSport(dto.teamId, dto.sportId)) {
      throw ApplicationErrors.conflict(
        'This sport is already assigned to this team',
      );
    }

    const assignment = this.teamSportMapper.toEntity(team, sport);
    const saved = await this.saveAssignment(assignment);
    return this.findOne(saved.teamSportId);
  }

  /**
   * Retrieves every assignment with both related entities loaded.
   *
   * @returns All team-sport assignments.
   */
  async findAll(): Promise<TeamSportResponseDto[]> {
    const assignments = await this.teamSportRepository.find({
      relations: { team: true, sport: true },
    });
    return this.teamSportMapper.toResponseDtoList(assignments);
  }

  /**
   * Retrieves an assignment by its identifier.
   *
   * @param id - Assignment identifier.
   * @returns The matching assignment.
   * @throws ApplicationError When the assignment does not exist.
   */
  async findOne(id: number): Promise<TeamSportResponseDto> {
    return this.teamSportMapper.toResponseDto(await this.findAssignment(id));
  }

  /**
   * Reassigns an existing team-sport association.
   *
   * @param id - Assignment identifier.
   * @param dto - Optional replacement team or sport identifiers.
   * @returns The updated assignment.
   * @throws ApplicationError When a related entity is missing or the resulting pair exists.
   */
  async update(
    id: number,
    dto: UpdateTeamSportDto,
  ): Promise<TeamSportResponseDto> {
    const assignment = await this.findAssignment(id);
    const team =
      dto.teamId !== undefined ? await this.findTeam(dto.teamId) : undefined;
    const sport =
      dto.sportId !== undefined ? await this.findSport(dto.sportId) : undefined;
    const teamId = team?.teamId ?? assignment.team.teamId;
    const sportId = sport?.sportId ?? assignment.sport.sportId;

    if (
      (team !== undefined || sport !== undefined) &&
      (teamId !== assignment.team.teamId ||
        sportId !== assignment.sport.sportId) &&
      (await this.existsByTeamAndSport(teamId, sportId))
    ) {
      throw ApplicationErrors.conflict(
        'This sport is already assigned to this team',
      );
    }

    const updated = this.teamSportMapper.mergeEntity(
      assignment,
      dto,
      team,
      sport,
    );
    const saved = await this.saveAssignment(updated);
    return this.findOne(saved.teamSportId);
  }

  /**
   * Deletes only the assignment record, leaving the team and sport untouched.
   *
   * @param id - Assignment identifier.
   * @returns A confirmation message after deleting the assignment.
   * @throws ApplicationError When the assignment does not exist.
   */
  async remove(id: number): Promise<{ message: string }> {
    const assignment = await this.findAssignment(id);
    await this.teamSportRepository.remove(assignment);
    return { message: `Team-sport assignment #${id} deleted successfully` };
  }

  /**
   * Retrieves an assignment and loads its related team and sport.
   *
   * @param id - Assignment identifier.
   * @returns The matching assignment with its references.
   * @throws ApplicationError When the assignment does not exist.
   */
  private async findAssignment(id: number): Promise<TeamSport> {
    const assignment = await this.teamSportRepository.findOne({
      where: { teamSportId: id },
      relations: { team: true, sport: true },
    });
    if (!assignment) {
      throw ApplicationErrors.notFound(
        `Team-sport assignment with id ${id} not found`,
      );
    }
    return assignment;
  }

  /**
   * Retrieves a team referenced by an assignment.
   *
   * @param teamId - Team identifier.
   * @returns The matching team.
   * @throws ApplicationError When the team does not exist.
   */
  private async findTeam(teamId: number): Promise<Team> {
    const team = await this.teamRepository.findOne({ where: { teamId } });
    if (!team) {
      throw ApplicationErrors.notFound(`Team with id ${teamId} not found`);
    }
    return team;
  }

  /**
   * Retrieves a sport referenced by an assignment.
   *
   * @param sportId - Sport identifier.
   * @returns The matching sport.
   * @throws ApplicationError When the sport does not exist.
   */
  private async findSport(sportId: number): Promise<Sport> {
    const sport = await this.sportRepository.findOne({ where: { sportId } });
    if (!sport) {
      throw ApplicationErrors.notFound(`Sport with id ${sportId} not found`);
    }
    return sport;
  }

  /**
   * Checks whether a team and sport are already associated.
   *
   * @param teamId - Team identifier.
   * @param sportId - Sport identifier.
   * @returns Whether the association already exists.
   */
  private async existsByTeamAndSport(
    teamId: number,
    sportId: number,
  ): Promise<boolean> {
    const assignment = await this.teamSportRepository.findOne({
      where: { team: { teamId }, sport: { sportId } },
    });
    return assignment !== null;
  }

  /**
   * Saves an assignment and translates unique-key violations to a conflict.
   *
   * @param assignment - Assignment to persist.
   * @returns The persisted assignment.
   * @throws ApplicationError When a concurrent request creates a duplicate.
   */
  private async saveAssignment(assignment: TeamSport): Promise<TeamSport> {
    try {
      return await this.teamSportRepository.save(assignment);
    } catch (error: unknown) {
      if (ApplicationErrors.isDuplicateKeyViolation(error)) {
        throw ApplicationErrors.conflict(
          'This sport is already assigned to this team',
        );
      }
      throw error;
    }
  }
}
