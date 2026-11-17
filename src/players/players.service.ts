import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationErrors } from '../common/errors/application-error';
import { PlayerDto } from './dto/player.dto';
import { PlayerResponseDto } from './dto/player-response.dto';
import { Player } from './entities/player.entity';
import { PlayerMapper } from './mappers/player.mapper';
import { PlayersRepository } from './repositories/players.repository';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    private readonly playersRepository: PlayersRepository,
    private readonly playerMapper: PlayerMapper,
  ) {}

  async create(dto: PlayerDto): Promise<PlayerResponseDto> {
    if (
      !dto.name?.trim() ||
      !dto.lastName?.trim() ||
      !dto.birthDate ||
      !dto.gender ||
      !dto.email?.trim() ||
      !dto.identification?.trim()
    ) {
      throw ApplicationErrors.invalidInput(
        'name, lastName, birthDate, gender, email and identification are required for create',
      );
    }

    if (dto.birthDate > this.today()) {
      throw ApplicationErrors.invalidInput('birthDate cannot be in the future');
    }

    if (
      await this.playersRepository.existsByIdentification(dto.identification)
    ) {
      throw ApplicationErrors.conflict(
        'A player with this identification already exists',
      );
    }

    if (await this.playersRepository.existsByEmail(dto.email)) {
      throw ApplicationErrors.conflict(
        'A player with this email already exists',
      );
    }

    const saved = await this.playerRepository.save(
      this.playerMapper.toEntity(dto),
    );
    return this.playerMapper.toResponseDto(saved);
  }

  async findAll(): Promise<PlayerResponseDto[]> {
    const players = await this.playerRepository.find();
    return this.playerMapper.toResponseDtoList(players);
  }

  async findOne(id: number): Promise<PlayerResponseDto> {
    return this.playerMapper.toResponseDto(await this.findEntity(id));
  }

  async update(id: number, dto: PlayerDto): Promise<PlayerResponseDto> {
    const player = await this.findEntity(id);
    const merged = this.playerMapper.mergeEntity(player, dto);

    if (merged.birthDate > this.today()) {
      throw ApplicationErrors.invalidInput('birthDate cannot be in the future');
    }

    if (
      await this.playersRepository.existsByIdentification(
        merged.identification,
        id,
      )
    ) {
      throw ApplicationErrors.conflict(
        'A player with this identification already exists',
      );
    }

    if (await this.playersRepository.existsByEmail(merged.email, id)) {
      throw ApplicationErrors.conflict(
        'A player with this email already exists',
      );
    }

    const saved = await this.playerRepository.save(merged);
    return this.playerMapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<void> {
    const player = await this.findEntity(id);

    if (await this.playersRepository.hasAssociatedData(id)) {
      throw ApplicationErrors.conflict(
        'The player has associated skills, teams or scoring records and cannot be deleted; deactivate it instead',
      );
    }

    await this.playerRepository.remove(player);
  }

  private async findEntity(id: number): Promise<Player> {
    const player = await this.playerRepository.findOne({
      where: { playerId: id },
    });
    if (!player) {
      throw ApplicationErrors.notFound(`Player with id ${id} not found`);
    }
    return player;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
