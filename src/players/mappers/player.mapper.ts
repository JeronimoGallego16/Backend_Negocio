import { Injectable } from '@nestjs/common';
import { PlayerDto } from '../dto/player.dto';
import { PlayerResponseDto } from '../dto/player-response.dto';
import { Player } from '../entities/player.entity';

@Injectable()
export class PlayerMapper {
  toEntity(dto: PlayerDto): Player {
    return Object.assign(new Player(), dto, {
      active: dto.active ?? true,
    });
  }

  mergeEntity(entity: Player, dto: PlayerDto): Player {
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.lastName !== undefined) entity.lastName = dto.lastName;
    if (dto.birthDate !== undefined) entity.birthDate = dto.birthDate;
    if (dto.gender !== undefined) entity.gender = dto.gender;
    if (dto.email !== undefined) entity.email = dto.email;
    if (dto.identification !== undefined)
      entity.identification = dto.identification;
    if (dto.active !== undefined) entity.active = dto.active;
    return entity;
  }

  toResponseDto(entity: Player): PlayerResponseDto {
    return {
      playerId: entity.playerId,
      name: entity.name,
      lastName: entity.lastName,
      birthDate: entity.birthDate,
      gender: entity.gender,
      email: entity.email,
      identification: entity.identification,
      active: entity.active,
    };
  }

  toResponseDtoList(entities: Player[]): PlayerResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
