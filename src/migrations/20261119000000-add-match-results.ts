import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
} from 'typeorm';

/**
 * Adds match result and bracket fields.
 */
export class AddMatchResults20261119000000
  implements MigrationInterface
{

  /**
   * Applies tournament competition persistence enhancements.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves after schema changes.
   */
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('matches', [
      new TableColumn({
        name: 'home_score',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'away_score',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'round_name',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
      new TableColumn({
        name: 'bracket_position',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'next_match_id',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'is_third_place',
        type: 'boolean',
        default: 'false',
        isNullable: false,
      }),
      new TableColumn({
        name: 'result_registered',
        type: 'boolean',
        default: 'false',
        isNullable: false,
      }),
    ]);

  }

  /**
   * Reverts the competition persistence enhancements.
   *
   * @param queryRunner - TypeORM query runner.
   * @returns A promise that resolves after schema changes.
   */
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('matches', [
      'home_score',
      'away_score',
      'round_name',
      'bracket_position',
      'next_match_id',
      'is_third_place',
      'result_registered',
    ]);
  }
}
