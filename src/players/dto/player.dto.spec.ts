import { validate } from 'class-validator';
import { Gender } from '../entities/player.entity';
import { PlayerDto } from './player.dto';

describe('PlayerDto validation', () => {
  it('accepts defined gender values and rejects values outside the enum', async () => {
    const valid = Object.assign(new PlayerDto(), {
      gender: Gender.FEMALE,
    });
    const invalid = Object.assign(new PlayerDto(), {
      gender: 'INVALID',
    });

    await expect(validate(valid)).resolves.toHaveLength(0);
    await expect(validate(invalid)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'gender' })]),
    );
  });

  it('rejects a malformed email', async () => {
    const dto = Object.assign(new PlayerDto(), { email: 'not-an-email' });

    await expect(validate(dto)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'email' })]),
    );
  });
});
