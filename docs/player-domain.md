# Player domain

The player-related API is organized into five feature areas:

- `src/players`: player records and profile aggregation.
- `src/skills`: skill records and their CRUD operations.
- `src/player-skills`: the relationship between players and skills, including
  level and observations.
- `src/player-teams`: player-team membership history.
- `src/annotations`: match annotations.

The profile module composes player, player-skill, and team services without
making those feature modules depend on one another. The player-skill module
depends on the independent skills module to validate skill references.

## Routes

| Method             | Route                                         | Purpose                                    |
| ------------------ | --------------------------------------------- | ------------------------------------------ |
| POST, GET          | `/api/players`                                    | Create or list players                     |
| GET, PATCH, DELETE | `/api/players/:id`                                | Read, update, or remove a player           |
| GET                | `/api/players/:id/profile`                        | Read a player with skills and team history |
| POST, GET          | `/api/skills`                                     | Create or list skills                      |
| GET, PATCH, DELETE | `/api/skills/:id`                                | Read, update, or remove a skill            |
| POST, GET          | `/api/players/:playerId/skills`                   | Assign or list a player's skills           |
| PATCH, DELETE      | `/api/players/:playerId/skills/:skillId`          | Update or remove an assignment             |
| GET                | `/api/skills/:skillId/players`                    | List players assigned to a skill           |
| POST, GET          | `/api/teams/:teamId/players`                      | Assign or list a team's players            |
| PATCH              | `/api/teams/:teamId/players/:playerId/retirement` | End an active membership                   |
| GET                | `/api/players/:playerId/teams`                    | Read a player's team history               |
| POST, GET          | `/api/matches/:matchId/annotations`               | Create or list match annotations           |
| PATCH, DELETE      | `/api/annotations/:annotationId`                  | Update or void an annotation               |

All routes remain protected by the application's global security guard.

## Database migration

The initial player-domain migration creates all player-domain tables and
columns in English. This project has `synchronize: false`; starting the server
does not create tables automatically. After creating the empty database and
configuring its connection in `.env`, apply the migrations:

```bash
npx typeorm-ts-node-commonjs migration:run -d typeorm.config.ts
```

To reverse the latest migration:

```bash
npx typeorm-ts-node-commonjs migration:revert -d typeorm.config.ts
```
