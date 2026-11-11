# Contrat API · Time Manager v1 (MVP)

Contrat de référence de l'API v1, au format **collection Postman v3** (YAML, un
dossier par domaine et un fichier par requête). Il est aligné sur le schéma
PostgreSQL de [`server/db/trinity_market_db-4.sql`](../../server/db/trinity_market_db-4.sql).

## Importer dans Postman

1. Ouvrir Postman → **Import**.
2. Choisir **Folder** et sélectionner ce dossier `docs/api/`.
3. Vérifier la variable `base_url` dans les variables de collection, puis
   renseigner `access_token` après connexion.

La collection est aussi lisible dans un éditeur : chaque requête est dans un
`*.request.yaml`, et ses exemples de réponse dans le dossier `.resources/`
associé.

## Conventions

- Authentification : `Authorization: Bearer {{access_token}}`.
- Variables de chemin et de requête en `snake_case` (`user_id`, `team_id`,
  `date_from`, `page_size`).
- Champs JSON en `camelCase`, alignés sur les colonnes SQL (`first_name` →
  `firstName`, `start_date` → `startDate`).
- Pagination : `page` / `page_size` (maximum 100).
- Erreurs : `{ "error": { "code", "message", "details?" }, "requestId" }`.

## Périmètre

Auth, organisation mono-tenant, départements, équipes, comptes et profils,
pointage, absences et soldes, planning et télétravail, référentiels,
anomalies et corrections, dashboard, notifications, exports CSV.

Hors v1 : code de pointage, score de confiance, mode dégradé,
multi-organisations, audit, RGPD, appareils, plages IP, OTP.
