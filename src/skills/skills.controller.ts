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
import { SkillDto } from './dto/skill.dto';
import { SkillResponseDto } from './dto/skill-response.dto';
import { SkillsService } from './skills.service';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  create(@Body() dto: SkillDto): Promise<SkillResponseDto> {
    return this.skillsService.create(dto);
  }

  @Get()
  findAll(): Promise<SkillResponseDto[]> {
    return this.skillsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<SkillResponseDto> {
    return this.skillsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SkillDto,
  ): Promise<SkillResponseDto> {
    return this.skillsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.skillsService.remove(id);
  }
}
