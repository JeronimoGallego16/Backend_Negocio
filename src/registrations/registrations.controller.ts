import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RegistrationDto } from './dto/registration.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';
import { RegistrationsService } from './registrations.service';

/**
 * HTTP endpoints for managing tournament registrations.
 */
@Controller('registrations')
export class RegistrationsController {
  /**
   * Creates the registrations controller.
   *
   * @param registrationsService - Service handling registration business logic.
   */
  constructor(private readonly registrationsService: RegistrationsService) {}

  /**
   * Registers a team.
   *
   * @param dto - Registration data from the request body.
   * @returns The created registration.
   */
  @Post()
  create(@Body() dto: RegistrationDto): Promise<RegistrationResponseDto> {
    return this.registrationsService.create(dto);
  }

  /**
   * Lists registrations with optional tournament/team filters.
   *
   * @param tournamentId - Optional tournament filter.
   * @param teamId - Optional team filter.
   * @returns Matching registrations.
   */
  @Get()
  findAll(
    @Query('tournamentId') tournamentId?: string,
    @Query('teamId') teamId?: string,
  ): Promise<RegistrationResponseDto[]> {
    return this.registrationsService.findAll(
      tournamentId === undefined ? undefined : Number(tournamentId),
      teamId === undefined ? undefined : Number(teamId),
    );
  }

  /**
   * Removes a registration.
   *
   * @param id - Registration identifier from the route.
   * @returns A confirmation message after withdrawal.
   */
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return this.registrationsService.remove(id);
  }
}
