import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ActualizarHabilidadJugadorDto } from './dto/actualizar-habilidad-jugador.dto';
import { HabilidadJugadorDto } from './dto/habilidad-jugador.dto';
import { HabilidadJugadorResponseDto } from './dto/habilidad-jugador-response.dto';
import { HabilidadesJugadorService } from './habilidades-jugador.service';

@Controller()
export class HabilidadesJugadorController {
  constructor(
    private readonly habilidadesJugadorService: HabilidadesJugadorService,
  ) {}

  @Post('jugadores/:idJugador/habilidades')
  assign(
    @Param('idJugador', ParseIntPipe) idJugador: number,
    @Body() dto: HabilidadJugadorDto,
  ): Promise<HabilidadJugadorResponseDto> {
    return this.habilidadesJugadorService.assign(idJugador, dto);
  }

  @Get('jugadores/:idJugador/habilidades')
  findByJugador(
    @Param('idJugador', ParseIntPipe) idJugador: number,
  ): Promise<HabilidadJugadorResponseDto[]> {
    return this.habilidadesJugadorService.findByJugador(idJugador);
  }

  @Patch('jugadores/:idJugador/habilidades/:idHabilidad')
  update(
    @Param('idJugador', ParseIntPipe) idJugador: number,
    @Param('idHabilidad', ParseIntPipe) idHabilidad: number,
    @Body() dto: ActualizarHabilidadJugadorDto,
  ): Promise<HabilidadJugadorResponseDto> {
    return this.habilidadesJugadorService.update(idJugador, idHabilidad, dto);
  }

  @Delete('jugadores/:idJugador/habilidades/:idHabilidad')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('idJugador', ParseIntPipe) idJugador: number,
    @Param('idHabilidad', ParseIntPipe) idHabilidad: number,
  ): Promise<void> {
    return this.habilidadesJugadorService.remove(idJugador, idHabilidad);
  }

  @Get('habilidades/:idHabilidad/jugadores')
  findByHabilidad(
    @Param('idHabilidad', ParseIntPipe) idHabilidad: number,
  ): Promise<HabilidadJugadorResponseDto[]> {
    return this.habilidadesJugadorService.findByHabilidad(idHabilidad);
  }
}
