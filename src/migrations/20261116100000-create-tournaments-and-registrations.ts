import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * Creates tournaments and their team registration join entity.
 */
export class CreateTournamentsAndRegistrations20261116100000
  implements MigrationInterface
{
  name = 'CreateTournamentsAndRegistrations20261116100000';

  /**
   * Creates tournament and registration tables.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves when the tables are created.
   */
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tournaments',
        columns: [
          {
            name: 'tournament_id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', length: '150', isNullable: false },
          { name: 'modality', type: 'varchar', length: '50', isNullable: false },
          { name: 'start_date', type: 'date', isNullable: false },
          { name: 'end_date', type: 'date', isNullable: false },
          { name: 'status', type: 'varchar', length: '30', isNullable: false },
          { name: 'capacity', type: 'int', isNullable: false },
          { name: 'sport_id', type: 'int', isNullable: false },
        ],
        foreignKeys: [
          {
            name: 'fk_tournaments_sport',
            columnNames: ['sport_id'],
            referencedTableName: 'sports',
            referencedColumnNames: ['sport_id'],
            onDelete: 'NO ACTION',
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'registrations',
        columns: [
          {
            name: 'registration_id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'registration_date', type: 'date', isNullable: false },
          { name: 'tournament_id', type: 'int', isNullable: false },
          { name: 'team_id', type: 'int', isNullable: false },
        ],
        uniques: [
          {
            name: 'uq_registrations_tournament_team',
            columnNames: ['tournament_id', 'team_id'],
          },
        ],
        foreignKeys: [
          {
            name: 'fk_registrations_tournament',
            columnNames: ['tournament_id'],
            referencedTableName: 'tournaments',
            referencedColumnNames: ['tournament_id'],
            onDelete: 'NO ACTION',
          },
          {
            name: 'fk_registrations_team',
            columnNames: ['team_id'],
            referencedTableName: 'teams',
            referencedColumnNames: ['team_id'],
            onDelete: 'NO ACTION',
          },
        ],
      }),
    );
  }

  /**
   * Drops registration and tournament tables.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves when the tables are dropped.
   */
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('registrations');
    await queryRunner.dropTable('tournaments');
  }
}
