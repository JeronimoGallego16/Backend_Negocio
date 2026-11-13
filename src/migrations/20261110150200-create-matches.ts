import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * Creates the matches table and its two team references.
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
          { name: 'home_team_id', type: 'int', isNullable: false },
          { name: 'away_team_id', type: 'int', isNullable: false },
        ],
        foreignKeys: [
          {
            name: 'fk_matches_home_team',
            columnNames: ['home_team_id'],
            referencedTableName: 'teams',
            referencedColumnNames: ['team_id'],
            onDelete: 'NO ACTION',
            onUpdate: 'NO ACTION',
          },
          {
            name: 'fk_matches_away_team',
            columnNames: ['away_team_id'],
            referencedTableName: 'teams',
            referencedColumnNames: ['team_id'],
            onDelete: 'NO ACTION',
            onUpdate: 'NO ACTION',
          },
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
