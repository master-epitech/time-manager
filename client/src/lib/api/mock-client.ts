import * as mocks from "@/mocks";
import { ApiError, messageFor } from "./errors";
import type { ApiClient } from "./client";
import { clearToken, getToken, setToken } from "./session";
import type { ClockEvent, MeContext, Team, User, WorkSession } from "./types";

/**
 * Implémentation factice du client API (mode NEXT_PUBLIC_API_MOCK=true).
 * Elle répond avec les données de src/mocks et applique les mêmes règles que le back
 * (double pointage interdit, R13), pour que les écrans se comportent comme en vrai.
 *
 * Comptes de démonstration (n'importe quel mot de passe non vide) :
 * - lea.dubois@trinity-market.example   → employée
 * - karim.benali@trinity-market.example → manager
 * - claire.fontaine@trinity-market.example → RH (gère tous les comptes)
 */
// Petit délai pour imiter le réseau ; aucun pendant les tests
const LATENCE_MS = process.env.NODE_ENV === "test" ? 0 : 250;
const attendre = () => new Promise((r) => setTimeout(r, LATENCE_MS));

const COMPTES: Record<string, MeContext> = {
  [mocks.LEA.email]: mocks.ME_EMPLOYE,
  [mocks.KARIM.email]: mocks.ME_MANAGER,
  [mocks.CLAIRE.email]: mocks.ME_RH,
};

/* État modifiable pendant la session (repart des données factices au rechargement) */
let sessions: WorkSession[] = mocks.SESSIONS_EQUIPE.map((s) => ({ ...s }));
let utilisateurs: User[] = mocks.UTILISATEURS.map((u) => ({ ...u }));
let equipesBrutes: Team[] = mocks.EQUIPES.map((e) => ({ ...e }));

function erreur(status: number, code: string, details?: unknown): ApiError {
  return new ApiError(status, code, messageFor(code), details);
}

/** Retrouve l'utilisateur connecté à partir du jeton factice ; 401 sinon */
function utilisateurConnecte(): MeContext {
  const token = getToken();
  const me = Object.values(COMPTES).find((c) => token === `mock-${c.user.id}`);
  if (!me) throw erreur(401, "UNAUTHORIZED");
  return me;
}

const liste = <T>(data: T[]) => ({ data });

/* ---------- Règles de gestion des comptes (mêmes règles que le back) ---------- */

/** Profils qui gèrent TOUS les comptes ; le manager ne gère que ses équipes (SOCLE) */
const GESTION_COMPLETE = ["HR", "SUPER_ADMIN"];

/** Équipes que l'utilisateur connecté peut gérer ; null = toutes */
function equipesGerees(me: MeContext): string[] | null {
  const profil = me.activeProfile.code;
  if (GESTION_COMPLETE.includes(profil)) return null;
  if (profil === "MANAGER") return equipesBrutes.filter((e) => e.manager?.id === me.user.id).map((e) => e.id);
  throw erreur(403, "FORBIDDEN");
}

/** Vérifie que le compte est dans le périmètre de l'utilisateur connecté */
function compteGere(id: string): User {
  const perimetre = equipesGerees(utilisateurConnecte());
  const compte = utilisateurs.find((u) => u.id === id);
  if (!compte) throw erreur(404, "NOT_FOUND");
  if (perimetre && !perimetre.includes(compte.teamId ?? "")) throw erreur(403, "FORBIDDEN");
  return compte;
}

function remplacer(compte: User): User {
  utilisateurs = utilisateurs.map((u) => (u.id === compte.id ? compte : u));
  return compte;
}

/** Équipes avec le nombre de membres actifs recalculé */
function equipes(): Team[] {
  return equipesBrutes.map((e) => ({
    ...e,
    membersCount: utilisateurs.filter((u) => u.teamId === e.id && u.isActive).length,
  }));
}

/** Équipe existante que l'utilisateur connecté peut gérer (membres) ; 403/404 sinon */
function equipeGeree(id: string): Team {
  const perimetre = equipesGerees(utilisateurConnecte());
  const equipe = equipesBrutes.find((e) => e.id === id);
  if (!equipe) throw erreur(404, "NOT_FOUND");
  if (perimetre && !perimetre.includes(id)) throw erreur(403, "FORBIDDEN");
  return equipe;
}

/** Créer, renommer, désactiver une équipe ou nommer son responsable : RH et administrateurs seulement */
function verifierGestionComplete(): void {
  if (equipesGerees(utilisateurConnecte()) !== null) throw erreur(403, "FORBIDDEN");
}

/** Rattache un compte à une équipe (ou le détache avec null) */
function rattacher(userId: string, equipe: Team | null): void {
  const departement = equipe ? mocks.DEPARTEMENTS.find((d) => d.id === equipe.departmentId) : undefined;
  utilisateurs = utilisateurs.map((u) =>
    u.id === userId
      ? {
          ...u,
          teamId: equipe?.id ?? null,
          teamName: equipe?.name ?? null,
          departmentId: departement?.id ?? u.departmentId,
          departmentName: departement?.name ?? u.departmentName,
        }
      : u,
  );
}

/** Prochain matricule : TM-<année>-<numéro sur 5 chiffres>, unique et jamais réutilisé */
function prochainMatricule(): string {
  const max = Math.max(...utilisateurs.map((u) => Number(u.matricule.split("-")[2]) || 0));
  return `${mocks.ORGANISATION.matriculePrefix}-${new Date().getFullYear()}-${String(max + 1).padStart(5, "0")}`;
}

const sansAccents = (texte: string) => texte.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
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

  users: {
    async list(f = {}) {
      await attendre();
      const perimetre = equipesGerees(utilisateurConnecte());
      const recherche = sansAccents(f.q?.trim() ?? "");
      const resultats = utilisateurs
        .filter((u) => !perimetre || perimetre.includes(u.teamId ?? ""))
        .filter((u) => !f.status || u.status === f.status)
        .filter((u) => !f.profileCode || u.profileCodes.includes(f.profileCode))
        .filter((u) => !f.teamId || u.teamId === f.teamId)
        .filter((u) => !f.departmentId || u.departmentId === f.departmentId)
        .filter(
          (u) =>
            !recherche ||
            [u.firstName, u.lastName, u.email, u.matricule, u.jobTitle ?? ""].some((champ) =>
              sansAccents(champ).includes(recherche),
            ),
        )
        .sort((a, b) => a.lastName.localeCompare(b.lastName, "fr"));
      const page = f.page ?? 1;
      const pageSize = Math.min(f.pageSize ?? 20, 100);
      return {
        data: resultats.slice((page - 1) * pageSize, page * pageSize),
        meta: { page, pageSize, total: resultats.length, totalPages: Math.max(1, Math.ceil(resultats.length / pageSize)) },
      };
    },
    async get(id) {
      await attendre();
      return compteGere(id);
    },
    async create(nouveau) {
      await attendre();
      const me = utilisateurConnecte();
      const perimetre = equipesGerees(me);
      const email = nouveau.email.trim().toLowerCase();

      const details = [
        !nouveau.firstName.trim() && { field: "firstName", message: "Prénom obligatoire" },
        !nouveau.lastName.trim() && { field: "lastName", message: "Nom obligatoire" },
        !email && { field: "email", message: "Email obligatoire" },
      ].filter(Boolean);
      if (details.length > 0) throw erreur(400, "VALIDATION_ERROR", details);
      if (!email.endsWith(`@${mocks.ORGANISATION.emailDomain}`)) throw erreur(422, "EMAIL_DOMAIN_NOT_ALLOWED");
      if (utilisateurs.some((u) => u.email === email)) throw erreur(409, "EMAIL_ALREADY_USED");
      // Le manager ne crée que des employés, dans ses propres équipes
      if (perimetre && (!nouveau.teamId || !perimetre.includes(nouveau.teamId) || nouveau.profileCode !== "EMPLOYEE")) {
        throw erreur(403, "FORBIDDEN");
      }

      const equipe = equipesBrutes.find((e) => e.id === nouveau.teamId && e.isActive);
      const departement = mocks.DEPARTEMENTS.find((d) => d.id === (nouveau.departmentId ?? equipe?.departmentId));
      const authProvider = nouveau.authProvider ?? "MICROSOFT";
      const compte: User = {
        id: crypto.randomUUID(),
        firstName: nouveau.firstName.trim(),
        lastName: nouveau.lastName.trim(),
        email,
        matricule: prochainMatricule(),
        status: "ACTIF",
        isActive: true,
        phone: nouveau.phone ?? null,
        contractType: nouveau.contractType ?? "CDI",
        hireDate: nouveau.hireDate ?? new Date().toISOString().slice(0, 10),
        jobTitle: nouveau.jobTitle ?? null,
        departmentId: departement?.id ?? null,
        departmentName: departement?.name ?? null,
        teamId: equipe?.id ?? null,
        teamName: equipe?.name ?? null,
        profileCodes: [nouveau.profileCode],
        authProvider,
        invitationStatus: authProvider !== "PASSWORD" && nouveau.sendMicrosoftInvitation ? "PENDING" : "NONE",
      };
      utilisateurs = [...utilisateurs, compte];
      return compte;
    },
    async update(id, modifications) {
      await attendre();
      const compte = compteGere(id);
      const email = modifications.email?.trim().toLowerCase();
      if (email && !email.endsWith(`@${mocks.ORGANISATION.emailDomain}`)) throw erreur(422, "EMAIL_DOMAIN_NOT_ALLOWED");
      if (email && utilisateurs.some((u) => u.email === email && u.id !== id)) throw erreur(409, "EMAIL_ALREADY_USED");
      return remplacer({ ...compte, ...modifications, ...(email ? { email } : {}) });
    },
    async assign(id, affectation) {
      await attendre();
      const compte = compteGere(id);
      const perimetre = equipesGerees(utilisateurConnecte());
      if (perimetre && !perimetre.includes(affectation.teamId ?? "")) throw erreur(403, "FORBIDDEN");
      const equipe = equipesBrutes.find((e) => e.id === affectation.teamId && e.isActive);
      const departement = mocks.DEPARTEMENTS.find((d) => d.id === affectation.departmentId);
      if (!departement) throw erreur(400, "VALIDATION_ERROR");
      return remplacer({
        ...compte,
        departmentId: departement.id,
        departmentName: departement.name,
        teamId: equipe?.id ?? null,
        teamName: equipe?.name ?? null,
        jobTitle: affectation.jobTitle ?? compte.jobTitle,
      });
    },
    async deactivate(id) {
      await attendre();
      const compte = compteGere(id);
      if (compte.id === utilisateurConnecte().user.id) throw erreur(409, "CONFLICT"); // pas soi-même
      remplacer({ ...compte, isActive: false });
    },
    async activate(id) {
      await attendre();
      remplacer({ ...compteGere(id), isActive: true, status: "ACTIF", departureDate: null });
    },
  },

  teams: {
    async list(departmentId) {
      await attendre();
      utilisateurConnecte();
      return liste(equipes().filter((e) => !departmentId || e.departmentId === departmentId));
    },
    async create(nouvelle) {
      await attendre();
      verifierGestionComplete();
      const code = nouvelle.code.trim().toUpperCase();
      const details = [
        !code && { field: "code", message: "Code obligatoire" },
        !nouvelle.name.trim() && { field: "name", message: "Nom obligatoire" },
        !mocks.DEPARTEMENTS.some((d) => d.id === nouvelle.departmentId) && { field: "departmentId", message: "Département inconnu" },
      ].filter(Boolean);
      if (details.length > 0) throw erreur(400, "VALIDATION_ERROR", details);
      if (equipesBrutes.some((e) => e.code === code)) throw erreur(409, "TEAM_CODE_ALREADY_USED");
      const equipe: Team = {
        id: crypto.randomUUID(),
        departmentId: nouvelle.departmentId,
        code,
        name: nouvelle.name.trim(),
        isActive: true,
        membersCount: 0,
        manager: null,
      };
      equipesBrutes = [...equipesBrutes, equipe];
      return equipe;
    },
    async update(id, modifications) {
      await attendre();
      verifierGestionComplete();
      const equipe = equipeGeree(id);
      const modifiee = { ...equipe, ...modifications, ...(modifications.name ? { name: modifications.name.trim() } : {}) };
      equipesBrutes = equipesBrutes.map((e) => (e.id === id ? modifiee : e));
      // Le nom de l'équipe est recopié sur les comptes de ses membres
      utilisateurs = utilisateurs.map((u) => (u.teamId === id ? { ...u, teamName: modifiee.name } : u));
      return equipes().find((e) => e.id === id)!;
    },
    async deactivate(id) {
      await attendre();
      verifierGestionComplete();
      equipeGeree(id);
      if (utilisateurs.some((u) => u.teamId === id && u.isActive)) throw erreur(409, "TEAM_NOT_EMPTY");
      equipesBrutes = equipesBrutes.map((e) => (e.id === id ? { ...e, isActive: false } : e));
    },
    async addMembers(id, userIds) {
      await attendre();
      const equipe = equipeGeree(id);
      if (!equipe.isActive) throw erreur(409, "CONFLICT");
      // Un employé appartient à une seule équipe à la fois : l'ajout le retire de la précédente
      for (const userId of userIds) {
        if (!utilisateurs.some((u) => u.id === userId)) throw erreur(400, "VALIDATION_ERROR");
        rattacher(userId, equipe);
      }
      return equipes().find((e) => e.id === id)!;
    },
    async removeMember(id, userId) {
      await attendre();
      equipeGeree(id);
      const membre = utilisateurs.find((u) => u.id === userId && u.teamId === id);
      if (!membre) throw erreur(404, "NOT_FOUND");
      // Un employé actif doit toujours avoir une équipe : on le transfère (addMembers) au lieu de le retirer
      if (membre.isActive) throw erreur(409, "MEMBER_STILL_ACTIVE");
      if (equipesBrutes.find((e) => e.id === id)?.manager?.id === userId) throw erreur(409, "CONFLICT"); // nommer un autre responsable d'abord
      rattacher(userId, null);
    },
    async setManager(id, nomination) {
      await attendre();
      verifierGestionComplete();
      equipeGeree(id);
      const manager = utilisateurs.find((u) => u.id === nomination.userId && u.isActive);
      if (!manager) throw erreur(400, "VALIDATION_ERROR");
      equipesBrutes = equipesBrutes.map((e) => (e.id === id ? { ...e, manager: mocks.resume(manager) } : e));
    },
  },

  departments: {
    async list() {
      await attendre();
      utilisateurConnecte();
      return liste(mocks.DEPARTEMENTS);
    },
  },

  profiles: {
    async list() {
      await attendre();
      utilisateurConnecte();
      return liste(Object.values(mocks.PROFILS));
    },
  },
};

/** Remet les données factices dans leur état initial (utile pour les tests) */
export function resetMockData(): void {
  sessions = mocks.SESSIONS_EQUIPE.map((s) => ({ ...s }));
  utilisateurs = mocks.UTILISATEURS.map((u) => ({ ...u }));
  equipesBrutes = mocks.EQUIPES.map((e) => ({ ...e }));
}
