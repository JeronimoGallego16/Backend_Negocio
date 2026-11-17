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
import { ActualizarAnotacionDto } from './dto/actualizar-anotacion.dto';
import { AnotacionDto } from './dto/anotacion.dto';
import { AnotacionResponseDto } from './dto/anotacion-response.dto';
import { AnotacionesService } from './anotaciones.service';

@Controller()
export class AnotacionesController {
  constructor(private readonly anotacionesService: AnotacionesService) {}

  @Post('matches/:idPartido/anotaciones')
  create(
    @Param('idPartido', ParseIntPipe) idPartido: number,
    @Body() dto: AnotacionDto,
  ): Promise<AnotacionResponseDto> {
    return this.anotacionesService.create(idPartido, dto);
  }

  @Get('matches/:idPartido/anotaciones')
  findByPartido(
    @Param('idPartido', ParseIntPipe) idPartido: number,
  ): Promise<AnotacionResponseDto[]> {
    return this.anotacionesService.findByPartido(idPartido);
  }

  @Patch('anotaciones/:idAnotacion')
  update(
    @Param('idAnotacion', ParseIntPipe) idAnotacion: number,
    @Body() dto: ActualizarAnotacionDto,
  ): Promise<AnotacionResponseDto> {
    return this.anotacionesService.update(idAnotacion, dto);
  }

  @Delete('anotaciones/:idAnotacion')
  @HttpCode(HttpStatus.NO_CONTENT)
  void(@Param('idAnotacion', ParseIntPipe) idAnotacion: number): Promise<void> {
    return this.anotacionesService.void(idAnotacion);
  }
}
