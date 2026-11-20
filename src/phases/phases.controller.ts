import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PhaseDto } from './dto/phase.dto';
import { PhaseResponseDto } from './dto/phase-response.dto';
import { PhasesService } from './phases.service';

/**
 * HTTP endpoints for tournament phases.
 */
@Controller('api/phases')
export class PhasesController {
  /**
   * Creates the phases controller.
   *
   * @param phasesService - Phase service.
   */
  constructor(private readonly phasesService: PhasesService) {}

  /**
   * Creates a group or final phase.
   *
   * @param dto - Phase data.
   * @returns The created phase.
   */
  @Post()
  create(@Body() dto: PhaseDto): Promise<PhaseResponseDto> {
    return this.phasesService.create(dto);
  }

  /**
   * Lists phases with an optional tournament filter.
   *
   * @param tournamentId - Optional tournament filter.
   * @returns Matching phases.
   */
  @Get()
  findAll(
    @Query('tournamentId') tournamentId?: string,
  ): Promise<PhaseResponseDto[]> {
    return this.phasesService.findAll(
      tournamentId === undefined ? undefined : Number(tournamentId),
    );
  }

  /**
   * Retrieves a phase.
   *
   * @param id - Phase identifier.
   * @returns The matching phase.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PhaseResponseDto> {
    return this.phasesService.findOne(id);
  }

  /**
   * Updates a phase.
   *
   * @param id - Phase identifier.
   * @param dto - Fields to update.
   * @returns The updated phase.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PhaseDto,
  ): Promise<PhaseResponseDto> {
    return this.phasesService.update(id, dto);
  }

  /**
   * Deletes a phase when no associated information prevents it.
   *
   * @param id - Phase identifier.
   * @returns Nothing after deletion.
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.phasesService.remove(id);
  }
}
