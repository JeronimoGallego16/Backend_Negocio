import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { JugadorDto } from './dto/jugador.dto';
import { JugadorResponseDto } from './dto/jugador-response.dto';
import { Jugador } from './entities/jugador.entity';
import { JugadorMapper } from './mappers/jugador.mapper';
import { JugadoresRepository } from './repositories/jugadores.repository';

@Injectable()
export class JugadoresService {
  constructor(
    @InjectRepository(Jugador)
    private readonly jugadorRepository: Repository<Jugador>,
    private readonly jugadoresRepository: JugadoresRepository,
    private readonly jugadorMapper: JugadorMapper,
  ) {}

  async create(dto: JugadorDto): Promise<JugadorResponseDto> {
    if (
      !dto.nombre?.trim() ||
      !dto.apellido?.trim() ||
      !dto.fechaNacimiento ||
      !dto.genero ||
      !dto.correo?.trim() ||
      !dto.identificacion?.trim()
    ) {
      throw ApplicationErrors.invalidInput(
        'nombre, apellido, fechaNacimiento, genero, correo and identificacion are required for create',
      );
    }

    if (dto.fechaNacimiento > this.today()) {
      throw ApplicationErrors.invalidInput(
        'fechaNacimiento cannot be in the future',
      );
    }

    if (
      await this.jugadoresRepository.existsByIdentificacion(dto.identificacion)
    ) {
      throw ApplicationErrors.conflict(
        'A player with this identification already exists',
      );
    }

    if (await this.jugadoresRepository.existsByCorreo(dto.correo)) {
      throw ApplicationErrors.conflict(
        'A player with this email already exists',
      );
    }

    const saved = await this.jugadorRepository.save(
      this.jugadorMapper.toEntity(dto),
    );
    return this.jugadorMapper.toResponseDto(saved);
  }

  async findAll(): Promise<JugadorResponseDto[]> {
    const jugadores = await this.jugadorRepository.find();
    return this.jugadorMapper.toResponseDtoList(jugadores);
  }

  async findOne(id: number): Promise<JugadorResponseDto> {
    return this.jugadorMapper.toResponseDto(await this.findEntity(id));
  }

  async update(id: number, dto: JugadorDto): Promise<JugadorResponseDto> {
    const jugador = await this.findEntity(id);
    const merged = this.jugadorMapper.mergeEntity(jugador, dto);

    if (merged.fechaNacimiento > this.today()) {
      throw ApplicationErrors.invalidInput(
        'fechaNacimiento cannot be in the future',
      );
    }

    if (
      await this.jugadoresRepository.existsByIdentificacion(
        merged.identificacion,
        id,
      )
    ) {
      throw ApplicationErrors.conflict(
        'A player with this identification already exists',
      );
    }

    if (await this.jugadoresRepository.existsByCorreo(merged.correo, id)) {
      throw ApplicationErrors.conflict(
        'A player with this email already exists',
      );
    }

    const saved = await this.jugadorRepository.save(merged);
    return this.jugadorMapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<void> {
    const jugador = await this.findEntity(id);

    if (await this.jugadoresRepository.hasAssociatedData(id)) {
      throw ApplicationErrors.conflict(
        'The player has associated skills, teams or scoring records and cannot be deleted; deactivate it instead',
      );
    }

    await this.jugadorRepository.remove(jugador);
  }

  private async findEntity(id: number): Promise<Jugador> {
    const jugador = await this.jugadorRepository.findOne({
      where: { idJugador: id },
    });
    if (!jugador) {
      throw ApplicationErrors.notFound(`Player with id ${id} not found`);
    }
    return jugador;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
