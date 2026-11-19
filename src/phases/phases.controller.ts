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
import { AssignTeamDto } from './dto/assign-team.dto';
import { PhaseDto } from './dto/phase.dto';
import { PhaseResponseDto } from './dto/phase-response.dto';
import { PhasesService } from './phases.service';

/**
 * HTTP endpoints for tournament phases and group assignments.
 */
@Controller('api/phases')
export class PhasesController {
  /**
   * Creates the phases controller.
   *
   * @param phasesService - Service handling phases.
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
   * Retrieves a phase by identifier.
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
   * @returns Nothing when deletion succeeds.
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.phasesService.remove(id);
  }

  /**
   * Assigns a team to a group.
   *
   * @param groupId - Group identifier.
   * @param dto - Team identifier.
   * @returns The created assignment.
   */
  @Post('groups/:groupId/teams')
  assignTeam(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: AssignTeamDto,
  ): Promise<{ teamId: number; groupId: number }> {
    return this.phasesService.assignTeam(groupId, dto);
  }

  /**
   * Lists teams assigned to a group.
   *
   * @param groupId - Group identifier.
   * @returns Team assignments.
   */
  @Get('groups/:groupId/teams')
  findGroupTeams(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<{ teamId: number; name: string; category: string }[]> {
    return this.phasesService.findGroupTeams(groupId);
  }

  /**
   * Removes a team assignment from a group.
   *
   * @param groupId - Group identifier.
   * @param teamId - Team identifier.
   * @returns Nothing when removal succeeds.
   */
  @Delete('groups/:groupId/teams/:teamId')
  async removeTeam(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
  ): Promise<void> {
    await this.phasesService.removeTeam(groupId, teamId);
  }
}
