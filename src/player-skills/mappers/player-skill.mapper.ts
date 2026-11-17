import { Injectable } from '@nestjs/common';
import { UpdatePlayerSkillDto } from '../dto/update-player-skill.dto';
import { PlayerSkillDto } from '../dto/player-skill.dto';
import { PlayerSkillResponseDto } from '../dto/player-skill-response.dto';
import { PlayerSkill } from '../entities/player-skill.entity';

@Injectable()
export class PlayerSkillMapper {
  toEntity(playerId: number, dto: PlayerSkillDto): PlayerSkill {
    return Object.assign(new PlayerSkill(), dto, { playerId });
  }

  mergeEntity(entity: PlayerSkill, dto: UpdatePlayerSkillDto): PlayerSkill {
    if (dto.level !== undefined) entity.level = dto.level;
    if (dto.observations !== undefined) entity.observations = dto.observations;
    return entity;
  }

  toResponseDto(entity: PlayerSkill): PlayerSkillResponseDto {
    return {
      playerSkillId: entity.playerSkillId,
      playerId: entity.playerId,
      skillId: entity.skillId,
      level: entity.level,
      observations: entity.observations,
      playerName: `${entity.player.name} ${entity.player.lastName}`,
      skillName: entity.skill.name,
    };
  }

  toResponseDtoList(entities: PlayerSkill[]): PlayerSkillResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
