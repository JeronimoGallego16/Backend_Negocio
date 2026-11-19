import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { Team } from '../teams/entities/team.entity';
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
   * @param teamRepository - TypeORM repository used to validate team references.
   * @param matchMapper - Mapper for match entities and DTOs.
   */
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    private readonly matchMapper: MatchMapper,
  ) {}

  /**
   * Creates a match after checking required fields.
   *
   * @param dto - Required match data.
   * @returns The created match.
   * @throws ApplicationError When required fields are missing, teams are invalid, or the same team is selected twice.
   */
  async create(dto: MatchDto): Promise<MatchResponseDto> {
    if (
      !dto.duration?.trim() ||
      !dto.state?.trim() ||
      dto.homeTeamId === undefined ||
      dto.awayTeamId === undefined
    ) {
      throw ApplicationErrors.invalidInput(
        'duration, state, homeTeamId, and awayTeamId are required for create',
      );
    }
    this.assertDifferentTeams(dto.homeTeamId, dto.awayTeamId);

    const [homeTeam, awayTeam] = await Promise.all([
      this.findTeam(dto.homeTeamId),
      this.findTeam(dto.awayTeamId),
    ]);
    const match = this.matchMapper.toEntity(dto);
    match.homeTeam = homeTeam;
    match.awayTeam = awayTeam;

    const saved = await this.matchRepository.save(match);
    return this.matchMapper.toResponseDto(saved);
  }

  /**
   * Retrieves every match.
   *
   * @returns All matches.
   */
  async findAll(): Promise<MatchResponseDto[]> {
    const matches = await this.matchRepository.find({
      relations: { homeTeam: true, awayTeam: true },
    });
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
      relations: { homeTeam: true, awayTeam: true },
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
   * @throws ApplicationError When the match does not exist, teams are invalid, or the same team is selected twice.
   */
  async update(id: number, dto: MatchDto): Promise<MatchResponseDto> {
    const match = await this.matchRepository.findOne({
      where: { matchId: id },
      relations: { homeTeam: true, awayTeam: true },
    });
    if (!match) {
      throw ApplicationErrors.notFound(`Match with id ${id} not found`);
    }

    const merged = this.matchMapper.mergeEntity(match, dto);
    const homeTeamId = dto.homeTeamId ?? merged.homeTeam.teamId;
    const awayTeamId = dto.awayTeamId ?? merged.awayTeam.teamId;
    this.assertDifferentTeams(homeTeamId, awayTeamId);

    if (dto.homeTeamId !== undefined) {
      merged.homeTeam = await this.findTeam(dto.homeTeamId);
    }
    if (dto.awayTeamId !== undefined) {
      merged.awayTeam = await this.findTeam(dto.awayTeamId);
    }

    const saved = await this.matchRepository.save(merged);
    return this.matchMapper.toResponseDto(saved);
  }

  /**
   * Removes a match and its two team associations.
   *
   * @param id - Match identifier.
   * @returns A confirmation message after deleting the match.
   * @throws ApplicationError When the match does not exist.
   */
  async remove(id: number): Promise<{ message: string }> {
    const match = await this.matchRepository.findOne({
      where: { matchId: id },
    });
    if (!match) {
      throw ApplicationErrors.notFound(`Match with id ${id} not found`);
    }

    await this.matchRepository.remove(match);
    return { message: `Match #${id} deleted successfully` };
  }

  /**
   * Retrieves a team referenced by a match.
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
   * Ensures a match does not use the same team for both sides.
   *
   * @param homeTeamId - Home team identifier.
   * @param awayTeamId - Away team identifier.
   * @returns Nothing when the identifiers are different.
   * @throws ApplicationError When both sides identify the same team.
   */
  private assertDifferentTeams(homeTeamId: number, awayTeamId: number): void {
    if (homeTeamId === awayTeamId) {
      throw ApplicationErrors.invalidInput(
        'homeTeamId and awayTeamId must identify different teams',
      );
    }
  }
}
