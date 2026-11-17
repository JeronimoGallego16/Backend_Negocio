import { Injectable } from '@nestjs/common';
import { UpdateAnnotationDto } from '../dto/update-annotation.dto';
import { AnnotationDto } from '../dto/annotation.dto';
import { AnnotationResponseDto } from '../dto/annotation-response.dto';
import { Annotation } from '../entities/annotation.entity';

@Injectable()
export class AnnotationMapper {
  toEntity(matchId: number, dto: AnnotationDto): Annotation {
    return Object.assign(new Annotation(), dto, {
      matchId,
      voided: false,
    });
  }

  mergeEntity(entity: Annotation, dto: UpdateAnnotationDto): Annotation {
    if (dto.minute !== undefined) entity.minute = dto.minute;
    if (dto.type !== undefined) entity.type = dto.type;
    return entity;
  }

  toResponseDto(entity: Annotation): AnnotationResponseDto {
    return {
      annotationId: entity.annotationId,
      matchId: entity.matchId,
      playerId: entity.playerId,
      playerName: `${entity.player.name} ${entity.player.lastName}`,
      minute: entity.minute,
      type: entity.type,
      voided: entity.voided,
    };
  }

  toResponseDtoList(entities: Annotation[]): AnnotationResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
