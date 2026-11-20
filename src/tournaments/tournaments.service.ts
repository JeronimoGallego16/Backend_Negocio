import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { Sport } from '../sports/entities/sport.entity';
import { TournamentDto } from './dto/tournament.dto';
import { TournamentResponseDto } from './dto/tournament-response.dto';
import { Tournament } from './entities/tournament.entity';
import { TournamentMapper } from './mappers/tournament.mapper';
import { TournamentsRepository } from './repositories/tournaments.repository';
import { Match } from '../matches/entities/match.entity';
import { CompetitionGroup } from '../groups/entities/competition-group.entity';
import { Team } from '../teams/entities/team.entity';
import { Phase } from '../phases/entities/phase.entity';

/**
 * Business logic for managing tournaments.
 */
@Injectable()
export class TournamentsService {
  /**
   * Creates the tournament service.
   *
   * @param tournamentRepository - TypeORM repository used for tournament CRUD.
   * @param sportRepository - TypeORM repository used to verify sports.
   * @param tournamentsRepository - Repository for tournament-specific queries.
   * @param tournamentMapper - Mapper for tournament entities and DTOs.
   */
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Sport)
    private readonly sportRepository: Repository<Sport>,
    @InjectRepository(Phase)
    private readonly phaseRepository: Repository<Phase>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(CompetitionGroup)
    private readonly groupRepository: Repository<CompetitionGroup>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    private readonly tournamentsRepository: TournamentsRepository,
    private readonly tournamentMapper: TournamentMapper,
  ) {}

  /**
   * Creates a tournament after validating its dates and sport.
   *
   * @param dto - Required tournament data.
   * @returns The created tournament.
   * @throws ApplicationError When data is invalid or the sport does not exist.
   */
  async create(dto: TournamentDto): Promise<TournamentResponseDto> {
    this.validateRequiredFields(dto);
    this.validateDates(dto.startDate!, dto.endDate!);
    if (await this.tournamentsRepository.existsByName(dto.name!)) {
      throw ApplicationErrors.conflict('A tournament with this name already exists');
    }
    const sport = await this.sportRepository.findOne({
      where: { sportId: dto.sportId },
    });
    if (!sport) throw ApplicationErrors.notFound(`Sport with id ${dto.sportId} not found`);
    const entity = this.tournamentMapper.toEntity(dto);
    entity.sport = sport;
    return this.tournamentMapper.toResponseDto(
      await this.tournamentRepository.save(entity),
    );
  }

  /**
   * Retrieves every tournament with its sport.
   *
   * @returns All tournaments.
   */
  async findAll(): Promise<TournamentResponseDto[]> {
    const tournaments = await this.tournamentRepository.find({ relations: { sport: true } });
    return this.tournamentMapper.toResponseDtoList(tournaments);
  }

  /**
   * Retrieves a tournament by identifier.
   *
   * @param id - Tournament identifier.
   * @returns The matching tournament.
   * @throws ApplicationError When the tournament does not exist.
   */
  async findOne(id: number): Promise<TournamentResponseDto> {
    const tournament = await this.tournamentRepository.findOne({
      where: { tournamentId: id },
      relations: { sport: true },
    });
    if (!tournament) throw ApplicationErrors.notFound(`Tournament with id ${id} not found`);
    return this.tournamentMapper.toResponseDto(tournament);
  }

  /**
   * Builds the complete development structure of one tournament.
   *
   * Group standings use 3 points for a win, 1 for a draw and 0 for a loss.
   * Teams are ordered by points, goal difference, goals for and team name.
   *
   * @param id - Tournament identifier.
   * @returns Tournament, phases, groups, standings and matches.
   */
  async findDevelopment(id: number): Promise<Record<string, unknown>> {
    const tournament = await this.tournamentRepository.findOne({
      where: { tournamentId: id },
      relations: { sport: true },
    });
    if (!tournament) {
      throw ApplicationErrors.notFound(`Tournament with id ${id} not found`);
    }

    const phases = await this.phaseRepository.find({
      where: { tournamentId: id },
      order: { order: 'ASC' },
    });
    const phasePayload = [];

    for (const phase of phases) {
      const matches = await this.matchRepository.find({
        where: { phase: { phaseId: phase.phaseId } },
        relations: { homeTeam: true, awayTeam: true, phase: true },
        order: { bracketPosition: 'ASC', matchId: 'ASC' },
      });
      const matchPayload = [];

      for (const match of matches) {
        matchPayload.push({
          matchId: match.matchId,
          duration: match.duration,
          state: match.state,
          roundName: match.roundName,
          bracketPosition: match.bracketPosition,
          nextMatchId: match.nextMatchId,
          isThirdPlace: match.isThirdPlace,
          homeTeam: {
            teamId: match.homeTeam.teamId,
            name: match.homeTeam.name,
          },
          awayTeam: {
            teamId: match.awayTeam.teamId,
            name: match.awayTeam.name,
          },
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          resultRegistered:
            match.resultRegistered ||
            (match.homeScore !== undefined && match.awayScore !== undefined),
        });
      }

      const groupPayload = [];
      if ((phase as Phase & { groups?: CompetitionGroup[] }).constructor.name !== 'FinalPhase') {
        const groups = await this.groupRepository.find({
          where: { phaseId: phase.phaseId },
          order: { groupId: 'ASC' },
        });
        for (const group of groups) {
          const teams = await this.teamRepository.find({
            where: { groupId: group.groupId },
          });
          const standings = this.calculateStandings(teams, matches);
          groupPayload.push({
            groupId: group.groupId,
            name: group.letterOrNumber,
            teams,
            standings,
          });
        }
      }

      phasePayload.push({
        phaseId: phase.phaseId,
        name: phase.name,
        order: phase.order,
        type: (phase as unknown as { type?: string }).type ?? phase.constructor.name.replace('Phase', '').toUpperCase(),
        isThirdPlace:
          (phase as unknown as { isThirdPlace?: boolean }).isThirdPlace ?? false,
        groups: groupPayload,
        matches: matchPayload,
        bracket:
          (phase as unknown as { isThirdPlace?: boolean }).isThirdPlace ||
          matchPayload.length > 0
            ? matchPayload
            : [],
      });
    }

    return {
      tournament: this.tournamentMapper.toResponseDto(tournament),
      phases: phasePayload,
    };
  }

  /**
   * Updates supplied tournament fields.
   *
   * @param id - Tournament identifier.
   * @param dto - Fields to update.
   * @returns The updated tournament.
   * @throws ApplicationError When the tournament or sport does not exist.
   */
  async update(id: number, dto: TournamentDto): Promise<TournamentResponseDto> {
    const tournament = await this.tournamentRepository.findOne({
      where: { tournamentId: id },
      relations: { sport: true },
    });
    if (!tournament) throw ApplicationErrors.notFound(`Tournament with id ${id} not found`);
    const merged = this.tournamentMapper.mergeEntity(tournament, dto);
    if (!merged.name?.trim() || !merged.modality?.trim() || !merged.startDate || !merged.endDate || !merged.status || !merged.capacity || !merged.sport) {
      throw ApplicationErrors.invalidInput('Tournament fields cannot be empty');
    }
    this.validateDates(merged.startDate, merged.endDate);
    if (await this.tournamentsRepository.existsByName(merged.name, id)) {
      throw ApplicationErrors.conflict('A tournament with this name already exists');
    }
    if (dto.sportId !== undefined) {
      const sport = await this.sportRepository.findOne({ where: { sportId: dto.sportId } });
      if (!sport) throw ApplicationErrors.notFound(`Sport with id ${dto.sportId} not found`);
      merged.sport = sport;
    }
    return this.tournamentMapper.toResponseDto(
      await this.tournamentRepository.save(merged),
    );
  }

  /**
   * Deletes a tournament only when it has no registrations.
   *
   * @param id - Tournament identifier.
   * @returns Nothing when deletion succeeds.
   * @throws ApplicationError When the tournament is missing or still referenced.
   */
  async remove(id: number): Promise<void> {
    const tournament = await this.tournamentRepository.findOne({ where: { tournamentId: id } });
    if (!tournament) throw ApplicationErrors.notFound(`Tournament with id ${id} not found`);
    if (await this.tournamentsRepository.hasRegistrations(id)) {
      throw ApplicationErrors.conflict('A tournament with registrations cannot be deleted');
    }
    if (await this.tournamentsRepository.hasPhases(id)) {
      throw ApplicationErrors.conflict('A tournament with phases cannot be deleted');
    }
    if (await this.tournamentsRepository.hasMatches(id)) {
      throw ApplicationErrors.conflict(
        'A tournament with associated matches cannot be deleted',
      );
    }
    if (await this.tournamentsRepository.hasTeams(id)) {
      throw ApplicationErrors.conflict(
        'A tournament with registered teams cannot be deleted',
      );
    }
    await this.tournamentRepository.remove(tournament);
  }

  /**
   * Calculates a points table for the teams in a competition group.
   *
   * @param teams - Teams in the group.
   * @param matches - Matches associated with the group phase.
   * @returns Ordered standings rows.
   */
  private calculateStandings(
    teams: Team[],
    matches: Match[],
  ): Array<Record<string, unknown>> {
    const rows = teams.map((team) => ({
      team: { teamId: team.teamId, name: team.name },
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    }));
    const byTeamId = new Map(rows.map((row) => [row.team.teamId, row]));

    for (const match of matches) {
      if (
        match.homeScore === undefined ||
        match.awayScore === undefined ||
        match.homeScore === null ||
        match.awayScore === null
      ) {
        continue;
      }
      const home = byTeamId.get(match.homeTeam.teamId);
      const away = byTeamId.get(match.awayTeam.teamId);
      if (!home || !away) continue;

      home.played++;
      away.played++;
      home.goalsFor += match.homeScore;
      home.goalsAgainst += match.awayScore;
      away.goalsFor += match.awayScore;
      away.goalsAgainst += match.homeScore;
      if (match.homeScore > match.awayScore) {
        home.won++;
        away.lost++;
        home.points += 3;
      } else if (match.homeScore < match.awayScore) {
        away.won++;
        home.lost++;
        away.points += 3;
      } else {
        home.drawn++;
        away.drawn++;
        home.points++;
        away.points++;
      }
    }

    return rows
      .map((row) => ({
        ...row,
        goalDifference: row.goalsFor - row.goalsAgainst,
      }))
      .sort(
        (left, right) =>
          right.points - left.points ||
          right.goalDifference - left.goalDifference ||
          right.goalsFor - left.goalsFor ||
          left.team.name.localeCompare(right.team.name),
      );
  }

  /**
   * Validates required create fields.
   *
   * @param dto - Tournament data to validate.
   * @returns Nothing when valid.
   */
  private validateRequiredFields(dto: TournamentDto): void {
    if (!dto.name?.trim() || !dto.modality?.trim() || !dto.startDate || !dto.endDate || !dto.status?.trim() || !dto.capacity || !dto.sportId) {
      throw ApplicationErrors.invalidInput('name, modality, dates, status, capacity and sportId are required');
    }
  }

  /**
   * Validates chronological tournament dates.
   *
   * @param startDate - Tournament start date.
   * @param endDate - Tournament end date.
   * @returns Nothing when valid.
   */
  private validateDates(startDate: string, endDate: string): void {
    if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
      throw ApplicationErrors.invalidInput('startDate cannot be after endDate');
    }
  }
}
