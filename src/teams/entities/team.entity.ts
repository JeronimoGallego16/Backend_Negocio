import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

/**
 * Database entity representing a tournament team.
 */
@Entity('teams')
@Unique('uq_teams_name_category', ['name', 'category'])
export class Team {
  @PrimaryGeneratedColumn({ name: 'team_id', type: 'int' })
  teamId!: number;

  @Column({ name: 'name', type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'category', type: 'varchar', length: 80 })
  category!: string;
}
