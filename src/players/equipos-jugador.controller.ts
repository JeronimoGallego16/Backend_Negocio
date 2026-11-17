import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AsignarJugadorEquipoDto } from './dto/asignar-jugador-equipo.dto';
import { EquipoJugadorResponseDto } from './dto/equipo-jugador-response.dto';
import { RetirarJugadorEquipoDto } from './dto/retirar-jugador-equipo.dto';
import { EquiposJugadorService } from './equipos-jugador.service';

@Controller()
export class EquiposJugadorController {
  constructor(private readonly equiposJugadorService: EquiposJugadorService) {}

  @Post('teams/:idEquipo/jugadores')
  assign(
    @Param('idEquipo', ParseIntPipe) idEquipo: number,
    @Body() dto: AsignarJugadorEquipoDto,
  ): Promise<EquipoJugadorResponseDto> {
    return this.equiposJugadorService.assign(idEquipo, dto);
  }

  @Patch('teams/:idEquipo/jugadores/:idJugador/retiro')
  retire(
    @Param('idEquipo', ParseIntPipe) idEquipo: number,
    @Param('idJugador', ParseIntPipe) idJugador: number,
    @Body() dto: RetirarJugadorEquipoDto,
  ): Promise<EquipoJugadorResponseDto> {
    return this.equiposJugadorService.retire(idEquipo, idJugador, dto);
  }

  @Get('teams/:idEquipo/jugadores')
  findByEquipo(
    @Param('idEquipo', ParseIntPipe) idEquipo: number,
    @Query('vigentes') vigentes?: string,
  ): Promise<EquipoJugadorResponseDto[]> {
    return this.equiposJugadorService.findByEquipo(
      idEquipo,
      vigentes === 'true',
    );
  }

  @Get('jugadores/:idJugador/equipos')
  findByJugador(
    @Param('idJugador', ParseIntPipe) idJugador: number,
  ): Promise<EquipoJugadorResponseDto[]> {
    return this.equiposJugadorService.findByJugador(idJugador);
  }
}
