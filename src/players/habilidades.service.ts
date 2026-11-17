import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { HabilidadDto } from './dto/habilidad.dto';
import { HabilidadResponseDto } from './dto/habilidad-response.dto';
import { Habilidad } from './entities/habilidad.entity';
import { HabilidadMapper } from './mappers/habilidad.mapper';
import { HabilidadesRepository } from './repositories/habilidades.repository';

@Injectable()
export class HabilidadesService {
  constructor(
    @InjectRepository(Habilidad)
    private readonly habilidadRepository: Repository<Habilidad>,
    private readonly habilidadesRepository: HabilidadesRepository,
    private readonly habilidadMapper: HabilidadMapper,
  ) {}

  async create(dto: HabilidadDto): Promise<HabilidadResponseDto> {
    if (!dto.nombre?.trim()) {
      throw ApplicationErrors.invalidInput('nombre is required for create');
    }

    if (await this.habilidadesRepository.existsByNombre(dto.nombre)) {
      throw ApplicationErrors.conflict('A skill with this name already exists');
    }

    const saved = await this.habilidadRepository.save(
      this.habilidadMapper.toEntity(dto),
    );
    return this.habilidadMapper.toResponseDto(saved);
  }

  async findAll(): Promise<HabilidadResponseDto[]> {
    const habilidades = await this.habilidadRepository.find();
    return this.habilidadMapper.toResponseDtoList(habilidades);
  }

  async findOne(id: number): Promise<HabilidadResponseDto> {
    return this.habilidadMapper.toResponseDto(await this.findEntity(id));
  }

  async update(id: number, dto: HabilidadDto): Promise<HabilidadResponseDto> {
    const habilidad = await this.findEntity(id);
    const merged = this.habilidadMapper.mergeEntity(habilidad, dto);

    if (await this.habilidadesRepository.existsByNombre(merged.nombre, id)) {
      throw ApplicationErrors.conflict('A skill with this name already exists');
    }

    const saved = await this.habilidadRepository.save(merged);
    return this.habilidadMapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<void> {
    const habilidad = await this.findEntity(id);

    if (await this.habilidadesRepository.hasAssignedPlayers(id)) {
      throw ApplicationErrors.conflict(
        'The skill is assigned to players and cannot be deleted',
      );
    }

    await this.habilidadRepository.remove(habilidad);
  }

  private async findEntity(id: number): Promise<Habilidad> {
    const habilidad = await this.habilidadRepository.findOne({
      where: { idHabilidad: id },
    });
    if (!habilidad) {
      throw ApplicationErrors.notFound(`Skill with id ${id} not found`);
    }
    return habilidad;
  }
}
