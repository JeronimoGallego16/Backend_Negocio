import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Annotation } from '../entities/annotation.entity';

@Injectable()
export class AnnotationsRepository {
  constructor(
    @InjectRepository(Annotation)
    private readonly annotationRepository: Repository<Annotation>,
  ) {}

  findByMatch(matchId: number): Promise<Annotation[]> {
    return this.annotationRepository.find({
      where: { matchId },
      relations: { player: true },
      order: { minute: 'ASC' },
    });
  }

  findOneWithPlayer(annotationId: number): Promise<Annotation | null> {
    return this.annotationRepository.findOne({
      where: { annotationId },
      relations: { player: true },
    });
  }
}
