import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { TeamDto } from './dto/team.dto';
import { TeamResponseDto } from './dto/team-response.dto';
import { TeamsService } from './teams.service';

/**
 * HTTP endpoints for managing teams.
 */
@Controller('teams')
export class TeamsController {
  /**
   * Creates the teams controller.
   *
   * @param teamsService - Service handling team business logic.
   */
  constructor(private readonly teamsService: TeamsService) {}

  /**
   * Creates a team.
   *
   * @param dto - Team data from the request body.
   * @returns The created team.
   */
  @Post()
  create(@Body() dto: TeamDto): Promise<TeamResponseDto> {
    return this.teamsService.create(dto);
  }

  /**
   * Lists all teams.
   *
   * @returns All teams.
   */
  @Get()
  findAll(): Promise<TeamResponseDto[]> {
    return this.teamsService.findAll();
  }

  /**
   * Retrieves a team by identifier.
   *
   * @param id - Team identifier from the route.
   * @returns The matching team.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<TeamResponseDto> {
    return this.teamsService.findOne(id);
  }

  /**
   * Updates a team's supplied fields.
   *
   * @param id - Team identifier from the route.
   * @param dto - Fields to update.
   * @returns The updated team.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TeamDto,
  ): Promise<TeamResponseDto> {
    return this.teamsService.update(id, dto);
  }
}
