import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HabilidadJugador } from '../entities/habilidad-jugador.entity';
import { Habilidad } from '../entities/habilidad.entity';

@Injectable()
export class HabilidadesRepository {
  constructor(
    @InjectRepository(Habilidad)
    private readonly habilidadRepository: Repository<Habilidad>,
  ) {}

  async existsByNombre(
    nombre: string,
    excludedIdHabilidad?: number,
  ): Promise<boolean> {
    const query = this.habilidadRepository
      .createQueryBuilder('habilidad')
      .where('habilidad.nombre = :nombre', { nombre });

    if (excludedIdHabilidad !== undefined) {
      query.andWhere('habilidad.idHabilidad != :excludedIdHabilidad', {
        excludedIdHabilidad,
      });
    }

    return (await query.getCount()) > 0;
  }

  async hasAssignedPlayers(idHabilidad: number): Promise<boolean> {
    const count = await this.habilidadRepository.manager
      .getRepository(HabilidadJugador)
      .count({ where: { idHabilidad } });
    return count > 0;
  }
}
