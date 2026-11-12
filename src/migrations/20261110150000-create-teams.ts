import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * Creates the teams table and its natural-key uniqueness constraint.
 */
export class CreateTeams20261110150000 implements MigrationInterface {
  name = 'CreateTeams20261110150000';

  /**
   * Creates the teams table.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves when the table is created.
   */
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'teams',
        columns: [
          {
            name: 'team_id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', length: '120', isNullable: false },
          { name: 'category', type: 'varchar', length: '80', isNullable: false },
        ],
        uniques: [
          {
            name: 'uq_teams_name_category',
            columnNames: ['name', 'category'],
          },
        ],
      }),
    );
  }

  /**
   * Drops the teams table.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves when the table is dropped.
   */
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('teams');
  }
}
