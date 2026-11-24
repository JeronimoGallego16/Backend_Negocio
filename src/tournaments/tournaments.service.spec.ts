import { jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { CompetitionGroup } from '../groups/entities/competition-group.entity';
import { Match } from '../matches/entities/match.entity';
import { GroupPhase } from '../phases/entities/group-phase.entity';
import { Phase } from '../phases/entities/phase.entity';
import { Sport } from '../sports/entities/sport.entity';
import { Team } from '../teams/entities/team.entity';
import { Tournament } from './entities/tournament.entity';
import { TournamentMapper } from './mappers/tournament.mapper';
import { TournamentsRepository } from './repositories/tournaments.repository';
import { TournamentsService } from './tournaments.service';

describe('TournamentsService', () => {
  it('calculates standings only from finished matches and returns view-ready rows', async () => {
    const tournament = Object.assign(new Tournament(), {
      tournamentId: 4,
      name: 'League',
      modality: 'Round robin',
      startDate: '2026-11-30',
      endDate: '2026-12-09',
      status: 'IN_PROGRESS',
      capacity: 4,
      sport: Object.assign(new Sport(), { sportId: 1 }),
    });
    const phase = Object.assign(new GroupPhase(), {
      phaseId: 8,
      name: 'Group stage',
      order: 1,
      tournamentId: 4,
    });
    const finishedMatch = Object.assign(new Match(), {
      matchId: 1,
      state: 'FINISHED',
      homeScore: 2,
      awayScore: 0,
      homeTeam: { teamId: 10, name: 'Alpha' },
      awayTeam: { teamId: 20, name: 'Beta' },
    });
    const unfinishedMatch = Object.assign(new Match(), {
      matchId: 2,
      state: 'PROGRAMMED',
      homeScore: 5,
      awayScore: 0,
      homeTeam: { teamId: 10, name: 'Alpha' },
      awayTeam: { teamId: 30, name: 'Gamma' },
    });
    const tournamentRepository = {
      findOne: jest.fn().mockResolvedValue(tournament),
    } as unknown as Repository<Tournament>;
    const phaseRepository = {
      find: jest.fn().mockResolvedValue([phase]),
    } as unknown as Repository<Phase>;
    const matchRepository = {
      find: jest.fn().mockResolvedValue([finishedMatch, unfinishedMatch]),
    } as unknown as Repository<Match>;
    const groupRepository = {
      find: jest.fn().mockResolvedValue([
        {
          groupId: 2,
          phaseId: 8,
          letterOrNumber: 'A',
          maxTeams: 4,
        },
      ]),
    } as unknown as Repository<CompetitionGroup>;
    const teamRepository = {
      find: jest.fn().mockResolvedValue([
        { teamId: 10, name: 'Alpha' },
        { teamId: 20, name: 'Beta' },
        { teamId: 30, name: 'Gamma' },
      ]),
    } as unknown as Repository<Team>;
    const service = new TournamentsService(
      tournamentRepository,
      {} as Repository<Sport>,
      phaseRepository,
      matchRepository,
      groupRepository,
      teamRepository,
      {} as TournamentsRepository,
      new TournamentMapper(),
    );

    const development = await service.findDevelopment(4);
    const phases = development.phases as Array<{
      groups: Array<{
        letterOrNumber: string;
        standings: Array<{
          teamId: number;
          teamName: string;
          played: number;
          points: number;
        }>;
      }>;
    }>;
    const standings = phases[0].groups[0].standings;

    expect(phases[0].groups[0].letterOrNumber).toBe('A');
    expect(standings).toEqual([
      expect.objectContaining({
        teamId: 10,
        teamName: 'Alpha',
        played: 1,
        points: 3,
      }),
      expect.objectContaining({
        teamId: 30,
        teamName: 'Gamma',
        played: 0,
        points: 0,
      }),
      expect.objectContaining({
        teamId: 20,
        teamName: 'Beta',
        played: 1,
        points: 0,
      }),
    ]);
  });
});
