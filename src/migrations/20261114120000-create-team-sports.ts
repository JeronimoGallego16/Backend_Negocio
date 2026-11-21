import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * Creates the team-sports assignment table.
 */
export class CreateTeamSports20261114120000 implements MigrationInterface {
  name = 'CreateTeamSports20261114120000';

  /**
   * Creates the assignment table with unique team-sport pairs.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves when the table is created.
   */
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'team_sports',
        columns: [
          {
            name: 'team_sport_id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'team_id', type: 'int', isNullable: false },
          { name: 'sport_id', type: 'int', isNullable: false },
        ],
        uniques: [
          {
            name: 'uq_team_sports_team_sport',
            columnNames: ['team_id', 'sport_id'],
          },
        ],
        foreignKeys: [
          {
            name: 'fk_team_sports_team',
            columnNames: ['team_id'],
            referencedTableName: 'teams',
            referencedColumnNames: ['team_id'],
            onDelete: 'NO ACTION',
            onUpdate: 'NO ACTION',
          },
          {
            name: 'fk_team_sports_sport',
            columnNames: ['sport_id'],
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
   * Drops the team-sports assignment table.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves when the table is dropped.
   */
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('team_sports');
  }
}
