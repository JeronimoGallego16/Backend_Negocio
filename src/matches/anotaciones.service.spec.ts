import { jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { ApplicationErrorCode } from '../common/errors/application-error';
import { JugadoresService } from '../players/jugadores.service';
import { Anotacion } from './entities/anotacion.entity';
import { AnotacionMapper } from './mappers/anotacion.mapper';
import { AnotacionesRepository } from './repositories/anotaciones.repository';
import { AnotacionesService } from './anotaciones.service';
import { MatchesService } from './matches.service';

describe('AnotacionesService', () => {
  it('checks the match and player before creating an annotation', async () => {
    const saved = Object.assign(new Anotacion(), {
      idAnotacion: 1,
      idPartido: 9,
      idJugador: 4,
      minuto: 12,
      tipo: 'gol',
      anulado: false,
    });
    const loaded = Object.assign(saved, {
      jugador: { nombre: 'Luis', apellido: 'Díaz' },
    });
    const repository = {
      save: jest.fn().mockResolvedValue(saved),
    } as unknown as Repository<Anotacion>;
    const annotationsRepository = {
      findOneWithJugador: jest.fn().mockResolvedValue(loaded),
      findByPartido: jest.fn(),
    } as unknown as AnotacionesRepository;
    const matchesService = {
      findOne: jest.fn().mockResolvedValue({ matchId: 9 }),
    } as unknown as MatchesService;
    const playersService = {
      findOne: jest.fn().mockResolvedValue({ idJugador: 4 }),
    } as unknown as JugadoresService;
    const service = new AnotacionesService(
      repository,
      annotationsRepository,
      matchesService,
      playersService,
      new AnotacionMapper(),
    );

    await expect(
      service.create(9, { idJugador: 4, minuto: 12, tipo: 'gol' }),
    ).resolves.toMatchObject({
      idPartido: 9,
      idJugador: 4,
      nombreJugador: 'Luis Díaz',
      anulado: false,
    });
    expect(matchesService.findOne).toHaveBeenCalledWith(9);
    expect(playersService.findOne).toHaveBeenCalledWith(4);
  });

  it('rejects creating an annotation without required fields', async () => {
    const service = new AnotacionesService(
      {} as Repository<Anotacion>,
      {} as AnotacionesRepository,
      {} as MatchesService,
      {} as JugadoresService,
      new AnotacionMapper(),
    );

    await expect(service.create(9, {})).rejects.toMatchObject({
      code: ApplicationErrorCode.INVALID_INPUT,
    });
  });

  it('does not allow modifying a voided annotation', async () => {
    const annotation = Object.assign(new Anotacion(), {
      idAnotacion: 1,
      anulado: true,
      jugador: { nombre: 'Luis', apellido: 'Díaz' },
    });
    const service = new AnotacionesService(
      { save: jest.fn() } as unknown as Repository<Anotacion>,
      {
        findOneWithJugador: jest.fn().mockResolvedValue(annotation),
      } as unknown as AnotacionesRepository,
      {} as MatchesService,
      {} as JugadoresService,
      new AnotacionMapper(),
    );

    await expect(service.update(1, { minuto: 15 })).rejects.toMatchObject({
      code: ApplicationErrorCode.CONFLICT,
    });
  });

  it('voids an annotation without deleting it', async () => {
    const annotation = Object.assign(new Anotacion(), {
      idAnotacion: 1,
      anulado: false,
      jugador: { nombre: 'Luis', apellido: 'Díaz' },
    });
    const save = jest.fn().mockResolvedValue(annotation);
    const service = new AnotacionesService(
      { save } as unknown as Repository<Anotacion>,
      {
        findOneWithJugador: jest.fn().mockResolvedValue(annotation),
      } as unknown as AnotacionesRepository,
      {} as MatchesService,
      {} as JugadoresService,
      new AnotacionMapper(),
    );

    await expect(service.void(1)).resolves.toBeUndefined();
    expect(annotation.anulado).toBe(true);
    expect(save).toHaveBeenCalledWith(annotation);
  });
});
