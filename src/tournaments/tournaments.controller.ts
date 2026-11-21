import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { TournamentDto } from './dto/tournament.dto';
import { TournamentResponseDto } from './dto/tournament-response.dto';
import { TournamentsService } from './tournaments.service';

/**
 * HTTP endpoints for managing tournaments.
 */
@Controller('api/tournaments')
export class TournamentsController {
  /**
   * Creates the tournaments controller.
   *
   * @param tournamentsService - Service handling tournament business logic.
   */
  constructor(private readonly tournamentsService: TournamentsService) {}

  /**
   * Creates a tournament.
   *
   * @param dto - Tournament data from the request body.
   * @returns The created tournament.
   */
  @Post()
  create(@Body() dto: TournamentDto): Promise<TournamentResponseDto> {
    return this.tournamentsService.create(dto);
  }

  /**
   * Lists all tournaments.
   *
   * @returns All tournaments.
   */
  @Get()
  findAll(): Promise<TournamentResponseDto[]> {
    return this.tournamentsService.findAll();
  }

  /**
   * Retrieves a tournament by identifier.
   *
   * @param id - Tournament identifier from the route.
   * @returns The matching tournament.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<TournamentResponseDto> {
    return this.tournamentsService.findOne(id);
  }

  /**
   * Retrieves the complete competition development structure.
   *
   * @param id - Tournament identifier.
   * @returns Tournament phases, groups and matches.
   */
  @Get(':id/development')
  findDevelopment(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Record<string, unknown>> {
    return this.tournamentsService.findDevelopment(id);
  }

  /**
   * Updates a tournament.
   *
   * @param id - Tournament identifier from the route.
   * @param dto - Fields to update.
   * @returns The updated tournament.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TournamentDto,
  ): Promise<TournamentResponseDto> {
    return this.tournamentsService.update(id, dto);
  }

  /**
   * Deletes a tournament without registrations.
   *
   * @param id - Tournament identifier from the route.
   * @returns Nothing when deletion succeeds.
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.tournamentsService.remove(id);
  }
}
