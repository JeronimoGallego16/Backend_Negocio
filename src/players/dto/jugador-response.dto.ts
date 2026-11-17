import { Genero } from '../entities/jugador.entity';

export class JugadorResponseDto {
  idJugador!: number;
  nombre!: string;
  apellido!: string;
  fechaNacimiento!: string;
  genero!: Genero;
  correo!: string;
  identificacion!: string;
  activo!: boolean;
}
