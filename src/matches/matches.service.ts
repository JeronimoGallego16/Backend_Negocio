import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { Phase } from '../phases/entities/phase.entity';
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
   * @param matchRepository - Match repository.
   * @param teamRepository - Team repository.
   * @param phaseRepository - Phase repository.
   * @param matchMapper - Match mapper.
   */
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Phase)
    private readonly phaseRepository: Repository<Phase>,
    private readonly matchMapper: MatchMapper,
  ) {}

  /**
   * Creates a match after validating teams and optional phase.
   *
   * @param dto - Required match data.
   * @returns The created match.
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
    if (dto.phaseId !== undefined) {
      match.phase = await this.findPhase(dto.phaseId);
      match.phaseId = dto.phaseId;
    }

    return this.matchMapper.toResponseDto(
      await this.matchRepository.save(match),
    );
  }

  /**
   * Retrieves every match.
   *
   * @returns All matches.
   */
  async findAll(): Promise<MatchResponseDto[]> {
    const matches = await this.matchRepository.find({
      relations: { homeTeam: true, awayTeam: true, phase: true },
    });
    return this.matchMapper.toResponseDtoList(matches);
  }

  /**
   * Retrieves a match by identifier.
   *
   * @param id - Match identifier.
   * @returns The matching match.
   */
  async findOne(id: number): Promise<MatchResponseDto> {
    const match = await this.findMatch(id);
    return this.matchMapper.toResponseDto(match);
  }

  /**
   * Updates a match and validates supplied team and phase references.
   *
   * @param id - Match identifier.
   * @param dto - Fields to update.
   * @returns The updated match.
   */
  async update(id: number, dto: MatchDto): Promise<MatchResponseDto> {
    const match = await this.findMatch(id);
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
    if (dto.phaseId !== undefined) {
      merged.phase = await this.findPhase(dto.phaseId);
      merged.phaseId = dto.phaseId;
    }

    return this.matchMapper.toResponseDto(
      await this.matchRepository.save(merged),
    );
  }

  /**
   * Deletes a match.
   *
   * @param id - Match identifier.
   * @returns A confirmation message.
   */
  async remove(id: number): Promise<{ message: string }> {
    const match = await this.findMatch(id);
    await this.matchRepository.remove(match);
    return { message: `Match #${id} deleted successfully` };
  }

  /**
   * Finds a team referenced by a match.
   *
   * @param teamId - Team identifier.
   * @returns The matching team.
   */
  private async findTeam(teamId: number): Promise<Team> {
    const team = await this.teamRepository.findOne({ where: { teamId } });
    if (!team) {
      throw ApplicationErrors.notFound(`Team with id ${teamId} not found`);
    }
    return team;
  }

  /**
   * Finds an optional match phase.
   *
   * @param phaseId - Phase identifier.
   * @returns The matching phase.
   */
  private async findPhase(phaseId: number): Promise<Phase> {
    const phase = await this.phaseRepository.findOne({
      where: { phaseId },
    });
    if (!phase) {
      throw ApplicationErrors.notFound(`Phase with id ${phaseId} not found`);
    }
    return phase;
  }

  /**
   * Finds a match with all relationships loaded.
   *
   * @param id - Match identifier.
   * @returns The matching match.
   */
  private async findMatch(id: number): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { matchId: id },
      relations: { homeTeam: true, awayTeam: true, phase: true },
    });
    if (!match) {
      throw ApplicationErrors.notFound(`Match with id ${id} not found`);
    }
    return match;
  }

  /**
   * Ensures a match does not use the same team for both sides.
   *
   * @param homeTeamId - Home team identifier.
   * @param awayTeamId - Away team identifier.
   * @returns Nothing when valid.
   */
  private assertDifferentTeams(
    homeTeamId: number,
    awayTeamId: number,
  ): void {
    if (homeTeamId === awayTeamId) {
      throw ApplicationErrors.invalidInput(
        'homeTeamId and awayTeamId must identify different teams',
      );
    }
  }
}
