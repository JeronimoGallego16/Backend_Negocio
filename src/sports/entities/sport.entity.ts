import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

/**
 * Database entity representing a sport.
 */
@Entity('sports')
@Unique('uq_sports_name', ['name'])
export class Sport {
  @PrimaryGeneratedColumn({ name: 'sport_id', type: 'int' })
  sportId!: number;

  @Column({ name: 'name', type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'description', type: 'text' })
  description!: string;
}
