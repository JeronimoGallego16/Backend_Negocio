import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HabilidadJugador } from '../entities/habilidad-jugador.entity';

@Injectable()
export class HabilidadesJugadorRepository {
  constructor(
    @InjectRepository(HabilidadJugador)
    private readonly habilidadJugadorRepository: Repository<HabilidadJugador>,
  ) {}

  findByJugador(idJugador: number): Promise<HabilidadJugador[]> {
    return this.habilidadJugadorRepository.find({
      where: { idJugador },
      relations: { jugador: true, habilidad: true },
    });
  }

  findByHabilidad(idHabilidad: number): Promise<HabilidadJugador[]> {
    return this.habilidadJugadorRepository.find({
      where: { idHabilidad },
      relations: { jugador: true, habilidad: true },
    });
  }

  findOneByPair(
    idJugador: number,
    idHabilidad: number,
  ): Promise<HabilidadJugador | null> {
    return this.habilidadJugadorRepository.findOne({
      where: { idJugador, idHabilidad },
      relations: { jugador: true, habilidad: true },
    });
  }

  async existsByPair(idJugador: number, idHabilidad: number): Promise<boolean> {
    return (
      (await this.habilidadJugadorRepository.count({
        where: { idJugador, idHabilidad },
      })) > 0
    );
  }
}
