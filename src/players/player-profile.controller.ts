import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PlayerProfileResponseDto } from './dto/player-profile-response.dto';
import { PlayerProfileService } from './player-profile.service';

@Controller('players')
export class PlayerProfileController {
  constructor(private readonly playerProfileService: PlayerProfileService) {}

  @Get(':id/profile')
  getProfile(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlayerProfileResponseDto> {
    return this.playerProfileService.getProfile(id);
  }
}
