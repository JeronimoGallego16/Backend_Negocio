import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { TeamsService } from '../teams/teams.service';
import { AsignarJugadorEquipoDto } from './dto/asignar-jugador-equipo.dto';
import { EquipoJugadorResponseDto } from './dto/equipo-jugador-response.dto';
import { RetirarJugadorEquipoDto } from './dto/retirar-jugador-equipo.dto';
import { EquipoJugador } from './entities/equipo-jugador.entity';
import { EquipoJugadorMapper } from './mappers/equipo-jugador.mapper';
import { EquiposJugadorRepository } from './repositories/equipos-jugador.repository';
import { JugadoresService } from './jugadores.service';

@Injectable()
export class EquiposJugadorService {
  constructor(
    @InjectRepository(EquipoJugador)
    private readonly equipoJugadorRepository: Repository<EquipoJugador>,
    private readonly equiposJugadorRepository: EquiposJugadorRepository,
    private readonly jugadoresService: JugadoresService,
    private readonly teamsService: TeamsService,
    private readonly equipoJugadorMapper: EquipoJugadorMapper,
  ) {}

  async assign(
    idEquipo: number,
    dto: AsignarJugadorEquipoDto,
  ): Promise<EquipoJugadorResponseDto> {
    if (dto.idJugador === undefined || !dto.fechaInicio) {
      throw ApplicationErrors.invalidInput(
        'idJugador and fechaInicio are required for assignment',
      );
    }

    if (dto.fechaFin !== undefined && dto.fechaFin < dto.fechaInicio) {
      throw ApplicationErrors.invalidInput(
        'fechaFin cannot be earlier than fechaInicio',
      );
    }

    await this.jugadoresService.findOne(dto.idJugador);
    await this.teamsService.findOne(idEquipo);

    const overlaps = await this.equiposJugadorRepository.findOverlapping(
      dto.idJugador,
      dto.fechaInicio,
      dto.fechaFin ?? null,
    );

    if (overlaps.some((assignment) => assignment.idEquipo === idEquipo)) {
      throw ApplicationErrors.conflict(
        'The player is already assigned to this team in that period',
      );
    }

    let previous: EquipoJugador | null = null;
    if (overlaps.length > 0) {
      if (
        overlaps.length === 1 &&
        overlaps[0].fechaFin === null &&
        overlaps[0].fechaInicio < dto.fechaInicio
      ) {
        previous = overlaps[0];
        previous.fechaFin = dto.fechaInicio;
      } else {
        throw ApplicationErrors.conflict(
          'The player already has a team in that period',
        );
      }
    }

    const next = this.equipoJugadorMapper.toEntity(idEquipo, dto);
    const saved = await this.equiposJugadorRepository.saveClosingPrevious(
      previous,
      next,
    );
    return this.equipoJugadorMapper.toResponseDto(saved);
  }

  async retire(
    idEquipo: number,
    idJugador: number,
    dto: RetirarJugadorEquipoDto,
  ): Promise<EquipoJugadorResponseDto> {
    if (!dto.fechaFin) {
      throw ApplicationErrors.invalidInput(
        'fechaFin is required for retirement',
      );
    }

    const assignment = await this.equiposJugadorRepository.findOpenLink(
      idJugador,
      idEquipo,
    );
    if (!assignment) {
      throw ApplicationErrors.notFound(
        'The player has no open assignment with this team',
      );
    }

    if (dto.fechaFin < assignment.fechaInicio) {
      throw ApplicationErrors.invalidInput(
        'fechaFin cannot be earlier than fechaInicio',
      );
    }

    assignment.fechaFin = dto.fechaFin;
    const saved = await this.equipoJugadorRepository.save(assignment);
    return this.equipoJugadorMapper.toResponseDto(saved);
  }

  async findByJugador(idJugador: number): Promise<EquipoJugadorResponseDto[]> {
    await this.jugadoresService.findOne(idJugador);
    const assignments =
      await this.equiposJugadorRepository.findByJugador(idJugador);
    return this.equipoJugadorMapper.toResponseDtoList(assignments);
  }

  async findByEquipo(
    idEquipo: number,
    onlyCurrent: boolean,
  ): Promise<EquipoJugadorResponseDto[]> {
    await this.teamsService.findOne(idEquipo);
    const today = onlyCurrent
      ? new Date().toISOString().slice(0, 10)
      : undefined;
    const assignments = await this.equiposJugadorRepository.findByEquipo(
      idEquipo,
      today,
    );
    return this.equipoJugadorMapper.toResponseDtoList(assignments);
  }

  belongsToTeam(
    idJugador: number,
    idEquipo: number,
    onDate: string,
  ): Promise<boolean> {
    return this.equiposJugadorRepository.belongsToTeam(
      idJugador,
      idEquipo,
      onDate,
    );
  }
}
