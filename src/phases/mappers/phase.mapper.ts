import { Injectable } from '@nestjs/common';
import { FinalPhase } from '../entities/final.entity';
import { GroupPhase } from '../entities/group-phase.entity';
import { Phase } from '../entities/phase.entity';
import { PhaseDto } from '../dto/phase.dto';
import { PhaseResponseDto } from '../dto/phase-response.dto';

/**
 * Maps phase request data to entities and entities to responses.
 */
@Injectable()
export class PhaseMapper {
  /**
   * Creates a group or final phase entity.
   *
   * @param dto - Phase request data.
   * @returns The populated phase entity.
   */
  toEntity(dto: PhaseDto): GroupPhase | FinalPhase {
    if (dto.type === 'FINAL') {
      const entity = new FinalPhase();
      entity.name = dto.name!;
      entity.order = dto.order!;
      entity.isThirdPlace = dto.isThirdPlace ?? false;
      entity.tournamentId = dto.tournamentId!;
      return entity;
    }

    const entity = new GroupPhase();
    entity.name = dto.name!;
    entity.order = dto.order!;
    entity.tournamentId = dto.tournamentId!;
    return entity;
  }

  /**
   * Applies supplied updates to an existing phase.
   *
   * @param entity - Existing phase.
   * @param dto - Fields to merge.
   * @returns The updated phase.
   */
  mergeEntity(entity: Phase, dto: PhaseDto): Phase {
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.order !== undefined) entity.order = dto.order;
    if (entity instanceof FinalPhase && dto.isThirdPlace !== undefined) {
      entity.isThirdPlace = dto.isThirdPlace;
    }
    return entity;
  }

  /**
   * Converts a phase entity to a response DTO.
   *
   * @param entity - Phase to convert.
   * @returns The response DTO.
   */
  toResponseDto(entity: Phase): PhaseResponseDto {
    const response = new PhaseResponseDto();
    response.phaseId = entity.phaseId;
    response.name = entity.name;
    response.order = entity.order;
    response.tournamentId = entity.tournamentId;
    if (entity instanceof GroupPhase) {
      response.type = 'GROUP';
    } else {
      response.type = 'FINAL';
      response.isThirdPlace = (entity as FinalPhase).isThirdPlace;
    }
    return response;
  }

  /**
   * Converts a phase list to response DTOs.
   *
   * @param entities - Phases to convert.
   * @returns Phase response DTOs.
   */
  toResponseDtoList(entities: Phase[]): PhaseResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
