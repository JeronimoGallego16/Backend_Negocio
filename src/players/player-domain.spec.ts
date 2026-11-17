import { jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { ApplicationErrorCode } from '../common/errors/application-error';
import { HabilidadJugador } from './entities/habilidad-jugador.entity';
import { Habilidad } from './entities/habilidad.entity';
import { EquipoJugador } from './entities/equipo-jugador.entity';
import { Genero, Jugador } from './entities/jugador.entity';
import { EquipoJugadorMapper } from './mappers/equipo-jugador.mapper';
import { HabilidadJugadorMapper } from './mappers/habilidad-jugador.mapper';
import { HabilidadMapper } from './mappers/habilidad.mapper';
import { JugadorMapper } from './mappers/jugador.mapper';
import { EquiposJugadorRepository } from './repositories/equipos-jugador.repository';
import { HabilidadesJugadorRepository } from './repositories/habilidades-jugador.repository';
import { HabilidadesRepository } from './repositories/habilidades.repository';
import { JugadoresRepository } from './repositories/jugadores.repository';
import { EquiposJugadorService } from './equipos-jugador.service';
import { HabilidadesJugadorService } from './habilidades-jugador.service';
import { HabilidadesService } from './habilidades.service';
import { JugadoresService } from './jugadores.service';
import { TeamsService } from '../teams/teams.service';

describe('player domain services', () => {
  it('creates a skill and rejects a duplicate name', async () => {
    const skill = Object.assign(new Habilidad(), {
      idHabilidad: 1,
      nombre: 'Velocidad',
      descripcion: null,
    });
    const entityRepository = {
      save: jest.fn().mockResolvedValue(skill),
      findOne: jest.fn(),
      remove: jest.fn(),
    } as unknown as Repository<Habilidad>;
    const skillsRepository = {
      existsByNombre: jest
        .fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true),
      hasAssignedPlayers: jest.fn(),
    } as unknown as HabilidadesRepository;
    const service = new HabilidadesService(
      entityRepository,
      skillsRepository,
      new HabilidadMapper(),
    );

    await expect(service.create({ nombre: 'Velocidad' })).resolves.toEqual({
      idHabilidad: 1,
      nombre: 'Velocidad',
      descripcion: null,
    });
    await expect(service.create({ nombre: 'Velocidad' })).rejects.toMatchObject(
      {
        code: ApplicationErrorCode.CONFLICT,
      },
    );
    await expect(service.create({})).rejects.toMatchObject({
      code: ApplicationErrorCode.INVALID_INPUT,
    });
  });

  it('creates a player as active and rejects duplicate email', async () => {
    const player = Object.assign(new Jugador(), {
      idJugador: 7,
      nombre: 'Ana',
      apellido: 'Pérez',
      fechaNacimiento: '2000-01-01',
      genero: Genero.FEMENINO,
      correo: 'ana@example.com',
      identificacion: 'ID-7',
      activo: true,
    });
    const entityRepository = {
      save: jest
        .fn()
        .mockImplementation(async (entity: Jugador) =>
          Object.assign(entity, { idJugador: 7 }),
        ),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    } as unknown as Repository<Jugador>;
    const playersRepository = {
      existsByIdentificacion: jest.fn().mockResolvedValue(false),
      existsByCorreo: jest
        .fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true),
      hasAssociatedData: jest.fn(),
    } as unknown as JugadoresRepository;
    const service = new JugadoresService(
      entityRepository,
      playersRepository,
      new JugadorMapper(),
    );

    await expect(
      service.create({
        nombre: 'Ana',
        apellido: 'Pérez',
        fechaNacimiento: '2000-01-01',
        genero: Genero.FEMENINO,
        correo: 'ana@example.com',
        identificacion: 'ID-7',
      }),
    ).resolves.toMatchObject({
      idJugador: 7,
      activo: true,
      correo: player.correo,
    });

    await expect(
      service.create({
        nombre: 'Ana',
        apellido: 'Pérez',
        fechaNacimiento: '2000-01-01',
        genero: Genero.FEMENINO,
        correo: 'ana@example.com',
        identificacion: 'ID-8',
      }),
    ).rejects.toMatchObject({ code: ApplicationErrorCode.CONFLICT });
  });

  it('assigns a skill once and rejects the same player-skill pair', async () => {
    const assignment = Object.assign(new HabilidadJugador(), {
      idHabilidadJugador: 3,
      idJugador: 1,
      idHabilidad: 2,
      nivel: 4,
      observaciones: null,
      jugador: { nombre: 'Ana', apellido: 'Pérez' },
      habilidad: { nombre: 'Velocidad' },
    });
    const entityRepository = {
      save: jest.fn().mockResolvedValue(assignment),
      remove: jest.fn(),
    } as unknown as Repository<HabilidadJugador>;
    const assignmentRepository = {
      existsByPair: jest
        .fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true),
      findOneByPair: jest.fn().mockResolvedValue(assignment),
      findByJugador: jest.fn(),
      findByHabilidad: jest.fn(),
    } as unknown as HabilidadesJugadorRepository;
    const playersService = {
      findOne: jest.fn().mockResolvedValue({ idJugador: 1 }),
    } as unknown as JugadoresService;
    const skillsService = {
      findOne: jest.fn().mockResolvedValue({ idHabilidad: 2 }),
    } as unknown as HabilidadesService;
    const service = new HabilidadesJugadorService(
      entityRepository,
      assignmentRepository,
      playersService,
      skillsService,
      new HabilidadJugadorMapper(),
    );

    await expect(
      service.assign(1, { idHabilidad: 2, nivel: 4 }),
    ).resolves.toMatchObject({
      idJugador: 1,
      idHabilidad: 2,
      nombreJugador: 'Ana Pérez',
      nombreHabilidad: 'Velocidad',
    });
    await expect(
      service.assign(1, { idHabilidad: 2, nivel: 4 }),
    ).rejects.toMatchObject({ code: ApplicationErrorCode.CONFLICT });
  });

  it('closes the previous open team assignment when transferring', async () => {
    const previous = Object.assign(new EquipoJugador(), {
      idHistorial: 5,
      idJugador: 1,
      idEquipo: 10,
      fechaInicio: '2020-01-01',
      fechaFin: null,
    });
    const saved = Object.assign(new EquipoJugador(), {
      idHistorial: 6,
      idJugador: 1,
      idEquipo: 11,
      fechaInicio: '2024-01-01',
      fechaFin: null,
      jugador: { nombre: 'Ana', apellido: 'Pérez' },
      equipo: { name: 'Equipo B' },
    });
    const entityRepository = {
      save: jest.fn().mockResolvedValue(saved),
    } as unknown as Repository<EquipoJugador>;
    const assignmentsRepository = {
      findOverlapping: jest.fn().mockResolvedValue([previous]),
      saveClosingPrevious: jest.fn().mockResolvedValue(saved),
      findByEquipo: jest.fn(),
      findByJugador: jest.fn(),
      belongsToTeam: jest.fn(),
    } as unknown as EquiposJugadorRepository;
    const playersService = {
      findOne: jest.fn().mockResolvedValue({ idJugador: 1 }),
    } as unknown as JugadoresService;
    const teamsService = {
      findOne: jest.fn().mockResolvedValue({ teamId: 11 }),
    } as unknown as TeamsService;
    const service = new EquiposJugadorService(
      entityRepository,
      assignmentsRepository,
      playersService,
      teamsService,
      new EquipoJugadorMapper(),
    );

    await expect(
      service.assign(11, {
        idJugador: 1,
        fechaInicio: '2024-01-01',
      }),
    ).resolves.toMatchObject({
      idEquipo: 11,
      fechaInicio: '2024-01-01',
      nombreEquipo: 'Equipo B',
    });
    expect(previous.fechaFin).toBe('2024-01-01');
    expect(assignmentsRepository.saveClosingPrevious).toHaveBeenCalledWith(
      previous,
      expect.objectContaining({ idEquipo: 11 }),
    );
  });

  it('rejects overlapping team periods that cannot be transferred', async () => {
    const previous = Object.assign(new EquipoJugador(), {
      idHistorial: 5,
      idJugador: 1,
      idEquipo: 10,
      fechaInicio: '2020-01-01',
      fechaFin: '2025-01-01',
    });
    const service = new EquiposJugadorService(
      {} as Repository<EquipoJugador>,
      {
        findOverlapping: jest.fn().mockResolvedValue([previous]),
      } as unknown as EquiposJugadorRepository,
      {
        findOne: jest.fn().mockResolvedValue({}),
      } as unknown as JugadoresService,
      { findOne: jest.fn().mockResolvedValue({}) } as unknown as TeamsService,
      new EquipoJugadorMapper(),
    );

    await expect(
      service.assign(11, {
        idJugador: 1,
        fechaInicio: '2024-01-01',
        fechaFin: '2026-01-01',
      }),
    ).rejects.toMatchObject({ code: ApplicationErrorCode.CONFLICT });
  });
});
