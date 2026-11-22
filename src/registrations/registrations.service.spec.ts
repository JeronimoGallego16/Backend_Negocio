import { jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { ApplicationErrorCode } from '../common/errors/application-error';
import { Team } from '../teams/entities/team.entity';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { Sport } from '../sports/entities/sport.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Registration } from './entities/registration.entity';
import { RegistrationMapper } from './mappers/registration.mapper';
import { RegistrationsRepository } from './repositories/registrations.repository';
import { RegistrationsService } from './registrations.service';

describe('RegistrationsService', () => {
  const tournament = Object.assign(new Tournament(), {
    tournamentId: 9,
    startDate: '2999-12-15',
    endDate: '3000-01-15',
    registrationEndDate: '2999-12-01',
    status: 'OPEN',
    capacity: 4,
    sport: Object.assign(new Sport(), { sportId: 5 }),
  });
  const team = Object.assign(new Team(), {
    teamId: 14,
    sportId: 99,
  });
  const teamSport = Object.assign(new TeamSport(), {
    team,
    sport: tournament.sport,
  });

  const saveRegistration = jest.fn(
    async (entity: Registration): Promise<Registration> => {
      entity.registrationId = 31;
      return entity;
    },
  );
  const findRegistration = jest.fn();
  const removeRegistration = jest.fn();
  const findTournament = jest.fn();
  const findTeam = jest.fn();
  const findTeamSport = jest.fn();
  const existsRegistration = jest.fn();
  const countRegistrations = jest.fn();

  const registrationRepository = {
    save: saveRegistration,
    findOne: findRegistration,
    remove: removeRegistration,
  } as unknown as Repository<Registration>;
  const tournamentRepository = {
    findOne: findTournament,
  } as unknown as Repository<Tournament>;
  const teamRepository = {
    findOne: findTeam,
  } as unknown as Repository<Team>;
  const teamSportRepository = {
    findOne: findTeamSport,
  } as unknown as Repository<TeamSport>;
  const registrationsRepository = {
    existsByTournamentAndTeam: existsRegistration,
    countByTournament: countRegistrations,
  } as unknown as RegistrationsRepository;

  let service: RegistrationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    findTournament.mockResolvedValue(tournament);
    findTeam.mockResolvedValue(team);
    findTeamSport.mockResolvedValue(teamSport);
    existsRegistration.mockResolvedValue(false);
    countRegistrations.mockResolvedValue(0);

    service = new RegistrationsService(
      registrationRepository,
      tournamentRepository,
      teamRepository,
      teamSportRepository,
      registrationsRepository,
      new RegistrationMapper(),
    );
  });

  it('registers a team using the team_sports association as sport authority', async () => {
    const result = await service.create({ tournamentId: 9, teamId: 14 });

    expect(result).toEqual({
      registrationId: 31,
      registrationDate: expect.any(String),
      tournamentId: 9,
      teamId: 14,
    });
    expect(findTeamSport).toHaveBeenCalledWith({
      where: {
        team: { teamId: 14 },
        sport: { sportId: 5 },
      },
    });
  });

  it('rejects a team without an assignment to the tournament sport', async () => {
    findTeamSport.mockResolvedValue(null);

    await expect(
      service.create({ tournamentId: 9, teamId: 14 }),
    ).rejects.toMatchObject({
      code: ApplicationErrorCode.INVALID_INPUT,
    });
    expect(saveRegistration).not.toHaveBeenCalled();
  });

  it('rejects registrations when the tournament is not OPEN', async () => {
    findTournament.mockResolvedValue({
      ...tournament,
      status: 'PUBLISHED',
    });

    await expect(
      service.create({ tournamentId: 9, teamId: 14 }),
    ).rejects.toMatchObject({
      code: ApplicationErrorCode.CONFLICT,
    });
    expect(findTeamSport).not.toHaveBeenCalled();
  });

  it('rejects registrations after the registration closing date', async () => {
    findTournament.mockResolvedValue({
      ...tournament,
      registrationEndDate: '2000-01-01',
    });

    await expect(
      service.create({ tournamentId: 9, teamId: 14 }),
    ).rejects.toMatchObject({
      code: ApplicationErrorCode.CONFLICT,
    });
    expect(findTeamSport).not.toHaveBeenCalled();
  });

  it('withdraws only the registration and returns a confirmation', async () => {
    findRegistration.mockResolvedValue(
      Object.assign(new Registration(), {
        registrationId: 31,
        tournament,
      }),
    );

    await expect(service.remove(31)).resolves.toEqual({
      message: 'Registration #31 withdrawn successfully',
    });
    expect(removeRegistration).toHaveBeenCalledWith(
      expect.objectContaining({ registrationId: 31 }),
    );
  });

  it('rejects withdrawals after the registration period closes', async () => {
    findRegistration.mockResolvedValue(
      Object.assign(new Registration(), {
        registrationId: 31,
        tournament: { ...tournament, registrationEndDate: '2000-01-01' },
      }),
    );

    await expect(service.remove(31)).rejects.toMatchObject({
      code: ApplicationErrorCode.CONFLICT,
    });
    expect(removeRegistration).not.toHaveBeenCalled();
  });
});
