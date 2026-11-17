import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { JugadoresService } from '../players/jugadores.service';
import { ActualizarAnotacionDto } from './dto/actualizar-anotacion.dto';
import { AnotacionDto } from './dto/anotacion.dto';
import { AnotacionResponseDto } from './dto/anotacion-response.dto';
import { Anotacion } from './entities/anotacion.entity';
import { AnotacionMapper } from './mappers/anotacion.mapper';
import { AnotacionesRepository } from './repositories/anotaciones.repository';
import { MatchesService } from './matches.service';

@Injectable()
export class AnotacionesService {
  constructor(
    @InjectRepository(Anotacion)
    private readonly anotacionRepository: Repository<Anotacion>,
    private readonly anotacionesRepository: AnotacionesRepository,
    private readonly matchesService: MatchesService,
    private readonly jugadoresService: JugadoresService,
    private readonly anotacionMapper: AnotacionMapper,
  ) {}

  async create(
    idPartido: number,
    dto: AnotacionDto,
  ): Promise<AnotacionResponseDto> {
    if (
      dto.idJugador === undefined ||
      dto.minuto === undefined ||
      !dto.tipo?.trim()
    ) {
      throw ApplicationErrors.invalidInput(
        'idJugador, minuto and tipo are required for creation',
      );
    }

    await this.matchesService.findOne(idPartido);
    await this.jugadoresService.findOne(dto.idJugador);

    const saved = await this.anotacionRepository.save(
      this.anotacionMapper.toEntity(idPartido, dto),
    );
    const reloaded = await this.anotacionesRepository.findOneWithJugador(
      saved.idAnotacion,
    );
    if (!reloaded) {
      throw new Error('Saved scoring record could not be reloaded');
    }
    return this.anotacionMapper.toResponseDto(reloaded);
  }

  async findByPartido(idPartido: number): Promise<AnotacionResponseDto[]> {
    await this.matchesService.findOne(idPartido);
    const annotations =
      await this.anotacionesRepository.findByPartido(idPartido);
    return this.anotacionMapper.toResponseDtoList(annotations);
  }

  async update(
    idAnotacion: number,
    dto: ActualizarAnotacionDto,
  ): Promise<AnotacionResponseDto> {
    const annotation =
      await this.anotacionesRepository.findOneWithJugador(idAnotacion);
    if (!annotation) {
      throw ApplicationErrors.notFound(
        `Scoring record with id ${idAnotacion} not found`,
      );
    }
    if (annotation.anulado) {
      throw ApplicationErrors.conflict(
        'A voided scoring record cannot be modified',
      );
    }

    const saved = await this.anotacionRepository.save(
      this.anotacionMapper.mergeEntity(annotation, dto),
    );
    return this.anotacionMapper.toResponseDto(saved);
  }

  async void(idAnotacion: number): Promise<void> {
    const annotation =
      await this.anotacionesRepository.findOneWithJugador(idAnotacion);
    if (!annotation) {
      throw ApplicationErrors.notFound(
        `Scoring record with id ${idAnotacion} not found`,
      );
    }

    annotation.anulado = true;
    await this.anotacionRepository.save(annotation);
  }
}
