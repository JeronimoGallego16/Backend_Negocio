import { Injectable } from '@nestjs/common';
import { AsignarJugadorEquipoDto } from '../dto/asignar-jugador-equipo.dto';
import { EquipoJugadorResponseDto } from '../dto/equipo-jugador-response.dto';
import { EquipoJugador } from '../entities/equipo-jugador.entity';

@Injectable()
export class EquipoJugadorMapper {
  toEntity(idEquipo: number, dto: AsignarJugadorEquipoDto): EquipoJugador {
    return Object.assign(new EquipoJugador(), {
      idEquipo,
      idJugador: dto.idJugador,
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin ?? null,
    });
  }

  toResponseDto(entity: EquipoJugador): EquipoJugadorResponseDto {
    return {
      idHistorial: entity.idHistorial,
      idJugador: entity.idJugador,
      idEquipo: entity.idEquipo,
      fechaInicio: entity.fechaInicio,
      fechaFin: entity.fechaFin,
      nombreJugador: `${entity.jugador.nombre} ${entity.jugador.apellido}`,
      nombreEquipo: entity.equipo.name,
    };
  }

  toResponseDtoList(entities: EquipoJugador[]): EquipoJugadorResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
