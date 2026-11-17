import { Injectable } from '@nestjs/common';
import { ActualizarAnotacionDto } from '../dto/actualizar-anotacion.dto';
import { AnotacionDto } from '../dto/anotacion.dto';
import { AnotacionResponseDto } from '../dto/anotacion-response.dto';
import { Anotacion } from '../entities/anotacion.entity';

@Injectable()
export class AnotacionMapper {
  toEntity(idPartido: number, dto: AnotacionDto): Anotacion {
    return Object.assign(new Anotacion(), dto, {
      idPartido,
      anulado: false,
    });
  }

  mergeEntity(entity: Anotacion, dto: ActualizarAnotacionDto): Anotacion {
    if (dto.minuto !== undefined) entity.minuto = dto.minuto;
    if (dto.tipo !== undefined) entity.tipo = dto.tipo;
    return entity;
  }

  toResponseDto(entity: Anotacion): AnotacionResponseDto {
    return {
      idAnotacion: entity.idAnotacion,
      idPartido: entity.idPartido,
      idJugador: entity.idJugador,
      nombreJugador: `${entity.jugador.nombre} ${entity.jugador.apellido}`,
      minuto: entity.minuto,
      tipo: entity.tipo,
      anulado: entity.anulado,
    };
  }

  toResponseDtoList(entities: Anotacion[]): AnotacionResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
