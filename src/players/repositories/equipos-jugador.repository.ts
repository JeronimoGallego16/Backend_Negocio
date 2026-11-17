import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { EquipoJugador } from '../entities/equipo-jugador.entity';

@Injectable()
export class EquiposJugadorRepository {
  constructor(
    @InjectRepository(EquipoJugador)
    private readonly equipoJugadorRepository: Repository<EquipoJugador>,
  ) {}

  findByJugador(idJugador: number): Promise<EquipoJugador[]> {
    return this.equipoJugadorRepository.find({
      where: { idJugador },
      relations: { jugador: true, equipo: true },
      order: { fechaInicio: 'DESC' },
    });
  }

  findByEquipo(idEquipo: number, onDate?: string): Promise<EquipoJugador[]> {
    const query = this.equipoJugadorRepository
      .createQueryBuilder('equipoJugador')
      .leftJoinAndSelect('equipoJugador.jugador', 'jugador')
      .leftJoinAndSelect('equipoJugador.equipo', 'equipo')
      .where('equipoJugador.idEquipo = :idEquipo', { idEquipo });

    if (onDate !== undefined) {
      query
        .andWhere('equipoJugador.fechaInicio <= :onDate', { onDate })
        .andWhere(
          '(equipoJugador.fechaFin IS NULL OR equipoJugador.fechaFin > :onDate)',
          { onDate },
        );
    }

    return query.orderBy('equipoJugador.fechaInicio', 'DESC').getMany();
  }

  findOverlapping(
    idJugador: number,
    fechaInicio: string,
    fechaFin: string | null,
  ): Promise<EquipoJugador[]> {
    const query = this.equipoJugadorRepository
      .createQueryBuilder('equipoJugador')
      .where('equipoJugador.idJugador = :idJugador', { idJugador })
      .andWhere(
        '(equipoJugador.fechaFin IS NULL OR equipoJugador.fechaFin > :fechaInicio)',
        { fechaInicio },
      );

    if (fechaFin !== null) {
      query.andWhere('equipoJugador.fechaInicio < :fechaFin', { fechaFin });
    }

    return query.getMany();
  }

  findOpenLink(
    idJugador: number,
    idEquipo: number,
  ): Promise<EquipoJugador | null> {
    return this.equipoJugadorRepository.findOne({
      where: { idJugador, idEquipo, fechaFin: IsNull() },
      relations: { jugador: true, equipo: true },
    });
  }

  async belongsToTeam(
    idJugador: number,
    idEquipo: number,
    onDate: string,
  ): Promise<boolean> {
    return (
      (await this.equipoJugadorRepository
        .createQueryBuilder('equipoJugador')
        .where('equipoJugador.idJugador = :idJugador', { idJugador })
        .andWhere('equipoJugador.idEquipo = :idEquipo', { idEquipo })
        .andWhere('equipoJugador.fechaInicio <= :onDate', { onDate })
        .andWhere(
          '(equipoJugador.fechaFin IS NULL OR equipoJugador.fechaFin > :onDate)',
          { onDate },
        )
        .getCount()) > 0
    );
  }

  async saveClosingPrevious(
    previous: EquipoJugador | null,
    next: EquipoJugador,
  ): Promise<EquipoJugador> {
    await this.equipoJugadorRepository.manager.transaction(async (manager) => {
      if (previous) await manager.save(previous);
      await manager.save(next);
    });

    const saved = await this.equipoJugadorRepository.findOne({
      where: { idHistorial: next.idHistorial },
      relations: { jugador: true, equipo: true },
    });

    if (!saved) {
      throw new Error('Saved player-team assignment could not be reloaded');
    }

    return saved;
  }
}
