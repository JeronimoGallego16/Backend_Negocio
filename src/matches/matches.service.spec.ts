import { Repository } from 'typeorm';
import { ApplicationErrorCode } from '../common/errors/application-error';
import { Phase } from '../phases/entities/phase.entity';
import { Sport } from '../sports/entities/sport.entity';
import { Team } from '../teams/entities/team.entity';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Match } from './entities/match.entity';
import { MatchMapper } from './mappers/match.mapper';
import { MatchesService } from './matches.service';

describe('MatchesService', () => {
  const phase = { phaseId: 3, tournamentId: 1 } as Phase;
  const homeTeam = Object.assign(new Team(), { teamId: 1, sportId: 99 });
  const awayTeam = Object.assign(new Team(), { teamId: 2, sportId: 99 });
  const tournament = Object.assign(new Tournament(), {
    tournamentId: 1,
    sport: Object.assign(new Sport(), { sportId: 1 }),
  });

  const saveMatch = jest.fn(
    async (entity: Match): Promise<Match> =>
      Object.assign(entity, { matchId: 12 }),
  );
  const findTeam = jest.fn(
    async ({ where }: { where: { teamId: number } }): Promise<Team | null> =>
      ({ 1: homeTeam, 2: awayTeam })[where.teamId] ?? null,
  );
  const findPhase = jest.fn(
    async ({ where }: { where: { phaseId: number } }): Promise<Phase | null> =>
      where.phaseId === phase.phaseId ? phase : null,
  );
  const findTournament = jest.fn(async () => tournament);
  const findTeamSport = jest.fn(
    async ({
      where,
    }: {
      where: { team: { teamId: number }; sport: { sportId: number } };
    }): Promise<TeamSport | null> => {
      const exists = assignments.some(
        (assignment) =>
          assignment.teamId === where.team.teamId &&
          assignment.sportId === where.sport.sportId,
      );
      return exists ? new TeamSport() : null;
    },
  );

  let assignments: Array<{ teamId: number; sportId: number }>;

  const matchRepository = {
    save: saveMatch,
  } as unknown as Repository<Match>;
  const teamRepository = {
    findOne: findTeam,
  } as unknown as Repository<Team>;
  const phaseRepository = {
    findOne: findPhase,
  } as unknown as Repository<Phase>;
  const teamSportRepository = {
    findOne: findTeamSport,
  } as unknown as Repository<TeamSport>;
  const tournamentRepository = {
    findOne: findTournament,
  } as unknown as Repository<Tournament>;

  let service: MatchesService;

  beforeEach(() => {
    jest.clearAllMocks();
    assignments = [
      { teamId: homeTeam.teamId, sportId: 1 },
      { teamId: awayTeam.teamId, sportId: 1 },
    ];
    service = new MatchesService(
      matchRepository,
      teamRepository,
      phaseRepository,
      teamSportRepository,
      tournamentRepository,
      new MatchMapper(),
    );
  });

  const matchDto = {
    duration: '90 minutos',
    state: 'PROGRAMADO',
    homeTeamId: homeTeam.teamId,
    awayTeamId: awayTeam.teamId,
    phaseId: phase.phaseId,
    isThirdPlace: false,
  };

  it('creates a match when both teams are assigned to the tournament sport', async () => {
    const result = await service.create(matchDto);

    expect(result).toMatchObject({
      matchId: 12,
      homeTeamId: 1,
      awayTeamId: 2,
      phaseId: 3,
    });
    expect(findTeamSport).toHaveBeenNthCalledWith(1, {
      where: { team: { teamId: 1 }, sport: { sportId: 1 } },
    });
    expect(findTeamSport).toHaveBeenNthCalledWith(2, {
      where: { team: { teamId: 2 }, sport: { sportId: 1 } },
    });
  });

  it('rejects a team without an assignment to the tournament sport', async () => {
    assignments = [{ teamId: awayTeam.teamId, sportId: 1 }];

    await expect(service.create(matchDto)).rejects.toMatchObject({
      code: ApplicationErrorCode.INVALID_INPUT,
      message: 'Match teams must belong to the phase tournament sport',
    });
    expect(saveMatch).not.toHaveBeenCalled();
  });

  it('rejects a team assigned only to a different sport', async () => {
    assignments = [
      { teamId: homeTeam.teamId, sportId: 1 },
      { teamId: awayTeam.teamId, sportId: 2 },
    ];

    await expect(service.create(matchDto)).rejects.toMatchObject({
      code: ApplicationErrorCode.INVALID_INPUT,
      message: 'Match teams must belong to the phase tournament sport',
    });
    expect(saveMatch).not.toHaveBeenCalled();
  });

  it('returns a not-found error when the phase does not exist', async () => {
    findPhase.mockResolvedValue(null);

    await expect(service.create(matchDto)).rejects.toMatchObject({
      code: ApplicationErrorCode.NOT_FOUND,
      message: 'Phase with id 3 not found',
    });
    expect(findTeamSport).not.toHaveBeenCalled();
    expect(saveMatch).not.toHaveBeenCalled();
  });
});
