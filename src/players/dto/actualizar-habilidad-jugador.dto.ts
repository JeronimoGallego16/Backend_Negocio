import { IsInt, IsString, Max, Min, ValidateIf } from 'class-validator';

export class ActualizarHabilidadJugadorDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(5)
  nivel?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  observaciones?: string;
}
