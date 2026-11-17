import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { ActualizarHabilidadJugadorDto } from './dto/actualizar-habilidad-jugador.dto';
import { HabilidadJugadorDto } from './dto/habilidad-jugador.dto';
import { HabilidadJugadorResponseDto } from './dto/habilidad-jugador-response.dto';
import { HabilidadJugador } from './entities/habilidad-jugador.entity';
import { HabilidadJugadorMapper } from './mappers/habilidad-jugador.mapper';
import { HabilidadesJugadorRepository } from './repositories/habilidades-jugador.repository';
import { HabilidadesService } from './habilidades.service';
import { JugadoresService } from './jugadores.service';

@Injectable()
export class HabilidadesJugadorService {
  constructor(
    @InjectRepository(HabilidadJugador)
    private readonly habilidadJugadorRepository: Repository<HabilidadJugador>,
    private readonly habilidadesJugadorRepository: HabilidadesJugadorRepository,
    private readonly jugadoresService: JugadoresService,
    private readonly habilidadesService: HabilidadesService,
    private readonly habilidadJugadorMapper: HabilidadJugadorMapper,
  ) {}

  async assign(
    idJugador: number,
    dto: HabilidadJugadorDto,
  ): Promise<HabilidadJugadorResponseDto> {
    if (dto.idHabilidad === undefined || dto.nivel === undefined) {
      throw ApplicationErrors.invalidInput(
        'idHabilidad and nivel are required for assignment',
      );
    }

    await this.jugadoresService.findOne(idJugador);
    await this.habilidadesService.findOne(dto.idHabilidad);

    if (
      await this.habilidadesJugadorRepository.existsByPair(
        idJugador,
        dto.idHabilidad,
      )
    ) {
      throw ApplicationErrors.conflict('The player already has this skill');
    }

    await this.habilidadJugadorRepository.save(
      this.habilidadJugadorMapper.toEntity(idJugador, dto),
    );
    const saved = await this.habilidadesJugadorRepository.findOneByPair(
      idJugador,
      dto.idHabilidad,
    );
    if (!saved) {
      throw new Error('Assigned player skill could not be reloaded');
    }
    return this.habilidadJugadorMapper.toResponseDto(saved);
  }

  async findByJugador(
    idJugador: number,
  ): Promise<HabilidadJugadorResponseDto[]> {
    await this.jugadoresService.findOne(idJugador);
    const assignments =
      await this.habilidadesJugadorRepository.findByJugador(idJugador);
    return this.habilidadJugadorMapper.toResponseDtoList(assignments);
  }

  async findByHabilidad(
    idHabilidad: number,
  ): Promise<HabilidadJugadorResponseDto[]> {
    await this.habilidadesService.findOne(idHabilidad);
    const assignments =
      await this.habilidadesJugadorRepository.findByHabilidad(idHabilidad);
    return this.habilidadJugadorMapper.toResponseDtoList(assignments);
  }

  async update(
    idJugador: number,
    idHabilidad: number,
    dto: ActualizarHabilidadJugadorDto,
  ): Promise<HabilidadJugadorResponseDto> {
    const assignment = await this.habilidadesJugadorRepository.findOneByPair(
      idJugador,
      idHabilidad,
    );
    if (!assignment) {
      throw ApplicationErrors.notFound('The player does not have this skill');
    }

    await this.habilidadJugadorRepository.save(
      this.habilidadJugadorMapper.mergeEntity(assignment, dto),
    );
    const reloaded = await this.habilidadesJugadorRepository.findOneByPair(
      idJugador,
      idHabilidad,
    );
    if (!reloaded) {
      throw new Error('Updated player skill could not be reloaded');
    }
    return this.habilidadJugadorMapper.toResponseDto(reloaded);
  }

  async remove(idJugador: number, idHabilidad: number): Promise<void> {
    const assignment = await this.habilidadesJugadorRepository.findOneByPair(
      idJugador,
      idHabilidad,
    );
    if (!assignment) {
      throw ApplicationErrors.notFound('The player does not have this skill');
    }

    await this.habilidadJugadorRepository.remove(assignment);
  }
}
