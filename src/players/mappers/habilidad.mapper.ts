import { Injectable } from '@nestjs/common';
import { HabilidadDto } from '../dto/habilidad.dto';
import { HabilidadResponseDto } from '../dto/habilidad-response.dto';
import { Habilidad } from '../entities/habilidad.entity';

@Injectable()
export class HabilidadMapper {
  toEntity(dto: HabilidadDto): Habilidad {
    return Object.assign(new Habilidad(), dto);
  }

  mergeEntity(entity: Habilidad, dto: HabilidadDto): Habilidad {
    if (dto.nombre !== undefined) entity.nombre = dto.nombre;
    if (dto.descripcion !== undefined) entity.descripcion = dto.descripcion;
    return entity;
  }

  toResponseDto(entity: Habilidad): HabilidadResponseDto {
    return {
      idHabilidad: entity.idHabilidad,
      nombre: entity.nombre,
      descripcion: entity.descripcion,
    };
  }

  toResponseDtoList(entities: Habilidad[]): HabilidadResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
