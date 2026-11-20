import { validate } from 'class-validator';
import { TournamentDto } from './tournament.dto';

describe('TournamentDto', () => {
  it('accepts OPEN and an optional registration closing date', async () => {
    const dto = Object.assign(new TournamentDto(), {
      status: 'OPEN',
      registrationEndDate: '2999-12-01',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects statuses outside the tournament lifecycle', async () => {
    const dto = Object.assign(new TournamentDto(), {
      status: 'ACCEPTING_REGISTRATIONS',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toContain('status');
  });
});
