import { IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

export class HabilidadDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(100)
  nombre?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}
