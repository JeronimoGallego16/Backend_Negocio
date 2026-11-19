import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sport } from '../entities/sport.entity';

/**
 * Repository for sport-specific duplicate checks.
 */
@Injectable()
export class SportsRepository {
  /**
   * Creates the sport repository wrapper.
   *
   * @param sportRepository - TypeORM repository for sports.
   */
  constructor(
    @InjectRepository(Sport)
    private readonly sportRepository: Repository<Sport>,
  ) {}

  /**
   * Checks whether another sport has the supplied name.
   *
   * @param name - Sport name to search for.
   * @param excludedSportId - Sport ID excluded during updates.
   * @returns Whether a matching sport exists.
   */
  async existsByName(name: string, excludedSportId?: number): Promise<boolean> {
    const query = this.sportRepository
      .createQueryBuilder('sport')
      .where('sport.name = :name', { name });

    if (excludedSportId !== undefined) {
      query.andWhere('sport.sportId != :excludedSportId', { excludedSportId });
    }

    return (await query.getCount()) > 0;
  }

  /**
   * Checks whether a sport has subcategories.
   *
   * @param sportId - Parent sport identifier.
   * @returns Whether at least one subcategory refers to the sport.
   */
  async hasSubcategories(sportId: number): Promise<boolean> {
    const count = await this.sportRepository
      .createQueryBuilder('subcategory')
      .innerJoin('subcategory.parentSport', 'parentSport')
      .where('parentSport.sportId = :sportId', { sportId })
      .getCount();

    return count > 0;
  }
}
