import * as mocks from "@/mocks";
import { ApiError, messageFor } from "./errors";
import type { ApiClient } from "./client";
import { clearToken, getToken, setToken } from "./session";
import type { ClockEvent, MeContext, WorkSession } from "./types";

/**
 * Implémentation factice du client API (mode NEXT_PUBLIC_API_MOCK=true).
 * Elle répond avec les données de src/mocks et applique les mêmes règles que le back
 * (double pointage interdit, R13), pour que les écrans se comportent comme en vrai.
 *
 * Comptes de démonstration (n'importe quel mot de passe non vide) :
 * - lea.dubois@trinity-market.example   → employée
 * - karim.benali@trinity-market.example → manager
 */
// Petit délai pour imiter le réseau ; aucun pendant les tests
const LATENCE_MS = process.env.NODE_ENV === "test" ? 0 : 250;
const attendre = () => new Promise((r) => setTimeout(r, LATENCE_MS));

const COMPTES: Record<string, MeContext> = {
  [mocks.LEA.email]: mocks.ME_EMPLOYE,
  [mocks.KARIM.email]: mocks.ME_MANAGER,
};

/* État modifiable pendant la session (repart des données factices au rechargement) */
let sessions: WorkSession[] = mocks.SESSIONS_EQUIPE.map((s) => ({ ...s }));

function erreur(status: number, code: string): ApiError {
  return new ApiError(status, code, messageFor(code));
}

/** Retrouve l'utilisateur connecté à partir du jeton factice ; 401 sinon */
function utilisateurConnecte(): MeContext {
  const token = getToken();
  const me = Object.values(COMPTES).find((c) => token === `mock-${c.user.id}`);
  if (!me) throw erreur(401, "UNAUTHORIZED");
  return me;
}

const liste = <T>(data: T[]) => ({ data });
const duMoi = <T extends { userId: string }>(items: T[], userId: string) => items.filter((i) => i.userId === userId);

export const mockClient: ApiClient = {
  auth: {
    async login({ email, password }) {
      await attendre();
      const compte = COMPTES[email.trim().toLowerCase()];
      if (!compte || !password) throw erreur(401, "INVALID_CREDENTIALS");
      setToken(`mock-${compte.user.id}`);
    },
    async logout() {
      clearToken();
    },
    async me() {
      await attendre();
      return utilisateurConnecte();
    },
  },

  clock: {
    async punch(type) {
      await attendre();
      const { user } = utilisateurConnecte();
      const maintenant = new Date().toISOString();
      const ouverte = sessions.find((s) => s.userId === user.id && s.status === "OPEN");

      if (type === "ENTREE") {
        if (ouverte) throw erreur(409, "POINTAGE_ALREADY_OPEN");
        sessions.push({
          userId: user.id,
          teamId: user.teamId,
          workDate: maintenant.slice(0, 10),
          entryAt: maintenant,
          exitAt: null,
          minutes: 0,
          status: "OPEN",
          workMode: "BUREAU",
        });
      } else {
        if (!ouverte) throw erreur(409, "POINTAGE_NO_OPEN_SESSION");
        sessions = sessions.map((s) =>
          s === ouverte
            ? {
                ...s,
                exitAt: maintenant,
                status: "COMPLETE",
                minutes: Math.round((Date.parse(maintenant) - Date.parse(s.entryAt)) / 60000),
              }
            : s,
        );
      }

      const evenement: ClockEvent = {
        id: crypto.randomUUID(),
        userId: user.id,
        teamId: user.teamId,
        type,
        workMode: "BUREAU",
        occurredAt: maintenant,
        source: "WEB",
        status: "VALIDE",
      };
      return evenement;
    },
    async mySessions({ from, to }) {
      await attendre();
      const { user } = utilisateurConnecte();
      return liste(duMoi(sessions, user.id).filter((s) => s.workDate >= from && s.workDate <= to));
    },
  },

  absences: {
    async mine() {
      await attendre();
      return liste(duMoi(mocks.ABSENCES, utilisateurConnecte().user.id));
    },
    async myBalances(period) {
      await attendre();
      const { user } = utilisateurConnecte();
      return liste(duMoi(mocks.SOLDES_LEA, user.id).filter((s) => s.period === period));
    },
    async types() {
      await attendre();
      return liste(mocks.TYPES_ABSENCE);
    },
    async request(absence) {
      await attendre();
      const { user } = utilisateurConnecte();
      const type = mocks.TYPES_ABSENCE.find((t) => t.id === absence.typeId);
      if (!type || absence.endDate < absence.startDate) throw erreur(400, "VALIDATION_ERROR");
      return {
        id: crypto.randomUUID(),
        userId: user.id,
        typeId: type.id,
        typeCode: type.code,
        typeLabel: type.label,
        startDate: absence.startDate,
        endDate: absence.endDate,
        reason: absence.reason ?? null,
        status: "EN_ATTENTE",
        daysCount: 1 + Math.round((Date.parse(absence.endDate) - Date.parse(absence.startDate)) / 86_400_000),
      };
    },
  },

  anomalies: {
    async mine() {
      await attendre();
      return liste(duMoi(mocks.ANOMALIES, utilisateurConnecte().user.id));
    },
    async myCorrections() {
      await attendre();
      return liste(duMoi(mocks.CORRECTIONS, utilisateurConnecte().user.id));
    },
    async requestCorrection(correction) {
      await attendre();
      const { user } = utilisateurConnecte();
      return { id: crypto.randomUUID(), userId: user.id, ...correction, status: "EN_ATTENTE" };
    },
  },

  dashboard: {
    async me() {
      await attendre();
      utilisateurConnecte();
      return mocks.KPIS_LEA;
    },
    async team() {
      await attendre();
      utilisateurConnecte();
      return mocks.KPIS_EQUIPE;
    },
  },

  notifications: {
    async list() {
      await attendre();
      utilisateurConnecte();
      return mocks.NOTIFICATIONS_LEA;
    },
  },
};

/** Remet les données factices dans leur état initial (utile pour les tests) */
export function resetMockData(): void {
  sessions = mocks.SESSIONS_EQUIPE.map((s) => ({ ...s }));
}
