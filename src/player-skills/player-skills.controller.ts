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
import { UpdatePlayerSkillDto } from './dto/update-player-skill.dto';
import { PlayerSkillDto } from './dto/player-skill.dto';
import { PlayerSkillResponseDto } from './dto/player-skill-response.dto';
import { PlayerSkillsService } from './player-skills.service';

@Controller()
export class PlayerSkillsController {
  constructor(private readonly playerSkillsService: PlayerSkillsService) {}

  @Post('players/:playerId/skills')
  assign(
    @Param('playerId', ParseIntPipe) playerId: number,
    @Body() dto: PlayerSkillDto,
  ): Promise<PlayerSkillResponseDto> {
    return this.playerSkillsService.assign(playerId, dto);
  }

  @Get('players/:playerId/skills')
  findByPlayer(
    @Param('playerId', ParseIntPipe) playerId: number,
  ): Promise<PlayerSkillResponseDto[]> {
    return this.playerSkillsService.findByPlayer(playerId);
  }

  @Patch('players/:playerId/skills/:skillId')
  update(
    @Param('playerId', ParseIntPipe) playerId: number,
    @Param('skillId', ParseIntPipe) skillId: number,
    @Body() dto: UpdatePlayerSkillDto,
  ): Promise<PlayerSkillResponseDto> {
    return this.playerSkillsService.update(playerId, skillId, dto);
  }

  @Delete('players/:playerId/skills/:skillId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('playerId', ParseIntPipe) playerId: number,
    @Param('skillId', ParseIntPipe) skillId: number,
  ): Promise<void> {
    return this.playerSkillsService.remove(playerId, skillId);
  }

  @Get('skills/:skillId/players')
  findBySkill(
    @Param('skillId', ParseIntPipe) skillId: number,
  ): Promise<PlayerSkillResponseDto[]> {
    return this.playerSkillsService.findBySkill(skillId);
  }
}
