import { Injectable } from '@nestjs/common';
import { SkillDto } from '../dto/skill.dto';
import { SkillResponseDto } from '../dto/skill-response.dto';
import { Skill } from '../entities/skill.entity';

@Injectable()
export class SkillMapper {
  toEntity(dto: SkillDto): Skill {
    return Object.assign(new Skill(), dto);
  }

  mergeEntity(entity: Skill, dto: SkillDto): Skill {
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.description !== undefined) entity.description = dto.description;
    return entity;
  }

  toResponseDto(entity: Skill): SkillResponseDto {
    return {
      skillId: entity.skillId,
      name: entity.name,
      description: entity.description,
    };
  }

  toResponseDtoList(entities: Skill[]): SkillResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
