/**
 * Conservation du jeton d'accès renvoyé par POST /auth/login (contrat v1 : jeton Bearer).
 *
 * Le jeton est gardé en mémoire et dans sessionStorage (il disparaît à la fermeture de l'onglet).
 * Si l'équipe passe à un cookie httpOnly (R41 / TM-98), seul ce fichier et l'option
 * `credentials: "include"` de http.ts sont à modifier : les écrans ne changent pas.
 */
const CLE = "tm-access-token";
let jetonEnMemoire: string | null = null;

export function getToken(): string | null {
  if (jetonEnMemoire) return jetonEnMemoire;
  try {
    jetonEnMemoire = sessionStorage.getItem(CLE);
  } catch {
    /* stockage indisponible (rendu serveur, navigation privée stricte) */
  }
  return jetonEnMemoire;
}

export function setToken(token: string): void {
  jetonEnMemoire = token;
  try {
    sessionStorage.setItem(CLE, token);
  } catch {
    /* la valeur en mémoire suffit */
  }
}

export function clearToken(): void {
  jetonEnMemoire = null;
  try {
    sessionStorage.removeItem(CLE);
  } catch {
    /* rien à nettoyer */
  }
}

/* ---------- Session expirée ---------- */
type Ecouteur = () => void;
const ecouteurs = new Set<Ecouteur>();

/** Appelé quand l'API répond 401 : le layout s'abonne pour rediriger vers /connexion (TM-65) */
export function onSessionExpired(ecouteur: Ecouteur): () => void {
  ecouteurs.add(ecouteur);
  return () => ecouteurs.delete(ecouteur);
}

export function notifySessionExpired(): void {
  ecouteurs.forEach((ecouteur) => ecouteur());
}
