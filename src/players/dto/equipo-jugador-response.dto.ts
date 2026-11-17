export class EquipoJugadorResponseDto {
  idHistorial!: number;
  idJugador!: number;
  idEquipo!: number;
  fechaInicio!: string;
  fechaFin!: string | null;
  nombreJugador!: string;
  nombreEquipo!: string;
}
