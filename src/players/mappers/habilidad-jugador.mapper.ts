import { Injectable } from '@nestjs/common';
import { ActualizarHabilidadJugadorDto } from '../dto/actualizar-habilidad-jugador.dto';
import { HabilidadJugadorDto } from '../dto/habilidad-jugador.dto';
import { HabilidadJugadorResponseDto } from '../dto/habilidad-jugador-response.dto';
import { HabilidadJugador } from '../entities/habilidad-jugador.entity';

@Injectable()
export class HabilidadJugadorMapper {
  toEntity(idJugador: number, dto: HabilidadJugadorDto): HabilidadJugador {
    return Object.assign(new HabilidadJugador(), dto, { idJugador });
  }

  mergeEntity(
    entity: HabilidadJugador,
    dto: ActualizarHabilidadJugadorDto,
  ): HabilidadJugador {
    if (dto.nivel !== undefined) entity.nivel = dto.nivel;
    if (dto.observaciones !== undefined)
      entity.observaciones = dto.observaciones;
    return entity;
  }

  toResponseDto(entity: HabilidadJugador): HabilidadJugadorResponseDto {
    return {
      idHabilidadJugador: entity.idHabilidadJugador,
      idJugador: entity.idJugador,
      idHabilidad: entity.idHabilidad,
      nivel: entity.nivel,
      observaciones: entity.observaciones,
      nombreJugador: `${entity.jugador.nombre} ${entity.jugador.apellido}`,
      nombreHabilidad: entity.habilidad.nombre,
    };
  }

  toResponseDtoList(
    entities: HabilidadJugador[],
  ): HabilidadJugadorResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
