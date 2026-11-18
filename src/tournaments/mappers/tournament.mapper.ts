import { Injectable } from '@nestjs/common';
import { Sport } from '../../sports/entities/sport.entity';
import { TournamentDto } from '../dto/tournament.dto';
import { TournamentResponseDto } from '../dto/tournament-response.dto';
import { Tournament } from '../entities/tournament.entity';

/**
 * Maps tournament request data to entities and entities to responses.
 */
@Injectable()
export class TournamentMapper {
  /**
   * Creates a tournament entity from request data.
   *
   * @param dto - Tournament data supplied by the caller.
   * @returns The populated tournament entity.
   */
  toEntity(dto: TournamentDto): Tournament {
    const entity = Object.assign(new Tournament(), dto);
    if (dto.sportId !== undefined) {
      entity.sport = Object.assign(new Sport(), { sportId: dto.sportId });
    }
    return entity;
  }

  /**
   * Applies supplied request fields to an existing tournament.
   *
   * @param entity - Existing tournament to update.
   * @param dto - Fields to merge into the tournament.
   * @returns The updated tournament entity.
   */
  mergeEntity(entity: Tournament, dto: TournamentDto): Tournament {
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.modality !== undefined) entity.modality = dto.modality;
    if (dto.startDate !== undefined) entity.startDate = dto.startDate;
    if (dto.endDate !== undefined) entity.endDate = dto.endDate;
    if (dto.status !== undefined) entity.status = dto.status;
    if (dto.capacity !== undefined) entity.capacity = dto.capacity;
    if (dto.sportId !== undefined) {
      entity.sport = Object.assign(new Sport(), { sportId: dto.sportId });
    }
    return entity;
  }

  /**
   * Converts a tournament entity to its response representation.
   *
   * @param entity - Tournament to convert.
   * @returns The tournament response DTO.
   */
  toResponseDto(entity: Tournament): TournamentResponseDto {
    return {
      tournamentId: entity.tournamentId,
      name: entity.name,
      modality: entity.modality,
      startDate: entity.startDate,
      endDate: entity.endDate,
      status: entity.status,
      capacity: entity.capacity,
      sportId: entity.sport.sportId,
    };
  }

  /**
   * Converts a list of tournaments to response DTOs.
   *
   * @param entities - Tournaments to convert.
   * @returns The corresponding response DTOs.
   */
  toResponseDtoList(entities: Tournament[]): TournamentResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
