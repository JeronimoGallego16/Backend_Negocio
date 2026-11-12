import { Injectable } from '@nestjs/common';
import { SportDto } from '../dto/sport.dto';
import { SportResponseDto } from '../dto/sport-response.dto';
import { Sport } from '../entities/sport.entity';

/**
 * Maps sport request data to entities and entities to responses.
 */
@Injectable()
export class SportMapper {
  /**
   * Creates a sport entity from request data.
   *
   * @param dto - Sport data supplied by the caller.
   * @returns The populated sport entity.
   */
  toEntity(dto: SportDto): Sport {
    return Object.assign(new Sport(), dto);
  }

  /**
   * Applies supplied request fields to an existing sport.
   *
   * @param entity - Existing sport to update.
   * @param dto - Fields to merge into the sport.
   * @returns The updated sport entity.
   */
  mergeEntity(entity: Sport, dto: SportDto): Sport {
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.description !== undefined) entity.description = dto.description;
    return entity;
  }

  /**
   * Converts a sport entity to its response representation.
   *
   * @param entity - Sport to convert.
   * @returns The sport response DTO.
   */
  toResponseDto(entity: Sport): SportResponseDto {
    return {
      sportId: entity.sportId,
      name: entity.name,
      description: entity.description,
    };
  }

  /**
   * Converts a list of sport entities to response DTOs.
   *
   * @param entities - Sports to convert.
   * @returns The corresponding response DTOs.
   */
  toResponseDtoList(entities: Sport[]): SportResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
