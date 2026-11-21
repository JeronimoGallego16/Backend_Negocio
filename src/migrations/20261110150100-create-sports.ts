import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * Creates the sports table, unique-name constraint, and parent hierarchy.
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
          {
            name: 'parent_id',
            type: 'int',
            isNullable: true,
          },
          { name: 'name', type: 'varchar', length: '120', isNullable: false },
          { name: 'description', type: 'text', isNullable: false },
        ],
        uniques: [{ name: 'uq_sports_name', columnNames: ['name'] }],
        foreignKeys: [
          {
            name: 'fk_sports_parent',
            columnNames: ['parent_id'],
            referencedTableName: 'sports',
            referencedColumnNames: ['sport_id'],
            onDelete: 'NO ACTION',
            onUpdate: 'NO ACTION',
          },
        ],
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
