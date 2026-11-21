import { Injectable } from '@nestjs/common';
import { Team } from '../../teams/entities/team.entity';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { RegistrationDto } from '../dto/registration.dto';
import { RegistrationResponseDto } from '../dto/registration-response.dto';
import { Registration } from '../entities/registration.entity';

/**
 * Maps registration request data to entities and entities to responses.
 */
@Injectable()
export class RegistrationMapper {
  /**
   * Creates a registration entity from request data and related identifiers.
   *
   * @param dto - Registration data supplied by the caller.
   * @returns The populated registration entity.
   */
  toEntity(dto: RegistrationDto): Registration {
    const entity = Object.assign(new Registration(), dto);
    entity.tournament = Object.assign(new Tournament(), {
      tournamentId: dto.tournamentId,
    });
    entity.team = Object.assign(new Team(), { teamId: dto.teamId });
    entity.registrationDate =
      dto.registrationDate ?? new Date().toISOString().slice(0, 10);
    return entity;
  }

  /**
   * Converts a registration entity to its response representation.
   *
   * @param entity - Registration to convert.
   * @returns The registration response DTO.
   */
  toResponseDto(entity: Registration): RegistrationResponseDto {
    return {
      registrationId: entity.registrationId,
      registrationDate: entity.registrationDate,
      tournamentId: entity.tournament.tournamentId,
      teamId: entity.team.teamId,
    };
  }

  /**
   * Converts registrations to response DTOs.
   *
   * @param entities - Registrations to convert.
   * @returns The corresponding response DTOs.
   */
  toResponseDtoList(entities: Registration[]): RegistrationResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
