import { IsDateString, IsInt, Min, ValidateIf } from 'class-validator';

export class AsignarJugadorEquipoDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  idJugador?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsDateString()
  fechaInicio?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsDateString()
  fechaFin?: string;
}
