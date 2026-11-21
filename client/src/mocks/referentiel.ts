/**
 * Données factices conformes au contrat d'API v1 (TM-74).
 * Elles reprennent le jeu de démo de la base (server/db/trinity_market_db-4.sql) :
 * mêmes identifiants, mêmes personnes, même équipe « Service Client — Niveau 1 ».
 * Ainsi, les écrans affichent la même chose avec les données factices et avec le vrai back.
 */
import type {
  AbsenceType,
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

export const PROFILS: Record<"EMPLOYEE" | "MANAGER", Profile> = {
  EMPLOYEE: { id: 1, code: "EMPLOYEE", label: "Employee", hierarchyLevel: 5, isSystem: true },
  MANAGER: { id: 2, code: "MANAGER", label: "Team Manager", hierarchyLevel: 3, isSystem: true },
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
  };
}

export const KARIM = personne(IDS.karim, "Karim", "Benali", "TM-2020-00320", "Responsable support N1", ["MANAGER", "EMPLOYEE"], "2020-02-03");
export const LEA = personne(IDS.lea, "Léa", "Dubois", "TM-2024-00584", "Conseillère client", ["EMPLOYEE"], "2024-04-15");
export const OMAR = personne(IDS.omar, "Omar", "Diallo", "TM-2024-00590", "Conseiller client", ["EMPLOYEE"], "2024-05-02");
export const INES = personne(IDS.ines, "Inès", "Moreau", "TM-2025-00640", "Conseillère client", ["EMPLOYEE"], "2025-01-06");

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
