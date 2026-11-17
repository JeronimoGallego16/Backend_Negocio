import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { SkillDto } from './dto/skill.dto';
import { SkillResponseDto } from './dto/skill-response.dto';
import { Skill } from './entities/skill.entity';
import { SkillMapper } from './mappers/skill.mapper';
import { SkillsRepository } from './repositories/skills.repository';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    private readonly skillsRepository: SkillsRepository,
    private readonly skillMapper: SkillMapper,
  ) {}

  async create(dto: SkillDto): Promise<SkillResponseDto> {
    if (!dto.name?.trim()) {
      throw ApplicationErrors.invalidInput('name is required for create');
    }

    if (await this.skillsRepository.existsByName(dto.name)) {
      throw ApplicationErrors.conflict('A skill with this name already exists');
    }

    const saved = await this.skillRepository.save(
      this.skillMapper.toEntity(dto),
    );
    return this.skillMapper.toResponseDto(saved);
  }

  async findAll(): Promise<SkillResponseDto[]> {
    const skills = await this.skillRepository.find();
    return this.skillMapper.toResponseDtoList(skills);
  }

  async findOne(id: number): Promise<SkillResponseDto> {
    return this.skillMapper.toResponseDto(await this.findEntity(id));
  }

  async update(id: number, dto: SkillDto): Promise<SkillResponseDto> {
    const skill = await this.findEntity(id);
    const merged = this.skillMapper.mergeEntity(skill, dto);

    if (await this.skillsRepository.existsByName(merged.name, id)) {
      throw ApplicationErrors.conflict('A skill with this name already exists');
    }

    const saved = await this.skillRepository.save(merged);
    return this.skillMapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<void> {
    const skill = await this.findEntity(id);

    if (await this.skillsRepository.hasAssignedPlayers(id)) {
      throw ApplicationErrors.conflict(
        'The skill is assigned to players and cannot be deleted',
      );
    }

    await this.skillRepository.remove(skill);
  }

  private async findEntity(id: number): Promise<Skill> {
    const skill = await this.skillRepository.findOne({
      where: { skillId: id },
    });
    if (!skill) {
      throw ApplicationErrors.notFound(`Skill with id ${id} not found`);
    }
    return skill;
  }
}
