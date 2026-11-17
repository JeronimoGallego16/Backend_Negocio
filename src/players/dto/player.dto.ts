import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Gender } from '../entities/player.entity';

export class PlayerDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(100)
  name?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(100)
  lastName?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsDateString()
  birthDate?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(Gender)
  gender?: Gender;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(30)
  identification?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  active?: boolean;
}
