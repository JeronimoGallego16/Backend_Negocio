import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Anotacion } from '../entities/anotacion.entity';

@Injectable()
export class AnotacionesRepository {
  constructor(
    @InjectRepository(Anotacion)
    private readonly anotacionRepository: Repository<Anotacion>,
  ) {}

  findByPartido(idPartido: number): Promise<Anotacion[]> {
    return this.anotacionRepository.find({
      where: { idPartido },
      relations: { jugador: true },
      order: { minuto: 'ASC' },
    });
  }

  findOneWithJugador(idAnotacion: number): Promise<Anotacion | null> {
    return this.anotacionRepository.findOne({
      where: { idAnotacion },
      relations: { jugador: true },
    });
  }
}
