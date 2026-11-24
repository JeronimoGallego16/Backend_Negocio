import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { Annotation } from '../annotations/entities/annotation.entity';
import { Phase } from '../phases/entities/phase.entity';
import { Team } from '../teams/entities/team.entity';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { MatchDto } from './dto/match.dto';
import { MatchResultDto } from './dto/match-result.dto';
import { MatchResponseDto } from './dto/match-response.dto';
import { Match } from './entities/match.entity';
import { MatchMapper } from './mappers/match.mapper';
import { Tournament } from '../tournaments/entities/tournament.entity';

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
   * @param teamSportRepository - Repository for team-sport assignments.
   * @param tournamentRepository - Tournament repository.
   * @param matchMapper - Match mapper.
   */
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Phase)
    private readonly phaseRepository: Repository<Phase>,
    @InjectRepository(TeamSport)
    private readonly teamSportRepository: Repository<TeamSport>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Annotation)
    private readonly annotationRepository: Repository<Annotation>,
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
      dto.awayTeamId === undefined ||
      dto.phaseId === undefined
    ) {
      throw ApplicationErrors.invalidInput(
        'duration, state, phaseId, homeTeamId, and awayTeamId are required for create',
      );
    }
    this.assertDifferentTeams(dto.homeTeamId, dto.awayTeamId);

    const phase = await this.findPhase(dto.phaseId);
    const [homeTeam, awayTeam] = await Promise.all([
      this.findTeam(dto.homeTeamId),
      this.findTeam(dto.awayTeamId),
    ]);

    const match = this.matchMapper.toEntity(dto);
    match.homeTeam = homeTeam;
    match.awayTeam = awayTeam;
    match.phase = phase;
    match.phaseId = dto.phaseId;
    this.assertFinishedMatchHasScores(match.state, match.homeScore, match.awayScore);
    await this.assertTeamsBelongToTournament(
      phase,
      homeTeam.teamId,
      awayTeam.teamId,
    );

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
    const phaseId = merged.phaseId ?? merged.phase?.phaseId;
    if (phaseId === undefined) {
      throw ApplicationErrors.invalidInput(
        'A match must be associated with a phase',
      );
    }
    const phase =
      dto.phaseId === undefined && merged.phase
        ? merged.phase
        : await this.findPhase(phaseId);
    merged.phase = phase;
    merged.phaseId = phase.phaseId;
    this.assertFinishedMatchHasScores(
      merged.state,
      merged.homeScore,
      merged.awayScore,
    );
    await this.assertTeamsBelongToTournament(
      phase,
      merged.homeTeam.teamId,
      merged.awayTeam.teamId,
    );

    return this.matchMapper.toResponseDto(
      await this.matchRepository.save(merged),
    );
  }

  /**
   * Registers a final score and transitions the match to FINISHED.
   *
   * @param id - Match identifier.
   * @param dto - Final home and away scores.
   * @returns The finished match.
   */
  async registerResult(
    id: number,
    dto: MatchResultDto,
  ): Promise<MatchResponseDto> {
    if (
      !Number.isInteger(dto.homeScore) ||
      dto.homeScore < 0 ||
      !Number.isInteger(dto.awayScore) ||
      dto.awayScore < 0
    ) {
      throw ApplicationErrors.invalidInput(
        'homeScore and awayScore must be non-negative integers',
      );
    }

    const match = await this.findMatch(id);
    match.homeScore = dto.homeScore;
    match.awayScore = dto.awayScore;
    match.state = 'FINISHED';
    match.resultRegistered = true;

    return this.matchMapper.toResponseDto(await this.matchRepository.save(match));
  }

  /**
   * Deletes a match.
   *
   * @param id - Match identifier.
   * @returns A confirmation message.
   */
  async remove(id: number): Promise<{ message: string }> {
    return this.annotationRepository.manager.transaction(async (manager) => {
      const matchRepository = manager.getRepository(Match);
      const match = await matchRepository.findOne({
        where: { matchId: id },
        relations: { homeTeam: true, awayTeam: true, phase: true },
      });
      if (!match) {
        throw ApplicationErrors.notFound(`Match with id ${id} not found`);
      }

      await manager.delete(Annotation, { matchId: id });
      await matchRepository.remove(match);

      return {
        message: `Match #${id} and its annotations were permanently deleted`,
      };
    });
  }

  /**
   * Ensures both teams have an explicit assignment to the phase tournament sport.
   *
   * @param phase - Existing phase.
   * @param homeTeamId - Home team identifier.
   * @param awayTeamId - Away team identifier.
   * @returns Nothing when valid.
   */
  private async assertTeamsBelongToTournament(
    phase: Phase,
    homeTeamId: number,
    awayTeamId: number,
  ): Promise<void> {
    const tournament = await this.tournamentRepository.findOne({
      where: { tournamentId: phase.tournamentId },
      relations: { sport: true },
    });
    if (!tournament) {
      throw ApplicationErrors.notFound(
        `Tournament with id ${phase.tournamentId} not found`,
      );
    }
    const sportId = tournament.sport.sportId;
    const [homeAssignment, awayAssignment] = await Promise.all([
      this.teamSportRepository.findOne({
        where: {
          team: { teamId: homeTeamId },
          sport: { sportId },
        },
      }),
      this.teamSportRepository.findOne({
        where: {
          team: { teamId: awayTeamId },
          sport: { sportId },
        },
      }),
    ]);

    if (!homeAssignment || !awayAssignment) {
      throw ApplicationErrors.invalidInput(
        'Match teams must belong to the phase tournament sport',
      );
    }
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

  /**
   * Requires both scores before a match can be marked as finished.
   *
   * @param state - Match state after the requested operation.
   * @param homeScore - Home team's score.
   * @param awayScore - Away team's score.
   * @returns Nothing when the match has a complete result.
   */
  private assertFinishedMatchHasScores(
    state: string,
    homeScore: number | null | undefined,
    awayScore: number | null | undefined,
  ): void {
    if (
      state?.trim().toUpperCase() === 'FINISHED' &&
      (homeScore === undefined ||
        homeScore === null ||
        awayScore === undefined ||
        awayScore === null)
    ) {
      throw ApplicationErrors.invalidInput(
        'A finished match must have both homeScore and awayScore',
      );
    }
  }
}
