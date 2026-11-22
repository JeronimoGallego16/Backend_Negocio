import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

/**
 * Repairs relationships missing from databases created by earlier migrations.
 */
export class RepairSportAndMatchRelationships20261120000000 implements MigrationInterface {
  name = 'RepairSportAndMatchRelationships20261120000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const sportsTable = await queryRunner.getTable('sports');
    const matchesTable = await queryRunner.getTable('matches');

    if (!sportsTable || !matchesTable) {
      throw new Error(
        'Cannot repair relationships: sports or matches table is missing.',
      );
    }

    const missingTeamColumns = ['home_team_id', 'away_team_id'].filter(
      (columnName) => !matchesTable.findColumnByName(columnName),
    );

    if (missingTeamColumns.length > 0) {
      const rows: Array<{ count: number | string }> = await queryRunner.query(
        'SELECT COUNT(*) AS count FROM matches',
      );

      if (Number(rows[0]?.count ?? 0) > 0) {
        throw new Error(
          `Cannot add required ${missingTeamColumns.join(', ')} columns: ` +
            'matches contains existing rows that need a team mapping.',
        );
      }
    }

    if (!sportsTable.findColumnByName('parent_id')) {
      await queryRunner.addColumn(
        'sports',
        new TableColumn({
          name: 'parent_id',
          type: 'int',
          isNullable: true,
        }),
      );
    }

    const updatedSportsTable = await queryRunner.getTable('sports');
    if (
      updatedSportsTable &&
      !updatedSportsTable.foreignKeys.some(
        (foreignKey) =>
          foreignKey.columnNames.includes('parent_id') &&
          foreignKey.referencedTableName === 'sports',
      )
    ) {
      await queryRunner.createForeignKey(
        'sports',
        new TableForeignKey({
          name: 'fk_sports_parent',
          columnNames: ['parent_id'],
          referencedTableName: 'sports',
          referencedColumnNames: ['sport_id'],
          onDelete: 'NO ACTION',
          onUpdate: 'NO ACTION',
        }),
      );
    }

    for (const columnName of missingTeamColumns) {
      await queryRunner.addColumn(
        'matches',
        new TableColumn({
          name: columnName,
          type: 'int',
          isNullable: false,
        }),
      );

      const role = columnName === 'home_team_id' ? 'home' : 'away';
      await queryRunner.createForeignKey(
        'matches',
        new TableForeignKey({
          name: `fk_matches_${role}_team`,
          columnNames: [columnName],
          referencedTableName: 'teams',
          referencedColumnNames: ['team_id'],
          onDelete: 'NO ACTION',
          onUpdate: 'NO ACTION',
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const matchesTable = await queryRunner.getTable('matches');
    if (matchesTable) {
      for (const foreignKeyName of [
        'fk_matches_home_team',
        'fk_matches_away_team',
      ]) {
        const foreignKey = matchesTable.foreignKeys.find(
          (item) => item.name === foreignKeyName,
        );
        if (foreignKey) {
          await queryRunner.dropForeignKey('matches', foreignKey);
        }
      }

      for (const columnName of ['home_team_id', 'away_team_id']) {
        if (await queryRunner.hasColumn('matches', columnName)) {
          await queryRunner.dropColumn('matches', columnName);
        }
      }
    }

    const sportsTable = await queryRunner.getTable('sports');
    if (sportsTable) {
      const parentForeignKey = sportsTable.foreignKeys.find(
        (item) =>
          item.columnNames.includes('parent_id') &&
          item.referencedTableName === 'sports',
      );
      if (parentForeignKey) {
        await queryRunner.dropForeignKey('sports', parentForeignKey);
      }

      if (await queryRunner.hasColumn('sports', 'parent_id')) {
        await queryRunner.dropColumn('sports', 'parent_id');
      }
    }
  }
}
