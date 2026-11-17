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
import { Genero } from '../entities/jugador.entity';

export class JugadorDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(100)
  nombre?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(100)
  apellido?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsDateString()
  fechaNacimiento?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(Genero)
  genero?: Genero;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEmail()
  @MaxLength(150)
  correo?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(30)
  identificacion?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  activo?: boolean;
}
