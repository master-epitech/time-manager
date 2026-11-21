/**
 * Données factices conformes au contrat d'API v1 (TM-74).
 * Elles reprennent le jeu de démo de la base (server/db/trinity_market_db-4.sql) :
 * mêmes identifiants, mêmes personnes, même équipe « Service Client — Niveau 1 ».
 * Ainsi, les écrans affichent la même chose avec les données factices et avec le vrai back.
 */
import type {
  AbsenceType,
  Department,
  Feature,
  Organisation,
  Profile,
  ProfileCode,
  Team,
  User,
  UserSummary,
} from "@/lib/api/types";

/* ---------- Identifiants du jeu de démo (identiques au script SQL) ---------- */
export const IDS = {
  organisation: "11111111-1111-1111-1111-111111111111",
  departementServiceClient: "33333333-3333-3333-3333-333333333335",
  equipeServiceClientN1: "44444444-4444-4444-4444-444444444443",
  karim: "55555555-5555-5555-5555-555555555505", // manager de l'équipe
  lea: "55555555-5555-5555-5555-555555555506", // employée
  omar: "55555555-5555-5555-5555-555555555509", // employé
  ines: "55555555-5555-5555-5555-555555555510", // employée
  // Compléments pour les écrans de gestion (absents du jeu SQL)
  departementRh: "33333333-3333-3333-3333-333333333336",
  equipeServiceClientN2: "44444444-4444-4444-4444-444444444444",
  equipeRh: "44444444-4444-4444-4444-444444444445",
  claire: "55555555-5555-5555-5555-555555555511", // RH
  hugo: "55555555-5555-5555-5555-555555555512", // employé niveau 2
  julien: "55555555-5555-5555-5555-555555555513", // parti le 30/09/2026
  nina: "55555555-5555-5555-5555-555555555514", // invitation Microsoft en attente
} as const;

export const ORGANISATION: Organisation = {
  id: IDS.organisation,
  code: "TRINITY",
  name: "Trinity Market",
  country: "France",
  countryCode: "FR",
  regionCode: "FR-ALSACE-MOSELLE",
  timezone: "Europe/Paris",
  matriculePrefix: "TM",
  emailDomain: "trinity-market.example",
  microsoftTenantId: "common",
  isActive: true,
};

export const PROFILS: Record<ProfileCode, Profile> = {
  EMPLOYEE: { id: 1, code: "EMPLOYEE", label: "Employee", hierarchyLevel: 5, isSystem: true },
  MANAGER: { id: 2, code: "MANAGER", label: "Team Manager", hierarchyLevel: 3, isSystem: true },
  HR: { id: 3, code: "HR", label: "Human Resources", hierarchyLevel: 2, isSystem: true },
  DIRECTOR: { id: 4, code: "DIRECTOR", label: "Director", hierarchyLevel: 2, isSystem: true },
  CEO: { id: 5, code: "CEO", label: "Chief Executive Officer", hierarchyLevel: 1, isSystem: true },
  SUPER_ADMIN: { id: 6, code: "SUPER_ADMIN", label: "Super Admin", hierarchyLevel: 0, isSystem: true },
};

/* ---------- Personnes ---------- */
function personne(
  id: string,
  firstName: string,
  lastName: string,
  matricule: string,
  jobTitle: string,
  profileCodes: ProfileCode[],
  hireDate: string,
  /** Champs à remplacer (autre équipe, compte désactivé…) */
  autres: Partial<User> = {},
): User {
  return {
    id,
    firstName,
    lastName,
    email: `${firstName.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")}.${lastName.toLowerCase()}@trinity-market.example`,
    matricule,
    status: "ACTIF",
    isActive: true,
    contractType: "CDI",
    hireDate,
    jobTitle,
    departmentId: IDS.departementServiceClient,
    departmentName: "Service Client",
    teamId: IDS.equipeServiceClientN1,
    teamName: "Service Client — Niveau 1",
    profileCodes,
    authProvider: "BOTH",
    invitationStatus: "ACCEPTED",
    ...autres,
  };
}

export const KARIM = personne(IDS.karim, "Karim", "Benali", "TM-2020-00320", "Responsable support N1", ["MANAGER", "EMPLOYEE"], "2020-02-03");
export const LEA = personne(IDS.lea, "Léa", "Dubois", "TM-2024-00584", "Conseillère client", ["EMPLOYEE"], "2024-04-15");
export const OMAR = personne(IDS.omar, "Omar", "Diallo", "TM-2024-00590", "Conseiller client", ["EMPLOYEE"], "2024-05-02");
export const INES = personne(IDS.ines, "Inès", "Moreau", "TM-2025-00640", "Conseillère client", ["EMPLOYEE"], "2025-01-06");


/* Personnes ajoutées pour les écrans de gestion */
const EQUIPE_N2 = { teamId: IDS.equipeServiceClientN2, teamName: "Service Client — Niveau 2" };
export const CLAIRE = personne(IDS.claire, "Claire", "Fontaine", "TM-2019-00210", "Chargée RH", ["HR", "EMPLOYEE"], "2019-09-02", {
  departmentId: IDS.departementRh,
  departmentName: "Ressources humaines",
  teamId: IDS.equipeRh,
  teamName: "RH — Administration du personnel",
});
export const HUGO = personne(IDS.hugo, "Hugo", "Lambert", "TM-2023-00512", "Conseiller expert", ["EMPLOYEE"], "2023-03-13", EQUIPE_N2);
export const JULIEN = personne(IDS.julien, "Julien", "Garnier", "TM-2022-00455", "Conseiller client", ["EMPLOYEE"], "2022-06-01", {
  status: "SORTI",
  isActive: false,
  departureDate: "2026-09-30",
});
export const NINA = personne(IDS.nina, "Nina", "Petit", "TM-2026-00702", "Conseillère client", ["EMPLOYEE"], "2026-12-01", {
  contractType: "CDD",
  authProvider: "MICROSOFT",
  invitationStatus: "PENDING",
});

/** Tous les comptes de l'organisation (écran Gestion · Utilisateurs) */
export const UTILISATEURS: User[] = [KARIM, LEA, OMAR, INES, NINA, JULIEN, HUGO, CLAIRE];

/** Version courte, telle qu'imbriquée dans les réponses de l'API */
export function resume(u: User): UserSummary {
  const { id, firstName, lastName, email, matricule, status, isActive } = u;
  return { id, firstName, lastName, email, matricule, status, isActive };
}

export const EQUIPE_SERVICE_CLIENT_N1: Team = {
  id: IDS.equipeServiceClientN1,
  departmentId: IDS.departementServiceClient,
  code: "CS-N1",
  name: "Service Client — Niveau 1",
  isActive: true,
  membersCount: 3,
  manager: resume(KARIM),
};

export const DEPARTEMENTS: Department[] = [
  { id: IDS.departementServiceClient, code: "CS", name: "Service Client", isActive: true, manager: null, teamsCount: 2 },
  { id: IDS.departementRh, code: "RH", name: "Ressources humaines", isActive: true, manager: null, teamsCount: 1 },
];

/** Équipes ; le nombre de membres est recalculé par le client factice */
export const EQUIPES: Team[] = [
  EQUIPE_SERVICE_CLIENT_N1,
  {
    id: IDS.equipeServiceClientN2,
    departmentId: IDS.departementServiceClient,
    code: "CS-N2",
    name: "Service Client — Niveau 2",
    isActive: true,
    membersCount: 1,
    manager: null,
  },
  {
    id: IDS.equipeRh,
    departmentId: IDS.departementRh,
    code: "RH-ADM",
    name: "RH — Administration du personnel",
    isActive: true,
    membersCount: 1,
    manager: resume(CLAIRE),
  },
];

/* ---------- Droits (features) ---------- */
const f = (code: string, label: string, scope: Feature["scope"], module: string): Feature => ({ code, label, scope, module });

export const FEATURES_EMPLOYE: Feature[] = [
  f("AUTH_LOGIN", "Se connecter", "NONE", "AUTH"),
  f("POINTAGE_BADGER", "Pointer", "SELF", "POINTAGE"),
  f("POINTAGE_READ_OWN", "Voir mes pointages", "SELF", "POINTAGE"),
  f("POINTAGE_CORRECTION_REQUEST", "Demander une correction", "SELF", "POINTAGE"),
  f("KPI_READ_SELF", "Voir mes indicateurs", "SELF", "KPI"),
  f("ABSENCE_REQUEST", "Demander une absence", "SELF", "ABSENCE"),
  f("ANOMALY_JUSTIFY", "Justifier une anomalie", "SELF", "ANOMALY"),
];

export const FEATURES_MANAGER: Feature[] = [
  ...FEATURES_EMPLOYE,
  f("POINTAGE_READ_TEAM", "Voir les pointages de l'équipe", "TEAM", "POINTAGE"),
  f("POINTAGE_VALIDATE_TEAM", "Valider les pointages de l'équipe", "TEAM", "POINTAGE"),
  f("KPI_READ_TEAM", "Voir les indicateurs de l'équipe", "TEAM", "KPI"),
  f("ABSENCE_APPROVE_TEAM", "Valider les absences de l'équipe", "TEAM", "ABSENCE"),
  f("ANOMALY_MANAGE_TEAM", "Traiter les anomalies de l'équipe", "TEAM", "ANOMALY"),
  f("TEAM_MANAGE", "Gérer l'équipe", "TEAM", "TEAM"),
];

export const TYPES_ABSENCE: AbsenceType[] = [
  { id: 1, code: "CP", label: "Congés payés", hasCounter: true },
  { id: 2, code: "RTT", label: "RTT", hasCounter: true },
  { id: 3, code: "MALADIE", label: "Maladie", hasCounter: false },
  { id: 4, code: "FORMATION", label: "Formation", hasCounter: false },
  { id: 5, code: "EVENEMENT_FAM", label: "Événement familial", hasCounter: false },
  { id: 6, code: "SANS_SOLDE", label: "Congé sans solde", hasCounter: false },
];
