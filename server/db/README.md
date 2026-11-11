# Base de données · Time Manager v1 (MVP)

`trinity_market_db-4.sql` est le schéma PostgreSQL de référence de l'API v1 :
tables, contraintes, index, vues et données de démonstration.

Cible : **PostgreSQL 15+** (testé sur PostgreSQL 16). L'organisation est
mono-tenant (`organisation`), avec RBAC par profils et features.

## Domaines couverts

- `organisation`, `department`, `team`, responsables ;
- `user`, `profile`, `feature`, `user_profile` ;
- `work_schedule`, jours fériés, télétravail ;
- `clock_event` (pointage), `anomaly`, `correction_request` ;
- `absence_type`, `absence`, `leave_balance` ;
- `notification`, `app_config` et vues de dashboard/export.

## Créer la base

```bash
createdb time_manager
psql -d time_manager -f server/db/trinity_market_db-4.sql
```

Le script est idempotent (`CREATE ... IF NOT EXISTS`, `ON CONFLICT DO NOTHING`)
et peut donc être rejoué sur une base existante.

## Données de démonstration

Le fichier contient un jeu de données de démo (organisation `TRINITY`,
profils, équipes, comptes, pointages, absences…). Les mots de passe sont des
placeholders `$argon2id$HASH_*` : ils doivent être remplacés par de vrais
hashes Argon2id avant toute utilisation hors démo.

Le contrat API correspondant se trouve dans [`docs/api/`](../../docs/api/).
