import { Injectable } from '@nestjs/common';
import { TeamSportResponseDto } from '../dto/team-sport-response.dto';
import { UpdateTeamSportDto } from '../dto/update-team-sport.dto';
import { TeamSport } from '../entities/team-sport.entity';

/**
 * Maps team-sport assignment data between DTOs and entities.
 */
@Injectable()
export class TeamSportMapper {
  /**
   * Creates an assignment entity using validated related entities.
   *
   * @param team - Existing team to assign the sport to.
   * @param sport - Existing sport to assign to the team.
   * @returns The populated assignment entity.
   */
  toEntity(team: TeamSport['team'], sport: TeamSport['sport']): TeamSport {
    return Object.assign(new TeamSport(), {
      team,
      sport,
    });
  }

  /**
   * Applies validated related entities to an existing assignment.
   *
   * @param entity - Existing assignment to update.
   * @param dto - Optional new related entity identifiers.
   * @param team - Existing replacement team, when supplied.
   * @param sport - Existing replacement sport, when supplied.
   * @returns The updated assignment entity.
   */
  mergeEntity(
    entity: TeamSport,
    dto: UpdateTeamSportDto,
    team?: TeamSport['team'],
    sport?: TeamSport['sport'],
  ): TeamSport {
    if (dto.teamId !== undefined && team !== undefined) entity.team = team;
    if (dto.sportId !== undefined && sport !== undefined) entity.sport = sport;
    return entity;
  }

  /**
   * Converts an assignment entity to its response representation.
   *
   * @param entity - Assignment to convert.
   * @returns The assignment response DTO.
   */
  toResponseDto(entity: TeamSport): TeamSportResponseDto {
    return {
      teamSportId: entity.teamSportId,
      teamId: entity.team.teamId,
      sportId: entity.sport.sportId,
    };
  }

  /**
   * Converts assignment entities to response DTOs.
   *
   * @param entities - Assignments to convert.
   * @returns The corresponding response DTOs.
   */
  toResponseDtoList(entities: TeamSport[]): TeamSportResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
