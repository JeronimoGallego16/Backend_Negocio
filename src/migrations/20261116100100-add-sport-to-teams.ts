import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

/**
 * Adds the sport relationship required to validate team tournament registrations.
 */
export class AddSportToTeams20261116100100 implements MigrationInterface {
  name = 'AddSportToTeams20261116100100';

  /**
   * Adds the nullable sport foreign key to teams.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves when the column is added.
   */
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'teams',
      new TableColumn({ name: 'sport_id', type: 'int', isNullable: true }),
    );
    await queryRunner.createForeignKey(
      'teams',
      new TableForeignKey({
        name: 'fk_teams_sport',
        columnNames: ['sport_id'],
        referencedTableName: 'sports',
        referencedColumnNames: ['sport_id'],
        onDelete: 'NO ACTION',
      }),
    );
  }

  /**
   * Removes the sport relationship from teams.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves when the relationship is removed.
   */
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('teams', 'fk_teams_sport');
    await queryRunner.dropColumn('teams', 'sport_id');
  }
}
