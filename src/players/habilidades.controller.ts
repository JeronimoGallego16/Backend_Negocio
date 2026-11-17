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
import { HabilidadDto } from './dto/habilidad.dto';
import { HabilidadResponseDto } from './dto/habilidad-response.dto';
import { HabilidadesService } from './habilidades.service';

@Controller('habilidades')
export class HabilidadesController {
  constructor(private readonly habilidadesService: HabilidadesService) {}

  @Post()
  create(@Body() dto: HabilidadDto): Promise<HabilidadResponseDto> {
    return this.habilidadesService.create(dto);
  }

  @Get()
  findAll(): Promise<HabilidadResponseDto[]> {
    return this.habilidadesService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<HabilidadResponseDto> {
    return this.habilidadesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: HabilidadDto,
  ): Promise<HabilidadResponseDto> {
    return this.habilidadesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.habilidadesService.remove(id);
  }
}
