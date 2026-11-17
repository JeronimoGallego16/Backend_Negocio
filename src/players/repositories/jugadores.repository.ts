import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Anotacion } from '../../matches/entities/anotacion.entity';
import { EquipoJugador } from '../entities/equipo-jugador.entity';
import { HabilidadJugador } from '../entities/habilidad-jugador.entity';
import { Jugador } from '../entities/jugador.entity';

@Injectable()
export class JugadoresRepository {
  constructor(
    @InjectRepository(Jugador)
    private readonly jugadorRepository: Repository<Jugador>,
  ) {}

  async existsByIdentificacion(
    identificacion: string,
    excludedIdJugador?: number,
  ): Promise<boolean> {
    const query = this.jugadorRepository
      .createQueryBuilder('jugador')
      .where('jugador.identificacion = :identificacion', { identificacion });

    if (excludedIdJugador !== undefined) {
      query.andWhere('jugador.idJugador != :excludedIdJugador', {
        excludedIdJugador,
      });
    }

    return (await query.getCount()) > 0;
  }

  async existsByCorreo(
    correo: string,
    excludedIdJugador?: number,
  ): Promise<boolean> {
    const query = this.jugadorRepository
      .createQueryBuilder('jugador')
      .where('jugador.correo = :correo', { correo });

    if (excludedIdJugador !== undefined) {
      query.andWhere('jugador.idJugador != :excludedIdJugador', {
        excludedIdJugador,
      });
    }

    return (await query.getCount()) > 0;
  }

  async hasAssociatedData(idJugador: number): Promise<boolean> {
    const manager = this.jugadorRepository.manager;
    const [skills, teams, annotations] = await Promise.all([
      manager.getRepository(HabilidadJugador).count({ where: { idJugador } }),
      manager.getRepository(EquipoJugador).count({ where: { idJugador } }),
      manager.getRepository(Anotacion).count({ where: { idJugador } }),
    ]);

    return skills + teams + annotations > 0;
  }
}
