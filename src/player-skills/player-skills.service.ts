import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { UpdatePlayerSkillDto } from './dto/update-player-skill.dto';
import { PlayerSkillDto } from './dto/player-skill.dto';
import { PlayerSkillResponseDto } from './dto/player-skill-response.dto';
import { PlayerSkill } from './entities/player-skill.entity';
import { PlayerSkillMapper } from './mappers/player-skill.mapper';
import { PlayerSkillsRepository } from './repositories/player-skills.repository';
import { SkillsService } from '../skills/skills.service';
import { PlayersService } from '../players/players.service';

@Injectable()
export class PlayerSkillsService {
  constructor(
    @InjectRepository(PlayerSkill)
    private readonly playerSkillRepository: Repository<PlayerSkill>,
    private readonly playerSkillsRepository: PlayerSkillsRepository,
    private readonly playersService: PlayersService,
    private readonly skillsService: SkillsService,
    private readonly playerSkillMapper: PlayerSkillMapper,
  ) {}

  async assign(
    playerId: number,
    dto: PlayerSkillDto,
  ): Promise<PlayerSkillResponseDto> {
    if (dto.skillId === undefined || dto.level === undefined) {
      throw ApplicationErrors.invalidInput(
        'skillId and level are required for assignment',
      );
    }

    await this.playersService.findOne(playerId);
    await this.skillsService.findOne(dto.skillId);

    if (await this.playerSkillsRepository.existsByPair(playerId, dto.skillId)) {
      throw ApplicationErrors.conflict('The player already has this skill');
    }

    await this.playerSkillRepository.save(
      this.playerSkillMapper.toEntity(playerId, dto),
    );
    const saved = await this.playerSkillsRepository.findOneByPair(
      playerId,
      dto.skillId,
    );
    if (!saved) {
      throw new Error('Assigned player skill could not be reloaded');
    }
    return this.playerSkillMapper.toResponseDto(saved);
  }

  async findByPlayer(playerId: number): Promise<PlayerSkillResponseDto[]> {
    await this.playersService.findOne(playerId);
    const assignments =
      await this.playerSkillsRepository.findByPlayer(playerId);
    return this.playerSkillMapper.toResponseDtoList(assignments);
  }

  async findBySkill(skillId: number): Promise<PlayerSkillResponseDto[]> {
    await this.skillsService.findOne(skillId);
    const assignments = await this.playerSkillsRepository.findBySkill(skillId);
    return this.playerSkillMapper.toResponseDtoList(assignments);
  }

  async update(
    playerId: number,
    skillId: number,
    dto: UpdatePlayerSkillDto,
  ): Promise<PlayerSkillResponseDto> {
    const assignment = await this.playerSkillsRepository.findOneByPair(
      playerId,
      skillId,
    );
    if (!assignment) {
      throw ApplicationErrors.notFound('The player does not have this skill');
    }

    await this.playerSkillRepository.save(
      this.playerSkillMapper.mergeEntity(assignment, dto),
    );
    const reloaded = await this.playerSkillsRepository.findOneByPair(
      playerId,
      skillId,
    );
    if (!reloaded) {
      throw new Error('Updated player skill could not be reloaded');
    }
    return this.playerSkillMapper.toResponseDto(reloaded);
  }

  async remove(playerId: number, skillId: number): Promise<void> {
    const assignment = await this.playerSkillsRepository.findOneByPair(
      playerId,
      skillId,
    );
    if (!assignment) {
      throw ApplicationErrors.notFound('The player does not have this skill');
    }

    await this.playerSkillRepository.remove(assignment);
  }
}
