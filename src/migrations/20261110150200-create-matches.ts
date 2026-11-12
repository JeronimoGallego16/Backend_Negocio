import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * Creates the matches table without relations to other domains.
 */
export class CreateMatches20261110150200 implements MigrationInterface {
  name = 'CreateMatches20261110150200';

  /**
   * Creates the matches table.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves when the table is created.
   */
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'matches',
        columns: [
          {
            name: 'match_id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'duration', type: 'varchar', length: '50', isNullable: false },
          { name: 'state', type: 'varchar', length: '50', isNullable: false },
        ],
      }),
    );
  }

  /**
   * Drops the matches table.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves when the table is dropped.
   */
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('matches');
  }
}
