import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { SportDto } from './dto/sport.dto';
import { SportResponseDto } from './dto/sport-response.dto';
import { SportsService } from './sports.service';

/**
 * HTTP endpoints for managing sports.
 */
@Controller('sports')
export class SportsController {
  /**
   * Creates the sports controller.
   *
   * @param sportsService - Service handling sport business logic.
   */
  constructor(private readonly sportsService: SportsService) {}

  /**
   * Creates a sport.
   *
   * @param dto - Sport data from the request body.
   * @returns The created sport.
   */
  @Post()
  create(@Body() dto: SportDto): Promise<SportResponseDto> {
    return this.sportsService.create(dto);
  }

  /**
   * Lists all sports.
   *
   * @returns All sports.
   */
  @Get()
  findAll(): Promise<SportResponseDto[]> {
    return this.sportsService.findAll();
  }

  /**
   * Retrieves a sport by identifier.
   *
   * @param id - Sport identifier from the route.
   * @returns The matching sport.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<SportResponseDto> {
    return this.sportsService.findOne(id);
  }

  /**
   * Updates a sport's supplied fields.
   *
   * @param id - Sport identifier from the route.
   * @param dto - Fields to update.
   * @returns The updated sport.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SportDto,
  ): Promise<SportResponseDto> {
    return this.sportsService.update(id, dto);
  }
}
