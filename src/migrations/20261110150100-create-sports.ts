import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * Creates the sports table and its unique-name constraint.
 */
export class CreateSports20261110150100 implements MigrationInterface {
  name = 'CreateSports20261110150100';

  /**
   * Creates the sports table.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves when the table is created.
   */
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sports',
        columns: [
          {
            name: 'sport_id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', length: '120', isNullable: false },
          { name: 'description', type: 'text', isNullable: false },
        ],
        uniques: [{ name: 'uq_sports_name', columnNames: ['name'] }],
      }),
    );
  }

  /**
   * Drops the sports table.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves when the table is dropped.
   */
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sports');
  }
}
