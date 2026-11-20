import { Injectable } from '@nestjs/common';
import { CompetitionGroupDto } from '../dto/competition-group.dto';
import { CompetitionGroupResponseDto } from '../dto/competition-group-response.dto';
import { CompetitionGroup } from '../entities/competition-group.entity';

/**
 * Maps competition group requests and entities.
 */
@Injectable()
export class CompetitionGroupMapper {
  /**
   * Creates a competition group entity.
   *
   * @param dto - Group request data.
   * @param phaseId - Parent group phase identifier.
   * @returns The populated group entity.
   */
  toEntity(dto: CompetitionGroupDto, phaseId: number): CompetitionGroup {
    const entity = new CompetitionGroup();
    entity.phaseId = phaseId;
    entity.letterOrNumber = dto.letterOrNumber!;
    entity.maxTeams = dto.maxTeams!;
    return entity;
  }

  /**
   * Applies supplied updates to an existing group.
   *
   * @param entity - Existing group.
   * @param dto - Group fields to update.
   * @returns The updated group.
   */
  mergeEntity(
    entity: CompetitionGroup,
    dto: CompetitionGroupDto,
  ): CompetitionGroup {
    if (dto.letterOrNumber !== undefined) {
      entity.letterOrNumber = dto.letterOrNumber;
    }
    if (dto.maxTeams !== undefined) {
      entity.maxTeams = dto.maxTeams;
    }
    return entity;
  }

  /**
   * Converts a group entity into a response DTO.
   *
   * @param entity - Group to convert.
   * @returns The group response.
   */
  toResponseDto(entity: CompetitionGroup): CompetitionGroupResponseDto {
    const response = new CompetitionGroupResponseDto();
    response.groupId = entity.groupId;
    response.phaseId = entity.phaseId;
    response.letterOrNumber = entity.letterOrNumber;
    response.maxTeams = entity.maxTeams;
    return response;
  }

  /**
   * Converts a group list into response DTOs.
   *
   * @param entities - Groups to convert.
   * @returns The group responses.
   */
  toResponseDtoList(
    entities: CompetitionGroup[],
  ): CompetitionGroupResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
