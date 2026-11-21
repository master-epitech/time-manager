/**
 * Configuration du client API, lue dans les variables d'environnement
 * (voir client/.env.example).
 */

/** Préfixe des routes : le proxy nginx redirige /api vers FastAPI */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

/**
 * true : le client répond avec les données factices de src/mocks.
 * Activé par défaut tant que le back n'est pas prêt ; passer à "false" pour utiliser l'API réelle.
 */
export const USE_MOCK_API = process.env.NEXT_PUBLIC_API_MOCK !== "false";
