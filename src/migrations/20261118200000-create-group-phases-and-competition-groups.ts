import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

/**
 * Separates group phases from the competition groups they contain.
 */
export class CreateGroupPhasesAndCompetitionGroups20261118200000
  implements MigrationInterface
{
  name = 'CreateGroupPhasesAndCompetitionGroups20261118200000';

  /**
   * Creates competition groups and migrates existing group assignments.
   *
   * Existing GROUP phase rows are retained as the parent group phase. When
   * several legacy group phases belong to one tournament, the first row is
   * retained and the remaining rows are consolidated into that parent.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves when the migration is applied.
   */
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'competition_groups',
        columns: [
          {
            name: 'group_id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'phase_id', type: 'int', isNullable: false },
          {
            name: 'letter_or_number',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          { name: 'max_teams', type: 'int', isNullable: false },
        ],
        uniques: [
          {
            name: 'uq_competition_groups_phase_letter',
            columnNames: ['phase_id', 'letter_or_number'],
          },
        ],
        foreignKeys: [
          {
            name: 'fk_competition_groups_phase',
            columnNames: ['phase_id'],
            referencedTableName: 'phases',
            referencedColumnNames: ['phase_id'],
            onDelete: 'NO ACTION',
          },
        ],
      }),
    );

    await queryRunner.addColumn(
      'teams',
      new TableColumn({
        name: 'competition_group_id',
        type: 'int',
        isNullable: true,
      }),
    );

    const teamsTable = await queryRunner.getTable('teams');
    const legacyGroupForeignKey = teamsTable?.foreignKeys.find(
      (foreignKey) =>
        foreignKey.columnNames.length === 1 &&
        foreignKey.columnNames[0] === 'group_id',
    );
    if (legacyGroupForeignKey) {
      await queryRunner.dropForeignKey('teams', legacyGroupForeignKey);
    }

    const legacyGroups = (await queryRunner.query(`
      SELECT phase_id, tournament_id, name, phase_order,
             letter_or_number, max_teams
      FROM phases
      WHERE phase_type = 'GROUP'
      ORDER BY tournament_id, phase_order, phase_id
    `)) as {
      phase_id: number;
      tournament_id: number;
      name: string;
      phase_order: number;
      letter_or_number: string | null;
      max_teams: number | null;
    }[];

    const parentByTournament = new Map<number, number>();
    const groupByLegacyPhase = new Map<number, number>();

    for (const legacyGroup of legacyGroups) {
      let parentPhaseId = parentByTournament.get(legacyGroup.tournament_id);
      if (parentPhaseId === undefined) {
        parentPhaseId = legacyGroup.phase_id;
        parentByTournament.set(legacyGroup.tournament_id, parentPhaseId);
        await queryRunner.query(
          `UPDATE phases SET name = 'Fase de grupos' WHERE phase_id = ?`,
          [parentPhaseId],
        );
      }

      const letterOrNumber =
        legacyGroup.letter_or_number?.trim() || `Grupo ${legacyGroup.phase_id}`;
      const maxTeams = legacyGroup.max_teams ?? 1;
      const insertResult = (await queryRunner.query(
        `INSERT INTO competition_groups
          (phase_id, letter_or_number, max_teams)
         VALUES (?, ?, ?)`,
        [parentPhaseId, letterOrNumber, maxTeams],
      )) as { insertId: number };
      groupByLegacyPhase.set(legacyGroup.phase_id, insertResult.insertId);
    }

    for (const [legacyPhaseId, groupId] of groupByLegacyPhase) {
      await queryRunner.query(
        `UPDATE teams SET competition_group_id = ? WHERE group_id = ?`,
        [groupId, legacyPhaseId],
      );
    }

    for (const legacyGroup of legacyGroups) {
      const parentPhaseId = parentByTournament.get(legacyGroup.tournament_id);
      if (parentPhaseId !== undefined && legacyGroup.phase_id !== parentPhaseId) {
        await queryRunner.query(
          `UPDATE matches SET phase_id = ? WHERE phase_id = ?`,
          [parentPhaseId, legacyGroup.phase_id],
        );
        await queryRunner.query(
          `DELETE FROM phases WHERE phase_id = ?`,
          [legacyGroup.phase_id],
        );
      }
    }

    if (await queryRunner.hasColumn('teams', 'group_id')) {
      await queryRunner.dropColumn('teams', 'group_id');
    }
    await queryRunner.renameColumn(
      'teams',
      'competition_group_id',
      'group_id',
    );
    await queryRunner.createForeignKey(
      'teams',
      new TableForeignKey({
        name: 'fk_teams_competition_group',
        columnNames: ['group_id'],
        referencedTableName: 'competition_groups',
        referencedColumnNames: ['group_id'],
        onDelete: 'SET NULL',
      }),
    );

    if (await queryRunner.hasColumn('phases', 'letter_or_number')) {
      await queryRunner.dropColumn('phases', 'letter_or_number');
    }
    if (await queryRunner.hasColumn('phases', 'max_teams')) {
      await queryRunner.dropColumn('phases', 'max_teams');
    }
  }

  /**
   * Restores the former phase-based group assignment shape.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves when the migration is reverted.
   */
  async down(queryRunner: QueryRunner): Promise<void> {
    const teamsTable = await queryRunner.getTable('teams');
    const groupForeignKey = teamsTable?.foreignKeys.find(
      (foreignKey) =>
        foreignKey.columnNames.length === 1 &&
        foreignKey.columnNames[0] === 'group_id',
    );
    if (groupForeignKey) {
      await queryRunner.dropForeignKey('teams', groupForeignKey);
    }

    await queryRunner.addColumn(
      'phases',
      new TableColumn({
        name: 'letter_or_number',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'phases',
      new TableColumn({
        name: 'max_teams',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      UPDATE phases phase
      JOIN competition_groups group_data
        ON group_data.phase_id = phase.phase_id
      SET phase.letter_or_number = group_data.letter_or_number,
          phase.max_teams = group_data.max_teams
      WHERE phase.phase_type = 'GROUP'
    `);

    await queryRunner.addColumn(
      'teams',
      new TableColumn({
        name: 'legacy_group_id',
        type: 'int',
        isNullable: true,
      }),
    );
    await queryRunner.query(`
      UPDATE teams team
      JOIN competition_groups group_data
        ON group_data.group_id = team.group_id
      SET team.legacy_group_id = group_data.phase_id
    `);
    await queryRunner.dropColumn('teams', 'group_id');
    await queryRunner.renameColumn('teams', 'legacy_group_id', 'group_id');
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
    await queryRunner.dropTable('competition_groups');
  }
}
