import { validate } from 'class-validator';
import { Genero } from '../entities/jugador.entity';
import { HabilidadJugadorDto } from './habilidad-jugador.dto';
import { JugadorDto } from './jugador.dto';

describe('player DTO validation', () => {
  it('accepts defined gender values and rejects values outside the enum', async () => {
    const valid = Object.assign(new JugadorDto(), {
      genero: Genero.FEMENINO,
    });
    const invalid = Object.assign(new JugadorDto(), {
      genero: 'NO_VALIDO',
    });

    await expect(validate(valid)).resolves.toHaveLength(0);
    await expect(validate(invalid)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'genero' })]),
    );
  });

  it.each([1, 5])('accepts skill level %i', async (nivel) => {
    const dto = Object.assign(new HabilidadJugadorDto(), { nivel });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it.each([0, 6])('rejects skill level %i', async (nivel) => {
    const dto = Object.assign(new HabilidadJugadorDto(), { nivel });

    await expect(validate(dto)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'nivel' })]),
    );
  });

  it('rejects a malformed email', async () => {
    const dto = Object.assign(new JugadorDto(), { correo: 'no-es-correo' });

    await expect(validate(dto)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'correo' })]),
    );
  });
});
