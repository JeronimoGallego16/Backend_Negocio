import { Injectable } from '@nestjs/common';
import { PerfilJugadorResponseDto } from './dto/perfil-jugador-response.dto';
import { HabilidadesJugadorService } from './habilidades-jugador.service';
import { EquiposJugadorService } from './equipos-jugador.service';
import { JugadoresService } from './jugadores.service';

@Injectable()
export class PerfilJugadorService {
  constructor(
    private readonly jugadoresService: JugadoresService,
    private readonly habilidadesJugadorService: HabilidadesJugadorService,
    private readonly equiposJugadorService: EquiposJugadorService,
  ) {}

  async getProfile(idJugador: number): Promise<PerfilJugadorResponseDto> {
    const [jugador, habilidades, equipos] = await Promise.all([
      this.jugadoresService.findOne(idJugador),
      this.habilidadesJugadorService.findByJugador(idJugador),
      this.equiposJugadorService.findByJugador(idJugador),
    ]);

    return { jugador, habilidades, equipos };
  }
}
