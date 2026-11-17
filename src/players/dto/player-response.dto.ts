import { Gender } from '../entities/player.entity';

export class PlayerResponseDto {
  playerId!: number;
  name!: string;
  lastName!: string;
  birthDate!: string;
  gender!: Gender;
  email!: string;
  identification!: string;
  active!: boolean;
}
