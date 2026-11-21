import { API_BASE_URL } from "./config";
import { ApiError, messageFor, toApiError } from "./errors";
import { clearToken, getToken, notifySessionExpired } from "./session";

type Query = Record<string, string | number | boolean | null | undefined>;

export type RequestOptions = {
  body?: unknown;
  /** Paramètres d'URL, en snake_case comme dans le contrat (date_from, page_size…) */
  query?: Query;
  /** false pour les routes publiques (connexion) */
  auth?: boolean;
};

/** Construit l'URL complète en ignorant les paramètres vides */
export function buildUrl(path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(query ?? {})) {
    if (valeur !== undefined && valeur !== null && valeur !== "") params.set(cle, String(valeur));
  }
  const qs = params.toString();
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ""}`;
}

/**
 * Point de passage unique de tous les appels à l'API :
 * ajoute le jeton, envoie le JSON, traduit les erreurs (R46) et gère la session expirée.
 */
export async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, auth = true } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let reponse: Response;
  try {
    reponse = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", messageFor("NETWORK_ERROR"));
  }

  if (reponse.status === 204) return undefined as T;
  const contenu: unknown = await reponse.json().catch(() => null);

  if (!reponse.ok) {
    if (reponse.status === 401 && auth) {
      clearToken();
      notifySessionExpired();
    }
    throw toApiError(reponse.status, contenu);
  }
  return contenu as T;
}
