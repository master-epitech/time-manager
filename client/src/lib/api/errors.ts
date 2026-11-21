import type { ApiErrorBody } from "./types";

/**
 * Erreur renvoyée par le client API, quelle que soit sa cause
 * (réponse d'erreur de l'API, réseau coupé, réponse illisible).
 * Les écrans affichent `message`, déjà traduit en français.
 */
export class ApiError extends Error {
  constructor(
    /** Code HTTP ; 0 si le serveur n'a pas pu être joint */
    readonly status: number,
    /** Code métier stable, ex. POINTAGE_ALREADY_OPEN (R46) */
    readonly code: string,
    message: string,
    readonly details?: unknown,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Messages affichés à l'utilisateur pour chaque code d'erreur connu.
 * À compléter avec la liste des codes fournie par le back.
 */
const MESSAGES: Record<string, string> = {
  NETWORK_ERROR: "Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez.",
  INVALID_CREDENTIALS: "Email ou mot de passe incorrect.",
  UNAUTHORIZED: "Votre session a expiré. Reconnectez-vous.",
  FORBIDDEN: "Vous n'avez pas les droits pour effectuer cette action.",
  NOT_FOUND: "Élément introuvable.",
  VALIDATION_ERROR: "Certaines informations sont invalides. Vérifiez le formulaire.",
  RATE_LIMITED: "Trop de tentatives. Patientez quelques minutes avant de réessayer.",
  POINTAGE_ALREADY_OPEN: "Vous avez déjà pointé votre arrivée.",
  POINTAGE_NO_OPEN_SESSION: "Vous devez pointer votre arrivée avant votre départ.",
  EMAIL_DOMAIN_NOT_ALLOWED: "L'adresse email doit appartenir au domaine de l'entreprise.",
};

/** Code utilisé quand le code HTTP ne suffit pas à identifier l'erreur */
const CODE_PAR_STATUT: Record<number, string> = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  422: "VALIDATION_ERROR",
  429: "RATE_LIMITED",
};

export function messageFor(code: string): string {
  return MESSAGES[code] ?? "Une erreur inattendue est survenue. Réessayez plus tard.";
}

function isApiErrorBody(body: unknown): body is ApiErrorBody {
  return typeof body === "object" && body !== null && "error" in body && typeof (body as ApiErrorBody).error?.code === "string";
}

/** Transforme une réponse d'erreur de l'API (format R46) en ApiError */
export function toApiError(status: number, body: unknown): ApiError {
  if (isApiErrorBody(body)) {
    const { code, details } = body.error;
    return new ApiError(status, code, messageFor(code), details, body.requestId);
  }
  const code = CODE_PAR_STATUT[status] ?? "UNKNOWN_ERROR";
  return new ApiError(status, code, messageFor(code));
}
