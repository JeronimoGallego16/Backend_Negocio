import { validate } from 'class-validator';
import { PlayerSkillDto } from './player-skill.dto';

describe('PlayerSkillDto validation', () => {
  it.each([1, 5])('accepts skill level %i', async (level) => {
    const dto = Object.assign(new PlayerSkillDto(), { level });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it.each([0, 6])('rejects skill level %i', async (level) => {
    const dto = Object.assign(new PlayerSkillDto(), { level });

    await expect(validate(dto)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'level' })]),
    );
  });
});
