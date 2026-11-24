import { jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { ApplicationErrorCode } from '../common/errors/application-error';
import { PlayersService } from '../players/players.service';
import { PlayerTeamsService } from '../player-teams/player-teams.service';
import { Annotation } from './entities/annotation.entity';
import { AnnotationMapper } from './mappers/annotation.mapper';
import { AnnotationsRepository } from './repositories/annotations.repository';
import { AnnotationsService } from './annotations.service';
import { MatchesService } from '../matches/matches.service';

describe('AnnotationsService', () => {
  it('checks the match and player before creating an annotation', async () => {
    const saved = Object.assign(new Annotation(), {
      annotationId: 1,
      matchId: 9,
      playerId: 4,
      minute: 12,
      type: 'gol',
      voided: false,
    });
    const loaded = Object.assign(saved, {
      player: { name: 'Luis', lastName: 'Díaz' },
    });
    const repository = {
      save: jest.fn().mockResolvedValue(saved),
    } as unknown as Repository<Annotation>;
    const annotationsRepository = {
      findOneWithPlayer: jest.fn().mockResolvedValue(loaded),
      findByMatch: jest.fn(),
    } as unknown as AnnotationsRepository;
    const matchesService = {
      findOne: jest.fn().mockResolvedValue({
        matchId: 9,
        state: 'ACTIVE',
        homeTeamId: 20,
        awayTeamId: 21,
      }),
    } as unknown as MatchesService;
    const playersService = {
      findOne: jest.fn().mockResolvedValue({ playerId: 4 }),
    } as unknown as PlayersService;
    const playerTeamsService = {
      belongsToTeam: jest
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false),
    } as unknown as PlayerTeamsService;
    const service = new AnnotationsService(
      repository,
      annotationsRepository,
      matchesService,
      playersService,
      playerTeamsService,
      new AnnotationMapper(),
    );

    await expect(
      service.create(9, { playerId: 4, minute: 12, type: 'gol' }),
    ).resolves.toMatchObject({
      matchId: 9,
      playerId: 4,
      playerName: 'Luis Díaz',
      voided: false,
    });
    expect(matchesService.findOne).toHaveBeenCalledWith(9);
    expect(playersService.findOne).toHaveBeenCalledWith(4);
    const currentDate = new Date().toISOString().slice(0, 10);
    expect(playerTeamsService.belongsToTeam).toHaveBeenNthCalledWith(
      1,
      4,
      20,
      currentDate,
    );
    expect(playerTeamsService.belongsToTeam).toHaveBeenNthCalledWith(
      2,
      4,
      21,
      currentDate,
    );
  });

  it('rejects annotations for matches that are not active', async () => {
    const save = jest.fn();
    const matchesService = {
      findOne: jest.fn().mockResolvedValue({
        matchId: 9,
        state: 'INACTIVE',
        homeTeamId: 20,
        awayTeamId: 21,
      }),
    } as unknown as MatchesService;
    const playersService = {
      findOne: jest.fn(),
    } as unknown as PlayersService;
    const playerTeamsService = {
      belongsToTeam: jest.fn(),
    } as unknown as PlayerTeamsService;
    const service = new AnnotationsService(
      { save } as unknown as Repository<Annotation>,
      {} as AnnotationsRepository,
      matchesService,
      playersService,
      playerTeamsService,
      new AnnotationMapper(),
    );

    await expect(
      service.create(9, { playerId: 4, minute: 12, type: 'goal' }),
    ).rejects.toMatchObject({
      code: ApplicationErrorCode.CONFLICT,
    });
    expect(playersService.findOne).not.toHaveBeenCalled();
    expect(playerTeamsService.belongsToTeam).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects annotations for final-round matches with pending team slots', async () => {
    const save = jest.fn();
    const matchesService = {
      findOne: jest.fn().mockResolvedValue({
        matchId: 9,
        state: 'ACTIVE',
        homeTeamId: null,
        awayTeamId: 21,
      }),
    } as unknown as MatchesService;
    const playersService = {
      findOne: jest.fn(),
    } as unknown as PlayersService;
    const playerTeamsService = {
      belongsToTeam: jest.fn(),
    } as unknown as PlayerTeamsService;
    const service = new AnnotationsService(
      { save } as unknown as Repository<Annotation>,
      {} as AnnotationsRepository,
      matchesService,
      playersService,
      playerTeamsService,
      new AnnotationMapper(),
    );

    await expect(
      service.create(9, { playerId: 4, minute: 12, type: 'goal' }),
    ).rejects.toMatchObject({
      code: ApplicationErrorCode.CONFLICT,
    });
    expect(playersService.findOne).not.toHaveBeenCalled();
    expect(playerTeamsService.belongsToTeam).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects players who are not currently assigned to either match team', async () => {
    const save = jest.fn();
    const matchesService = {
      findOne: jest.fn().mockResolvedValue({
        matchId: 9,
        state: 'ACTIVE',
        homeTeamId: 20,
        awayTeamId: 21,
      }),
    } as unknown as MatchesService;
    const playersService = {
      findOne: jest.fn().mockResolvedValue({ playerId: 4 }),
    } as unknown as PlayersService;
    const playerTeamsService = {
      belongsToTeam: jest.fn().mockResolvedValue(false),
    } as unknown as PlayerTeamsService;
    const service = new AnnotationsService(
      { save } as unknown as Repository<Annotation>,
      {} as AnnotationsRepository,
      matchesService,
      playersService,
      playerTeamsService,
      new AnnotationMapper(),
    );

    await expect(
      service.create(9, { playerId: 4, minute: 12, type: 'goal' }),
    ).rejects.toMatchObject({
      code: ApplicationErrorCode.INVALID_INPUT,
    });
    expect(playerTeamsService.belongsToTeam).toHaveBeenCalledTimes(2);
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects creating an annotation without required fields', async () => {
    const service = new AnnotationsService(
      {} as Repository<Annotation>,
      {} as AnnotationsRepository,
      {} as MatchesService,
      {} as PlayersService,
      {} as PlayerTeamsService,
      new AnnotationMapper(),
    );

    await expect(service.create(9, {})).rejects.toMatchObject({
      code: ApplicationErrorCode.INVALID_INPUT,
    });
  });

  it('does not allow modifying a voided annotation', async () => {
    const annotation = Object.assign(new Annotation(), {
      annotationId: 1,
      voided: true,
      player: { name: 'Luis', lastName: 'Díaz' },
    });
    const service = new AnnotationsService(
      { save: jest.fn() } as unknown as Repository<Annotation>,
      {
        findOneWithPlayer: jest.fn().mockResolvedValue(annotation),
      } as unknown as AnnotationsRepository,
      {} as MatchesService,
      {} as PlayersService,
      {} as PlayerTeamsService,
      new AnnotationMapper(),
    );

    await expect(service.update(1, { minute: 15 })).rejects.toMatchObject({
      code: ApplicationErrorCode.CONFLICT,
    });
  });

  it('voids an annotation without deleting it', async () => {
    const annotation = Object.assign(new Annotation(), {
      annotationId: 1,
      voided: false,
      player: { name: 'Luis', lastName: 'Díaz' },
    });
    const save = jest.fn().mockResolvedValue(annotation);
    const service = new AnnotationsService(
      { save } as unknown as Repository<Annotation>,
      {
        findOneWithPlayer: jest.fn().mockResolvedValue(annotation),
      } as unknown as AnnotationsRepository,
      {} as MatchesService,
      {} as PlayersService,
      {} as PlayerTeamsService,
      new AnnotationMapper(),
    );

    await expect(service.voidAnnotation(1)).resolves.toBeUndefined();
    expect(annotation.voided).toBe(true);
    expect(save).toHaveBeenCalledWith(annotation);
  });
});
