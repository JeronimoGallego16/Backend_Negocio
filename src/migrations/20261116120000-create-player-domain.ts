import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlayerDomain20261116120000 implements MigrationInterface {
  name = 'CreatePlayerDomain20261116120000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE players (
        id_jugador INT NOT NULL AUTO_INCREMENT,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        fecha_nacimiento DATE NOT NULL,
        genero ENUM(
          'MASCULINO',
          'FEMENINO',
          'OTRO',
          'PREFIERO_NO_DECIR'
        ) NOT NULL,
        correo VARCHAR(150) NOT NULL,
        identificacion VARCHAR(30) NOT NULL,
        activo TINYINT(1) NOT NULL DEFAULT 1,
        PRIMARY KEY (id_jugador),
        UNIQUE KEY uq_players_correo (correo),
        UNIQUE KEY uq_players_identificacion (identificacion)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE skills (
        id_habilidad INT NOT NULL AUTO_INCREMENT,
        nombre VARCHAR(100) NOT NULL,
        descripcion VARCHAR(255) NULL,
        PRIMARY KEY (id_habilidad),
        UNIQUE KEY uq_skills_nombre (nombre)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE player_skills (
        id_habilidad_jugador INT NOT NULL AUTO_INCREMENT,
        nivel TINYINT UNSIGNED NOT NULL,
        observaciones VARCHAR(500) NULL,
        id_jugador INT NOT NULL,
        id_habilidad INT NOT NULL,
        PRIMARY KEY (id_habilidad_jugador),
        UNIQUE KEY uq_player_skills_player_skill (id_jugador, id_habilidad),
        CONSTRAINT chk_player_skills_nivel CHECK (nivel BETWEEN 1 AND 5),
        CONSTRAINT fk_player_skills_jugador FOREIGN KEY (id_jugador)
          REFERENCES players (id_jugador) ON DELETE RESTRICT,
        CONSTRAINT fk_player_skills_habilidad FOREIGN KEY (id_habilidad)
          REFERENCES skills (id_habilidad) ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE player_teams (
        id_historial INT NOT NULL AUTO_INCREMENT,
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE NULL,
        id_jugador INT NOT NULL,
        id_equipo INT NOT NULL,
        jugador_vigente_id INT
          GENERATED ALWAYS AS (
            CASE WHEN fecha_fin IS NULL THEN id_jugador ELSE NULL END
          ) VIRTUAL,
        PRIMARY KEY (id_historial),
        UNIQUE KEY uq_player_teams_period (id_jugador, id_equipo, fecha_inicio),
        UNIQUE KEY uq_player_teams_one_active (jugador_vigente_id),
        CONSTRAINT fk_player_teams_jugador FOREIGN KEY (id_jugador)
          REFERENCES players (id_jugador) ON DELETE RESTRICT,
        CONSTRAINT fk_player_teams_equipo FOREIGN KEY (id_equipo)
          REFERENCES teams (team_id) ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE annotations (
        id_anotacion INT NOT NULL AUTO_INCREMENT,
        id_partido INT NOT NULL,
        minuto SMALLINT UNSIGNED NOT NULL,
        tipo VARCHAR(30) NOT NULL,
        anulado TINYINT(1) NOT NULL DEFAULT 0,
        id_jugador INT NOT NULL,
        PRIMARY KEY (id_anotacion),
        KEY idx_annotations_partido (id_partido),
        KEY idx_annotations_jugador (id_jugador),
        CONSTRAINT fk_annotations_partido FOREIGN KEY (id_partido)
          REFERENCES matches (match_id) ON DELETE RESTRICT,
        CONSTRAINT fk_annotations_jugador FOREIGN KEY (id_jugador)
          REFERENCES players (id_jugador) ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE annotations');
    await queryRunner.query('DROP TABLE player_teams');
    await queryRunner.query('DROP TABLE player_skills');
    await queryRunner.query('DROP TABLE skills');
    await queryRunner.query('DROP TABLE players');
  }
}
