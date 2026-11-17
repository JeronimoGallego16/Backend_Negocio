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
| POST, GET          | `/players`                                    | Create or list players                     |
| GET, PATCH, DELETE | `/players/:id`                                | Read, update, or remove a player           |
| GET                | `/players/:id/profile`                        | Read a player with skills and team history |
| POST, GET          | `/skills`                                     | Create or list skills                      |
| GET, PATCH, DELETE | `/skills/:id`                                 | Read, update, or remove a skill            |
| POST, GET          | `/players/:playerId/skills`                   | Assign or list a player's skills           |
| PATCH, DELETE      | `/players/:playerId/skills/:skillId`          | Update or remove an assignment             |
| GET                | `/skills/:skillId/players`                    | List players assigned to a skill           |
| POST, GET          | `/teams/:teamId/players`                      | Assign or list a team's players            |
| PATCH              | `/teams/:teamId/players/:playerId/retirement` | End an active membership                   |
| GET                | `/players/:playerId/teams`                    | Read a player's team history               |
| POST, GET          | `/matches/:matchId/annotations`               | Create or list match annotations           |
| PATCH, DELETE      | `/annotations/:annotationId`                  | Update or void an annotation               |

All routes remain protected by the application's global security guard.

## Database migration

The original player-domain migration is retained to preserve migration history.
The follow-up migration `TranslatePlayerDomainColumns20261117120000` renames
Spanish database columns and gender values to English while retaining existing
records. Run pending migrations only after configuring the MySQL connection in
`.env`:

```bash
npx typeorm-ts-node-commonjs migration:run -d typeorm.config.ts
```

To reverse the latest migration:

```bash
npx typeorm-ts-node-commonjs migration:revert -d typeorm.config.ts
```
