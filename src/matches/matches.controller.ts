import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { MatchDto } from './dto/match.dto';
import { MatchResponseDto } from './dto/match-response.dto';
import { MatchesService } from './matches.service';

/**
 * HTTP endpoints for managing matches.
 */
@Controller('matches')
export class MatchesController {
  /**
   * Creates the matches controller.
   *
   * @param matchesService - Service handling match business logic.
   */
  constructor(private readonly matchesService: MatchesService) {}

  /**
   * Creates a match.
   *
   * @param dto - Match data from the request body.
   * @returns The created match.
   */
  @Post()
  create(@Body() dto: MatchDto): Promise<MatchResponseDto> {
    return this.matchesService.create(dto);
  }

  /**
   * Lists all matches.
   *
   * @returns All matches.
   */
  @Get()
  findAll(): Promise<MatchResponseDto[]> {
    return this.matchesService.findAll();
  }

  /**
   * Retrieves a match by identifier.
   *
   * @param id - Match identifier from the route.
   * @returns The matching match.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<MatchResponseDto> {
    return this.matchesService.findOne(id);
  }

  /**
   * Updates a match's supplied fields.
   *
   * @param id - Match identifier from the route.
   * @param dto - Fields to update.
   * @returns The updated match.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MatchDto,
  ): Promise<MatchResponseDto> {
    return this.matchesService.update(id, dto);
  }
}
