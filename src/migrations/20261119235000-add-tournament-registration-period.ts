import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Adds an optional registration closing date to tournaments.
 */
export class AddTournamentRegistrationPeriod20261119235000
  implements MigrationInterface
{
  name = 'AddTournamentRegistrationPeriod20261119235000';

  /**
   * Adds the optional registration end date.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves after the column is created.
   */
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'tournaments',
      new TableColumn({
        name: 'registration_end_date',
        type: 'date',
        isNullable: true,
      }),
    );
  }

  /**
   * Removes the optional registration end date.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves after the column is removed.
   */
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('tournaments', 'registration_end_date');
  }
}
