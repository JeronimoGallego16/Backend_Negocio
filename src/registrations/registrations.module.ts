import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '../teams/entities/team.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Registration } from './entities/registration.entity';
import { RegistrationMapper } from './mappers/registration.mapper';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsRepository } from './repositories/registrations.repository';
import { RegistrationsService } from './registrations.service';

/**
 * NestJS module for the registrations domain.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Registration, Tournament, Team])],
  controllers: [RegistrationsController],
  providers: [RegistrationsService, RegistrationMapper, RegistrationsRepository],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
