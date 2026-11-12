import { Injectable } from '@nestjs/common';
import { MatchDto } from '../dto/match.dto';
import { MatchResponseDto } from '../dto/match-response.dto';
import { Match } from '../entities/match.entity';

/**
 * Maps match request data to entities and entities to responses.
 */
@Injectable()
export class MatchMapper {
  /**
   * Creates a match entity from request data.
   *
   * @param dto - Match data supplied by the caller.
   * @returns The populated match entity.
   */
  toEntity(dto: MatchDto): Match {
    return Object.assign(new Match(), dto);
  }

  /**
   * Applies supplied request fields to an existing match.
   *
   * @param entity - Existing match to update.
   * @param dto - Fields to merge into the match.
   * @returns The updated match entity.
   */
  mergeEntity(entity: Match, dto: MatchDto): Match {
    if (dto.duration !== undefined) entity.duration = dto.duration;
    if (dto.state !== undefined) entity.state = dto.state;
    return entity;
  }

  /**
   * Converts a match entity to its response representation.
   *
   * @param entity - Match to convert.
   * @returns The match response DTO.
   */
  toResponseDto(entity: Match): MatchResponseDto {
    return {
      matchId: entity.matchId,
      duration: entity.duration,
      state: entity.state,
    };
  }

  /**
   * Converts a list of match entities to response DTOs.
   *
   * @param entities - Matches to convert.
   * @returns The corresponding response DTOs.
   */
  toResponseDtoList(entities: Match[]): MatchResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
