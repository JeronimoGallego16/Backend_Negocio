import { Injectable } from '@nestjs/common';
import { TeamDto } from '../dto/team.dto';
import { TeamResponseDto } from '../dto/team-response.dto';
import { Team } from '../entities/team.entity';

/**
 * Maps team request data to entities and entities to responses.
 */
@Injectable()
export class TeamMapper {
  /**
   * Creates a team entity from request data.
   *
   * @param dto - Team data supplied by the caller.
   * @returns The populated team entity.
   */
  toEntity(dto: TeamDto): Team {
    return Object.assign(new Team(), dto);
  }

  /**
   * Applies supplied request fields to an existing team.
   *
   * @param entity - Existing team to update.
   * @param dto - Fields to merge into the team.
   * @returns The updated team entity.
   */
  mergeEntity(entity: Team, dto: TeamDto): Team {
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.category !== undefined) entity.category = dto.category;
    return entity;
  }

  /**
   * Converts a team entity to its response representation.
   *
   * @param entity - Team to convert.
   * @returns The team response DTO.
   */
  toResponseDto(entity: Team): TeamResponseDto {
    return {
      teamId: entity.teamId,
      name: entity.name,
      category: entity.category,
    };
  }

  /**
   * Converts a list of team entities to response DTOs.
   *
   * @param entities - Teams to convert.
   * @returns The corresponding response DTOs.
   */
  toResponseDtoList(entities: Team[]): TeamResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
