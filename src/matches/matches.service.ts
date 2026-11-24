import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { Annotation } from '../annotations/entities/annotation.entity';
import { Phase } from '../phases/entities/phase.entity';
import { FinalPhase } from '../phases/entities/final.entity';
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
      dto.phaseId === undefined
    ) {
      throw ApplicationErrors.invalidInput(
        'duration, state, and phaseId are required for create',
      );
    }

    const phase = await this.findPhase(dto.phaseId);
    if (
      this.isFinalPhase(phase) &&
      dto.state?.trim().toUpperCase() === 'FINISHED'
    ) {
      throw ApplicationErrors.invalidInput(
        'Use the result endpoint to finish a final-phase match',
      );
    }
    this.assertPhaseTeamRequirements(
      phase,
      dto.homeTeamId ?? null,
      dto.awayTeamId ?? null,
      dto.bracketPosition ?? null,
      dto.isThirdPlace ?? false,
    );
    this.assertDifferentTeams(dto.homeTeamId ?? null, dto.awayTeamId ?? null);
    const [homeTeam, awayTeam] = await Promise.all([
      dto.homeTeamId == null ? null : this.findTeam(dto.homeTeamId),
      dto.awayTeamId == null ? null : this.findTeam(dto.awayTeamId),
    ]);

    const match = this.matchMapper.toEntity(dto);
    match.homeTeam = homeTeam;
    match.awayTeam = awayTeam;
    match.phase = phase;
    match.phaseId = dto.phaseId;
    this.assertFinishedMatchHasScores(
      match.state,
      match.homeScore,
      match.awayScore,
      homeTeam?.teamId ?? null,
      awayTeam?.teamId ?? null,
    );
    await this.assertTeamsBelongToTournament(
      phase,
      homeTeam?.teamId ?? null,
      awayTeam?.teamId ?? null,
    );
    await this.assertFinalFixtureConfiguration(
      phase,
      null,
      match.bracketPosition ?? null,
      match.isThirdPlace,
      homeTeam?.teamId ?? null,
      awayTeam?.teamId ?? null,
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
    const homeTeamId =
      dto.homeTeamId !== undefined
        ? dto.homeTeamId
        : merged.homeTeam?.teamId ?? null;
    const awayTeamId =
      dto.awayTeamId !== undefined
        ? dto.awayTeamId
        : merged.awayTeam?.teamId ?? null;
    this.assertDifferentTeams(homeTeamId, awayTeamId);

    if (dto.homeTeamId !== undefined) {
      merged.homeTeam =
        dto.homeTeamId === null ? null : await this.findTeam(dto.homeTeamId);
    }
    if (dto.awayTeamId !== undefined) {
      merged.awayTeam =
        dto.awayTeamId === null ? null : await this.findTeam(dto.awayTeamId);
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
    this.assertPhaseTeamRequirements(
      phase,
      homeTeamId,
      awayTeamId,
      merged.bracketPosition ?? null,
      merged.isThirdPlace ?? false,
    );
    this.assertFinishedMatchHasScores(
      merged.state,
      merged.homeScore,
      merged.awayScore,
      homeTeamId,
      awayTeamId,
    );
    const isFinalPhase =
      this.isFinalPhase(phase) || this.isFinalPhase(match.phase);
    if (
      isFinalPhase &&
      (dto.homeScore !== undefined ||
        dto.awayScore !== undefined ||
        (dto.state?.trim().toUpperCase() === 'FINISHED' &&
          match.state?.trim().toUpperCase() !== 'FINISHED'))
    ) {
      throw ApplicationErrors.invalidInput(
        'Use the result endpoint to register a final-phase match result',
      );
    }
    if (
      isFinalPhase &&
      match.resultRegistered &&
      (dto.homeTeamId !== undefined ||
        dto.awayTeamId !== undefined ||
        dto.phaseId !== undefined ||
        dto.bracketPosition !== undefined ||
        dto.nextMatchId !== undefined)
    ) {
      throw ApplicationErrors.conflict(
        'A completed match cannot change its teams, round, position, or advancement link',
      );
    }
    await this.assertTeamsBelongToTournament(
      phase,
      homeTeamId,
      awayTeamId,
    );
    await this.assertFinalFixtureConfiguration(
      phase,
      match.matchId,
      merged.bracketPosition ?? null,
      merged.isThirdPlace ?? false,
      homeTeamId,
      awayTeamId,
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
    if (!match.homeTeam || !match.awayTeam) {
      throw ApplicationErrors.invalidInput(
        'Both teams must be assigned before registering a match result',
      );
    }

    if (this.isFinalPhase(match.phase)) {
      await this.assertFinalRoundFixturesComplete(match.phase);
      await this.assertDownstreamAssignmentsMatchResult(
        match,
        dto.homeScore,
        dto.awayScore,
      );
    }

    match.homeScore = dto.homeScore;
    match.awayScore = dto.awayScore;
    match.state = 'FINISHED';
    match.resultRegistered = true;

    return this.matchMapper.toResponseDto(
      await this.matchRepository.save(match),
    );
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

      await this.assertFinalMatchDeletionSafe(match, manager);

      await manager.delete(Annotation, { matchId: id });
      await matchRepository.remove(match);

      return {
        message: `Match #${id} and its annotations were permanently deleted`,
      };
    });
  }

  /**
   * Ensures every assigned team belongs to the phase tournament sport.
   *
   * @param phase - Existing phase.
   * @param homeTeamId - Home team identifier.
   * @param awayTeamId - Away team identifier.
   * @returns Nothing when valid.
   */
  private async assertTeamsBelongToTournament(
    phase: Phase,
    homeTeamId: number | null,
    awayTeamId: number | null,
  ): Promise<void> {
    if (homeTeamId === null && awayTeamId === null) {
      return;
    }

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
      homeTeamId === null
        ? null
        : this.teamSportRepository.findOne({
        where: {
          team: { teamId: homeTeamId },
          sport: { sportId },
        },
      }),
      awayTeamId === null
        ? null
        : this.teamSportRepository.findOne({
        where: {
          team: { teamId: awayTeamId },
          sport: { sportId },
        },
      }),
    ]);

    if (
      (homeTeamId !== null && !homeAssignment) ||
      (awayTeamId !== null && !awayAssignment)
    ) {
      throw ApplicationErrors.invalidInput(
        'Match teams must belong to the phase tournament sport',
      );
    }
  }

  private assertPhaseTeamRequirements(
    phase: Phase,
    homeTeamId: number | null,
    awayTeamId: number | null,
    bracketPosition: number | null,
    isThirdPlace: boolean,
  ): void {
    const isFinalPhase = this.isFinalPhase(phase);
    if (!isFinalPhase && (homeTeamId === null || awayTeamId === null)) {
      throw ApplicationErrors.invalidInput(
        'Both teams are required for matches outside final phases',
      );
    }
    if (!isFinalPhase && isThirdPlace) {
      throw ApplicationErrors.invalidInput(
        'A third-place match must belong to a final phase',
      );
    }
    if (!isFinalPhase) {
      return;
    }
    const finalPhase = phase as FinalPhase;
    const expectedMatchCount = finalPhase.expectedMatchCount;
    if (expectedMatchCount == null) {
      throw ApplicationErrors.conflict(
        'Set the expected match count for this final phase before creating matches',
      );
    }
    if (bracketPosition === null || bracketPosition < 1) {
      throw ApplicationErrors.invalidInput(
        'A positive bracketPosition is required for final-phase matches',
      );
    }
    if (
      isThirdPlace &&
      (!finalPhase.isThirdPlace || bracketPosition !== 1)
    ) {
      throw ApplicationErrors.invalidInput(
        'A third-place match must use position 1 in a phase configured for third place',
      );
    }
    if (!isThirdPlace && bracketPosition > expectedMatchCount) {
      throw ApplicationErrors.invalidInput(
        'bracketPosition exceeds the configured number of main matches in this round',
      );
    }
  }

  private isFinalPhase(
    phase: Phase | null | undefined,
  ): phase is FinalPhase {
    return Boolean(
      phase &&
        (phase instanceof FinalPhase ||
          phase.constructor.name === 'FinalPhase'),
    );
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
    homeTeamId: number | null,
    awayTeamId: number | null,
  ): void {
    if (
      homeTeamId !== null &&
      awayTeamId !== null &&
      homeTeamId === awayTeamId
    ) {
      throw ApplicationErrors.invalidInput(
        'homeTeamId and awayTeamId must identify different teams',
      );
    }
  }

  /**
   * Requires both teams and both scores before a match can be marked as finished.
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
    homeTeamId: number | null,
    awayTeamId: number | null,
  ): void {
    if (
      state?.trim().toUpperCase() === 'FINISHED' &&
      (homeScore === undefined ||
        homeScore === null ||
        awayScore === undefined ||
        awayScore === null ||
        homeTeamId === null ||
        awayTeamId === null)
    ) {
      throw ApplicationErrors.invalidInput(
        'A finished match must have both teams and both scores',
      );
    }
  }

  private async assertFinalFixtureConfiguration(
    phase: Phase,
    currentMatchId: number | null,
    bracketPosition: number | null,
    isThirdPlace: boolean,
    homeTeamId: number | null,
    awayTeamId: number | null,
  ): Promise<void> {
    if (!this.isFinalPhase(phase)) {
      return;
    }

    const finalPhase = phase as FinalPhase;
    const matches = await this.matchRepository.find({
      where: { phase: { phaseId: phase.phaseId } },
      relations: { homeTeam: true, awayTeam: true, phase: true },
    });
    const existing = matches.filter(
      (match) => match.matchId !== currentMatchId,
    );
    const expectedTotal =
      finalPhase.expectedMatchCount! + (finalPhase.isThirdPlace ? 1 : 0);

    if (existing.length >= expectedTotal) {
      throw ApplicationErrors.conflict(
        'This final phase already contains its configured number of matches',
      );
    }

    if (
      existing.some(
        (match) =>
          match.bracketPosition === bracketPosition &&
          match.isThirdPlace === isThirdPlace,
      )
    ) {
      throw ApplicationErrors.conflict(
        `A match already exists at bracket position ${bracketPosition}`,
      );
    }

    await this.assertManualFinalParticipants(
      finalPhase,
      bracketPosition,
      isThirdPlace,
      homeTeamId,
      awayTeamId,
    );
  }

  private async assertManualFinalParticipants(
    phase: FinalPhase,
    bracketPosition: number | null,
    isThirdPlace: boolean,
    homeTeamId: number | null,
    awayTeamId: number | null,
  ): Promise<void> {
    if (homeTeamId === null && awayTeamId === null) {
      return;
    }

    const previousPhase = await this.findAdjacentFinalPhase(phase, 'previous');
    if (isThirdPlace && previousPhase?.expectedMatchCount !== 2) {
      throw ApplicationErrors.conflict(
        'A third-place match is only valid after a round with exactly two main matches',
      );
    }
    if (!previousPhase) {
      return;
    }

    const previousMatches = await this.matchRepository.find({
      where: { phase: { phaseId: previousPhase.phaseId } },
      relations: { homeTeam: true, awayTeam: true },
    });
    const sourcePositions = isThirdPlace
      ? [1, 2]
      : [bracketPosition! * 2 - 1, bracketPosition! * 2];

    for (const [index, assignedTeamId] of [
      homeTeamId,
      awayTeamId,
    ].entries()) {
      if (assignedTeamId === null) {
        continue;
      }

      const sourcePosition = sourcePositions[index];
      const sourceMatches = previousMatches.filter(
        (candidate) =>
          !candidate.isThirdPlace &&
          candidate.bracketPosition === sourcePosition,
      );
      if (sourceMatches.length !== 1) {
        throw ApplicationErrors.conflict(
          `Create exactly one match at position ${sourcePosition} in the previous final phase`,
        );
      }

      const expectedTeamId = this.getQualifiedTeamId(
        sourceMatches[0],
        isThirdPlace ? 'loser' : 'winner',
      );
      if (expectedTeamId === null) {
        throw ApplicationErrors.conflict(
          `Finish the match at position ${sourcePosition} in the previous final phase before assigning its qualifier`,
        );
      }
      if (assignedTeamId !== expectedTeamId) {
        throw ApplicationErrors.invalidInput(
          `Team ${assignedTeamId} is not the ${isThirdPlace ? 'loser' : 'winner'} of previous-round match ${sourcePosition}`,
        );
      }
    }
  }

  private async assertFinalRoundFixturesComplete(
    phase: FinalPhase,
  ): Promise<void> {
    const matches = await this.matchRepository.find({
      where: { phase: { phaseId: phase.phaseId } },
      relations: { homeTeam: true, awayTeam: true },
    });
    const mainMatches = matches.filter((match) => !match.isThirdPlace);
    const thirdPlaceMatches = matches.filter((match) => match.isThirdPlace);
    const expectedCount = phase.expectedMatchCount ?? 0;
    const positions = new Set(
      mainMatches
        .map((match) => match.bracketPosition)
        .filter((position): position is number => position != null),
    );
    if (
      expectedCount < 1 ||
      mainMatches.length !== expectedCount ||
      positions.size !== expectedCount ||
      Array.from({ length: expectedCount }, (_, index) => index + 1).some(
        (position) => !positions.has(position),
      )
    ) {
      throw ApplicationErrors.conflict(
        `Create exactly ${expectedCount} main matches at positions 1 through ${expectedCount} in phase "${phase.name}"`,
      );
    }
    if (
      (phase.isThirdPlace && thirdPlaceMatches.length !== 1) ||
      (!phase.isThirdPlace && thirdPlaceMatches.length !== 0) ||
      thirdPlaceMatches.some((match) => match.bracketPosition !== 1)
    ) {
      throw ApplicationErrors.conflict(
        `Phase "${phase.name}" must contain exactly the configured third-place match`,
      );
    }
  }

  private async assertDownstreamAssignmentsMatchResult(
    match: Match,
    homeScore: number,
    awayScore: number,
  ): Promise<void> {
    const phase = match.phase as FinalPhase;
    const nextPhase = await this.findAdjacentFinalPhase(phase, 'next');
    if (!nextPhase) {
      return;
    }

    const position = match.bracketPosition!;
    const nextMatches = await this.matchRepository.find({
      where: { phase: { phaseId: nextPhase.phaseId } },
      relations: { homeTeam: true, awayTeam: true },
    });
    const targetPosition = Math.ceil(position / 2);
    const target = nextMatches.find(
      (candidate) =>
        !candidate.isThirdPlace &&
        candidate.bracketPosition === targetPosition,
    );
    if (!target) {
      return;
    }

    const winnerId =
      homeScore === awayScore
        ? null
        : homeScore > awayScore
          ? match.homeTeam!.teamId
          : match.awayTeam!.teamId;
    const destinationSide =
      position % 2 === 1 ? 'homeTeam' : 'awayTeam';
    const assignedWinnerId = target[destinationSide]?.teamId ?? null;
    if (
      assignedWinnerId !== null &&
      winnerId !== null &&
      assignedWinnerId !== winnerId
    ) {
      throw ApplicationErrors.conflict(
        `The ${destinationSide === 'homeTeam' ? 'home' : 'away'} team in next-round match #${target.matchId} must be the winner of this match`,
      );
    }
    if (assignedWinnerId !== null && winnerId === null) {
      throw ApplicationErrors.conflict(
        'A tied match has no winner to assign to the next round',
      );
    }

    if (nextPhase.isThirdPlace) {
      if (phase.expectedMatchCount !== 2 || position > 2) {
        throw ApplicationErrors.conflict(
          'Only the two semifinal matches can supply teams to a third-place match',
        );
      }
      const thirdPlaceMatch = nextMatches.find(
        (candidate) => candidate.isThirdPlace,
      );
      if (!thirdPlaceMatch) {
        return;
      }
      const loserId =
        homeScore === awayScore
          ? null
          : homeScore > awayScore
            ? match.awayTeam!.teamId
            : match.homeTeam!.teamId;
      const assignedLoserId = thirdPlaceMatch[destinationSide]?.teamId ?? null;
      if (
        assignedLoserId !== null &&
        loserId !== null &&
        assignedLoserId !== loserId
      ) {
        throw ApplicationErrors.conflict(
          `The ${destinationSide === 'homeTeam' ? 'home' : 'away'} team in the third-place match must be the loser of this match`,
        );
      }
      if (assignedLoserId !== null && loserId === null) {
        throw ApplicationErrors.conflict(
          'A tied match has no losing team to assign to the third-place match',
        );
      }
    }
  }

  private async assertFinalMatchDeletionSafe(
    match: Match,
    manager: EntityManager,
  ): Promise<void> {
    if (!this.isFinalPhase(match.phase)) {
      return;
    }
    const phase = match.phase as FinalPhase;
    const nextPhase = await this.findAdjacentFinalPhase(phase, 'next');
    if (
      !nextPhase ||
      match.bracketPosition == null
    ) {
      return;
    }

    const repository = manager.getRepository(Match);
    const nextMatches = await repository.find({
      where: { phase: { phaseId: nextPhase.phaseId } },
      relations: { homeTeam: true, awayTeam: true },
    });
    const position = match.bracketPosition!;
    const destinationSide =
      position % 2 === 1 ? 'homeTeam' : 'awayTeam';
    const nextPosition = Math.ceil(position / 2);
    const winnerMatch = nextMatches.find(
      (candidate) =>
        !candidate.isThirdPlace &&
        candidate.bracketPosition === nextPosition,
    );
    const thirdPlaceMatch = nextMatches.find(
      (candidate) => candidate.isThirdPlace,
    );
    if (
      winnerMatch?.[destinationSide] != null ||
      (nextPhase.isThirdPlace &&
        thirdPlaceMatch?.[destinationSide] != null)
    ) {
      throw ApplicationErrors.conflict(
        'Clear this match\'s manually assigned qualifiers from the next phase before deleting it',
      );
    }
  }

  private async findAdjacentFinalPhase(
    phase: FinalPhase,
    direction: 'previous' | 'next',
  ): Promise<FinalPhase | null> {
    const finalPhases = await this.phaseRepository.manager
      .getRepository(FinalPhase)
      .find({
        where: { tournamentId: phase.tournamentId },
        order: { order: 'ASC' },
      });
    const adjacent = finalPhases
      .filter((candidate) =>
        direction === 'previous'
          ? candidate.order < phase.order
          : candidate.order > phase.order,
      )
      .sort((left, right) =>
        direction === 'previous'
          ? right.order - left.order
          : left.order - right.order,
      )[0];
    return adjacent ?? null;
  }

  private getQualifiedTeamId(
    match: Match,
    result: 'winner' | 'loser',
  ): number | null {
    if (
      match.state?.trim().toUpperCase() !== 'FINISHED' ||
      !match.resultRegistered ||
      match.homeScore == null ||
      match.awayScore == null ||
      match.homeScore === match.awayScore ||
      !match.homeTeam ||
      !match.awayTeam
    ) {
      return null;
    }
    const homeWon = match.homeScore > match.awayScore;
    if (result === 'winner') {
      return homeWon ? match.homeTeam.teamId : match.awayTeam.teamId;
    }
    return homeWon ? match.awayTeam.teamId : match.homeTeam.teamId;
  }
}
