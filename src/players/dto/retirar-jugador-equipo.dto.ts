import { IsDateString, ValidateIf } from 'class-validator';

export class RetirarJugadorEquipoDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsDateString()
  fechaFin?: string;
}
