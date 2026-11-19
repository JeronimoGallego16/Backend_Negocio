import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { TeamSport } from '../../team-sports/entities/team-sport.entity';

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

  @ManyToOne(() => Sport, (sport) => sport.subcategories, {
    cascade: false,
    nullable: true,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'parent_id', referencedColumnName: 'sportId' })
  parentSport?: Sport | null;

  @OneToMany(() => Sport, (sport) => sport.parentSport, { cascade: false })
  subcategories?: Sport[];

  @OneToMany(() => TeamSport, (teamSport) => teamSport.sport, {
    cascade: false,
  })
  teamSports?: TeamSport[];
}
