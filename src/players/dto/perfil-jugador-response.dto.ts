import { EquipoJugadorResponseDto } from './equipo-jugador-response.dto';
import { HabilidadJugadorResponseDto } from './habilidad-jugador-response.dto';
import { JugadorResponseDto } from './jugador-response.dto';

export class PerfilJugadorResponseDto {
  jugador!: JugadorResponseDto;
  habilidades!: HabilidadJugadorResponseDto[];
  equipos!: EquipoJugadorResponseDto[];
}
