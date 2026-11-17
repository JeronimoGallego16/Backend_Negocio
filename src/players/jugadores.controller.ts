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
import { PerfilJugadorResponseDto } from './dto/perfil-jugador-response.dto';
import { JugadorDto } from './dto/jugador.dto';
import { JugadorResponseDto } from './dto/jugador-response.dto';
import { JugadoresService } from './jugadores.service';
import { PerfilJugadorService } from './perfil-jugador.service';

@Controller('jugadores')
export class JugadoresController {
  constructor(
    private readonly jugadoresService: JugadoresService,
    private readonly perfilJugadorService: PerfilJugadorService,
  ) {}

  @Post()
  create(@Body() dto: JugadorDto): Promise<JugadorResponseDto> {
    return this.jugadoresService.create(dto);
  }

  @Get()
  findAll(): Promise<JugadorResponseDto[]> {
    return this.jugadoresService.findAll();
  }

  @Get(':id/perfil')
  getProfile(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PerfilJugadorResponseDto> {
    return this.perfilJugadorService.getProfile(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<JugadorResponseDto> {
    return this.jugadoresService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: JugadorDto,
  ): Promise<JugadorResponseDto> {
    return this.jugadoresService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.jugadoresService.remove(id);
  }
}
