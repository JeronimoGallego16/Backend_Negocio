import { Injectable } from '@nestjs/common';
import { AssignPlayerTeamDto } from '../dto/assign-player-team.dto';
import { PlayerTeamResponseDto } from '../dto/player-team-response.dto';
import { PlayerTeam } from '../entities/player-team.entity';

@Injectable()
export class PlayerTeamMapper {
  toEntity(teamId: number, dto: AssignPlayerTeamDto): PlayerTeam {
    return Object.assign(new PlayerTeam(), {
      teamId,
      playerId: dto.playerId,
      startDate: dto.startDate,
      endDate: dto.endDate ?? null,
    });
  }

  toResponseDto(entity: PlayerTeam): PlayerTeamResponseDto {
    return {
      playerTeamId: entity.playerTeamId,
      playerId: entity.playerId,
      teamId: entity.teamId,
      startDate: entity.startDate,
      endDate: entity.endDate,
      playerName: `${entity.player.name} ${entity.player.lastName}`,
      teamName: entity.team.name,
    };
  }

  toResponseDtoList(entities: PlayerTeam[]): PlayerTeamResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
