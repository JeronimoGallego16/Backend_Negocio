import { Injectable } from '@nestjs/common';
import { JugadorDto } from '../dto/jugador.dto';
import { JugadorResponseDto } from '../dto/jugador-response.dto';
import { Jugador } from '../entities/jugador.entity';

@Injectable()
export class JugadorMapper {
  toEntity(dto: JugadorDto): Jugador {
    return Object.assign(new Jugador(), dto, {
      activo: dto.activo ?? true,
    });
  }

  mergeEntity(entity: Jugador, dto: JugadorDto): Jugador {
    if (dto.nombre !== undefined) entity.nombre = dto.nombre;
    if (dto.apellido !== undefined) entity.apellido = dto.apellido;
    if (dto.fechaNacimiento !== undefined)
      entity.fechaNacimiento = dto.fechaNacimiento;
    if (dto.genero !== undefined) entity.genero = dto.genero;
    if (dto.correo !== undefined) entity.correo = dto.correo;
    if (dto.identificacion !== undefined)
      entity.identificacion = dto.identificacion;
    if (dto.activo !== undefined) entity.activo = dto.activo;
    return entity;
  }

  toResponseDto(entity: Jugador): JugadorResponseDto {
    return {
      idJugador: entity.idJugador,
      nombre: entity.nombre,
      apellido: entity.apellido,
      fechaNacimiento: entity.fechaNacimiento,
      genero: entity.genero,
      correo: entity.correo,
      identificacion: entity.identificacion,
      activo: entity.activo,
    };
  }

  toResponseDtoList(entities: Jugador[]): JugadorResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
