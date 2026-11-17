import { jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { ApplicationErrorCode } from '../common/errors/application-error';
import { PlayerSkill } from '../player-skills/entities/player-skill.entity';
import { Skill } from '../skills/entities/skill.entity';
import { PlayerTeam } from '../player-teams/entities/player-team.entity';
import { Gender, Player } from './entities/player.entity';
import { PlayerTeamMapper } from '../player-teams/mappers/player-team.mapper';
import { PlayerSkillMapper } from '../player-skills/mappers/player-skill.mapper';
import { SkillMapper } from '../skills/mappers/skill.mapper';
import { PlayerMapper } from './mappers/player.mapper';
import { PlayerTeamsRepository } from '../player-teams/repositories/player-teams.repository';
import { PlayerSkillsRepository } from '../player-skills/repositories/player-skills.repository';
import { SkillsRepository } from '../skills/repositories/skills.repository';
import { PlayersRepository } from './repositories/players.repository';
import { PlayerTeamsService } from '../player-teams/player-teams.service';
import { PlayerSkillsService } from '../player-skills/player-skills.service';
import { SkillsService } from '../skills/skills.service';
import { PlayersService } from './players.service';
import { TeamsService } from '../teams/teams.service';

describe('player domain services', () => {
  it('creates a skill and rejects a duplicate name', async () => {
    const skill = Object.assign(new Skill(), {
      skillId: 1,
      name: 'Velocidad',
      description: null,
    });
    const entityRepository = {
      save: jest.fn().mockResolvedValue(skill),
      findOne: jest.fn(),
      remove: jest.fn(),
    } as unknown as Repository<Skill>;
    const skillsRepository = {
      existsByName: jest
        .fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true),
      hasAssignedPlayers: jest.fn(),
    } as unknown as SkillsRepository;
    const service = new SkillsService(
      entityRepository,
      skillsRepository,
      new SkillMapper(),
    );

    await expect(service.create({ name: 'Velocidad' })).resolves.toEqual({
      skillId: 1,
      name: 'Velocidad',
      description: null,
    });
    await expect(service.create({ name: 'Velocidad' })).rejects.toMatchObject({
      code: ApplicationErrorCode.CONFLICT,
    });
    await expect(service.create({})).rejects.toMatchObject({
      code: ApplicationErrorCode.INVALID_INPUT,
    });
  });

  it('creates a player as active and rejects duplicate email', async () => {
    const player = Object.assign(new Player(), {
      playerId: 7,
      name: 'Ana',
      lastName: 'Pérez',
      birthDate: '2000-01-01',
      gender: Gender.FEMALE,
      email: 'ana@example.com',
      identification: 'ID-7',
      active: true,
    });
    const entityRepository = {
      save: jest
        .fn()
        .mockImplementation(async (entity: Player) =>
          Object.assign(entity, { playerId: 7 }),
        ),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    } as unknown as Repository<Player>;
    const playersRepository = {
      existsByIdentification: jest.fn().mockResolvedValue(false),
      existsByEmail: jest
        .fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true),
      hasAssociatedData: jest.fn(),
    } as unknown as PlayersRepository;
    const service = new PlayersService(
      entityRepository,
      playersRepository,
      new PlayerMapper(),
    );

    await expect(
      service.create({
        name: 'Ana',
        lastName: 'Pérez',
        birthDate: '2000-01-01',
        gender: Gender.FEMALE,
        email: 'ana@example.com',
        identification: 'ID-7',
      }),
    ).resolves.toMatchObject({
      playerId: 7,
      active: true,
      email: player.email,
    });

    await expect(
      service.create({
        name: 'Ana',
        lastName: 'Pérez',
        birthDate: '2000-01-01',
        gender: Gender.FEMALE,
        email: 'ana@example.com',
        identification: 'ID-8',
      }),
    ).rejects.toMatchObject({ code: ApplicationErrorCode.CONFLICT });
  });

  it('assigns a skill once and rejects the same player-skill pair', async () => {
    const assignment = Object.assign(new PlayerSkill(), {
      playerSkillId: 3,
      playerId: 1,
      skillId: 2,
      level: 4,
      observations: null,
      player: { name: 'Ana', lastName: 'Pérez' },
      skill: { name: 'Velocidad' },
    });
    const entityRepository = {
      save: jest.fn().mockResolvedValue(assignment),
      remove: jest.fn(),
    } as unknown as Repository<PlayerSkill>;
    const assignmentRepository = {
      existsByPair: jest
        .fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true),
      findOneByPair: jest.fn().mockResolvedValue(assignment),
      findByPlayer: jest.fn(),
      findBySkill: jest.fn(),
    } as unknown as PlayerSkillsRepository;
    const playersService = {
      findOne: jest.fn().mockResolvedValue({ playerId: 1 }),
    } as unknown as PlayersService;
    const skillsService = {
      findOne: jest.fn().mockResolvedValue({ skillId: 2 }),
    } as unknown as SkillsService;
    const service = new PlayerSkillsService(
      entityRepository,
      assignmentRepository,
      playersService,
      skillsService,
      new PlayerSkillMapper(),
    );

    await expect(
      service.assign(1, { skillId: 2, level: 4 }),
    ).resolves.toMatchObject({
      playerId: 1,
      skillId: 2,
      playerName: 'Ana Pérez',
      skillName: 'Velocidad',
    });
    await expect(
      service.assign(1, { skillId: 2, level: 4 }),
    ).rejects.toMatchObject({ code: ApplicationErrorCode.CONFLICT });
  });

  it('closes the previous open team assignment when transferring', async () => {
    const previous = Object.assign(new PlayerTeam(), {
      playerTeamId: 5,
      playerId: 1,
      teamId: 10,
      startDate: '2020-01-01',
      endDate: null,
    });
    const saved = Object.assign(new PlayerTeam(), {
      playerTeamId: 6,
      playerId: 1,
      teamId: 11,
      startDate: '2024-01-01',
      endDate: null,
      player: { name: 'Ana', lastName: 'Pérez' },
      team: { name: 'Equipo B' },
    });
    const entityRepository = {
      save: jest.fn().mockResolvedValue(saved),
    } as unknown as Repository<PlayerTeam>;
    const assignmentsRepository = {
      findOverlapping: jest.fn().mockResolvedValue([previous]),
      saveClosingPrevious: jest.fn().mockResolvedValue(saved),
      findByTeam: jest.fn(),
      findByPlayer: jest.fn(),
      belongsToTeam: jest.fn(),
    } as unknown as PlayerTeamsRepository;
    const playersService = {
      findOne: jest.fn().mockResolvedValue({ playerId: 1 }),
    } as unknown as PlayersService;
    const teamsService = {
      findOne: jest.fn().mockResolvedValue({ teamId: 11 }),
    } as unknown as TeamsService;
    const service = new PlayerTeamsService(
      entityRepository,
      assignmentsRepository,
      playersService,
      teamsService,
      new PlayerTeamMapper(),
    );

    await expect(
      service.assign(11, {
        playerId: 1,
        startDate: '2024-01-01',
      }),
    ).resolves.toMatchObject({
      teamId: 11,
      startDate: '2024-01-01',
      teamName: 'Equipo B',
    });
    expect(previous.endDate).toBe('2024-01-01');
    expect(assignmentsRepository.saveClosingPrevious).toHaveBeenCalledWith(
      previous,
      expect.objectContaining({ teamId: 11 }),
    );
  });

  it('rejects overlapping team periods that cannot be transferred', async () => {
    const previous = Object.assign(new PlayerTeam(), {
      playerTeamId: 5,
      playerId: 1,
      teamId: 10,
      startDate: '2020-01-01',
      endDate: '2025-01-01',
    });
    const service = new PlayerTeamsService(
      {} as Repository<PlayerTeam>,
      {
        findOverlapping: jest.fn().mockResolvedValue([previous]),
      } as unknown as PlayerTeamsRepository,
      {
        findOne: jest.fn().mockResolvedValue({}),
      } as unknown as PlayersService,
      { findOne: jest.fn().mockResolvedValue({}) } as unknown as TeamsService,
      new PlayerTeamMapper(),
    );

    await expect(
      service.assign(11, {
        playerId: 1,
        startDate: '2024-01-01',
        endDate: '2026-01-01',
      }),
    ).rejects.toMatchObject({ code: ApplicationErrorCode.CONFLICT });
  });
});
