import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

/**
 * Corrects group-team ownership from an unnecessary many-to-many table to a 1:N relation.
 */
export class CorrectGroupTeamToOneToMany20261117130000
  implements MigrationInterface
{
  name = 'CorrectGroupTeamToOneToMany20261117130000';

  /**
   * Adds group_id to teams and removes the former group_teams table.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves when the correction is applied.
   */
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'teams',
      new TableColumn({ name: 'group_id', type: 'int', isNullable: true }),
    );

    if (await queryRunner.hasTable('group_teams')) {
      await queryRunner.query(`
        UPDATE teams team
        JOIN (
          SELECT team_id, MIN(group_id) AS group_id
          FROM group_teams
          GROUP BY team_id
        ) assignment ON assignment.team_id = team.team_id
        SET team.group_id = assignment.group_id
      `);
    }

    await queryRunner.createForeignKey(
      'teams',
      new TableForeignKey({
        name: 'fk_teams_group',
        columnNames: ['group_id'],
        referencedTableName: 'phases',
        referencedColumnNames: ['phase_id'],
        onDelete: 'SET NULL',
      }),
    );

    if (await queryRunner.hasTable('group_teams')) {
      await queryRunner.dropTable('group_teams');
    }
  }

  /**
   * Restores the intermediate group_teams table.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves when the previous structure is restored.
   */
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('teams', 'fk_teams_group');
    await queryRunner.dropColumn('teams', 'group_id');

    await queryRunner.createTable(
      new Table({
        name: 'group_teams',
        columns: [
          {
            name: 'group_team_id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'group_id', type: 'int', isNullable: false },
          { name: 'team_id', type: 'int', isNullable: false },
        ],
        uniques: [
          {
            name: 'uq_group_team',
            columnNames: ['group_id', 'team_id'],
          },
        ],
        foreignKeys: [
          {
            name: 'fk_group_teams_group',
            columnNames: ['group_id'],
            referencedTableName: 'phases',
            referencedColumnNames: ['phase_id'],
            onDelete: 'NO ACTION',
          },
          {
            name: 'fk_group_teams_team',
            columnNames: ['team_id'],
            referencedTableName: 'teams',
            referencedColumnNames: ['team_id'],
            onDelete: 'NO ACTION',
          },
        ],
      }),
    );
  }
}
