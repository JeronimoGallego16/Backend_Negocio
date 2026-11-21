import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

/**
 * Creates tournament phases, phase subtypes and group-team assignments.
 */
export class CreatePhasesAndGroupTeams20261117120000
  implements MigrationInterface
{
  name = 'CreatePhasesAndGroupTeams20261117120000';

  /**
   * Creates phase and group assignment structures.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves when the structures are created.
   */
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'phases',
        columns: [
          {
            name: 'phase_id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', length: '150', isNullable: false },
          { name: 'phase_order', type: 'int', isNullable: false },
          { name: 'tournament_id', type: 'int', isNullable: false },
          { name: 'phase_type', type: 'varchar', length: '20', isNullable: false },
          { name: 'letter_or_number', type: 'varchar', length: '20', isNullable: true },
          { name: 'max_teams', type: 'int', isNullable: true },
          { name: 'is_third_place', type: 'boolean', default: 'false', isNullable: false },
        ],
        uniques: [
          {
            name: 'uq_phases_tournament_order',
            columnNames: ['tournament_id', 'phase_order'],
          },
        ],
        foreignKeys: [
          {
            name: 'fk_phases_tournament',
            columnNames: ['tournament_id'],
            referencedTableName: 'tournaments',
            referencedColumnNames: ['tournament_id'],
            onDelete: 'NO ACTION',
          },
        ],
      }),
    );

    await queryRunner.addColumn(
      'matches',
      new TableColumn({ name: 'phase_id', type: 'int', isNullable: true }),
    );
    await queryRunner.createForeignKey(
      'matches',
      new TableForeignKey({
        name: 'fk_matches_phase',
        columnNames: ['phase_id'],
        referencedTableName: 'phases',
        referencedColumnNames: ['phase_id'],
        onDelete: 'NO ACTION',
      }),
    );
  }

  /**
   * Removes phase and match relationships.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves when structures are removed.
   */
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('matches', 'fk_matches_phase');
    await queryRunner.dropColumn('matches', 'phase_id');
    await queryRunner.dropTable('phases');
  }
}
