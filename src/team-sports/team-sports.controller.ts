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
import { CreateTeamSportDto } from './dto/create-team-sport.dto';
import { TeamSportResponseDto } from './dto/team-sport-response.dto';
import { UpdateTeamSportDto } from './dto/update-team-sport.dto';
import { TeamSportsService } from './team-sports.service';

/**
 * HTTP endpoints for managing team-sport assignments.
 */
@Controller('team-sports')
export class TeamSportsController {
  /**
   * Creates the team-sports controller.
   *
   * @param teamSportsService - Service handling assignment business logic.
   */
  constructor(private readonly teamSportsService: TeamSportsService) {}

  /**
   * Assigns a sport to a team.
   *
   * @param dto - Team and sport identifiers from the request body.
   * @returns The created assignment.
   */
  @Post()
  create(@Body() dto: CreateTeamSportDto): Promise<TeamSportResponseDto> {
    return this.teamSportsService.create(dto);
  }

  /**
   * Lists all team-sport assignments.
   *
   * @returns All assignments.
   */
  @Get()
  findAll(): Promise<TeamSportResponseDto[]> {
    return this.teamSportsService.findAll();
  }

  /**
   * Retrieves an assignment by identifier.
   *
   * @param id - Assignment identifier from the route.
   * @returns The matching assignment.
   */
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TeamSportResponseDto> {
    return this.teamSportsService.findOne(id);
  }

  /**
   * Changes the team or sport of an existing assignment.
   *
   * @param id - Assignment identifier from the route.
   * @param dto - Optional replacement identifiers.
   * @returns The updated assignment.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeamSportDto,
  ): Promise<TeamSportResponseDto> {
    return this.teamSportsService.update(id, dto);
  }

  /**
   * Deletes only the assignment record.
   *
   * @param id - Assignment identifier from the route.
   * @returns A confirmation message.
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.teamSportsService.remove(id);
  }
}
