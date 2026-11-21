/**
 * Types du contrat d'API v1 (docs/api/), partagés par tout le front.
 *
 * Conventions (règles métier R45) :
 * - noms de champs en camelCase ;
 * - dates ISO 8601 en UTC, durées en minutes entières ;
 * - valeurs des listes fermées en français pour le MVP (ENTREE, VALIDE…).
 *
 * Toute évolution du contrat doit être reportée ici : TypeScript signalera
 * alors chaque écran à adapter.
 */

/* ---------- Primitives ---------- */
export type Uuid = string;
/** Date seule, ex. "2026-11-12" */
export type IsoDate = string;
/** Date et heure UTC, ex. "2026-11-12T07:58:00.000Z" */
export type IsoDateTime = string;

/* ---------- Listes fermées (valeurs de la base) ---------- */
export type ProfileCode = "EMPLOYEE" | "MANAGER" | "HR" | "DIRECTOR" | "CEO" | "SUPER_ADMIN";
export type UserStatus = "ACTIF" | "SUSPENDU" | "SORTI";
export type ContractType = "CDI" | "CDD" | "INTERIM" | "STAGE" | "PRESTATAIRE" | "AUTRE";
export type AuthProvider = "PASSWORD" | "MICROSOFT" | "BOTH";
export type InvitationStatus = "NONE" | "PENDING" | "ACCEPTED" | "EXPIRED";
export type FeatureScope = "SELF" | "TEAM" | "DEPARTMENT" | "ALL" | "NONE";
export type ClockType = "ENTREE" | "SORTIE";
export type WorkMode = "BUREAU" | "REMOTE";
export type ClockSource = "APP" | "WEB";
export type ClockStatus = "VALIDE" | "EN_ATTENTE_VALIDATION" | "REJETE" | "CORRIGE";
/** COMPLETE : entrée + sortie ; OPEN : en cours ; INCOMPLETE : ouverte depuis plus de 16 h (R15) */
export type SessionStatus = "COMPLETE" | "OPEN" | "INCOMPLETE";
/** Statut commun aux absences, demandes de télétravail et corrections */
export type RequestStatus = "EN_ATTENTE" | "APPROUVEE" | "REFUSEE";
export type AnomalyStatus = "OUVERTE" | "A_JUSTIFIER" | "RESOLUE";

/* ---------- Enveloppes communes ---------- */
export type PageMeta = { page: number; pageSize: number; total: number; totalPages: number };

/** Liste renvoyée par l'API ; `meta` présent quand la route est paginée */
export type ListResponse<T> = { data: T[]; meta?: PageMeta };

/** Format unique des erreurs (R46) */
export type ApiErrorBody = {
  error: { code: string; message: string; details?: unknown };
  requestId?: string;
};

/* ---------- Authentification ---------- */
export type LoginRequest = { email: string; password: string };
export type LoginResponse = { accessToken: string; tokenType: "Bearer"; expiresIn: number };

/* ---------- Comptes, profils, organisation ---------- */
/** Version courte d'un utilisateur, imbriquée dans la plupart des réponses */
export type UserSummary = {
  id: Uuid;
  firstName: string;
  lastName: string;
  email: string;
  matricule: string;
  status: UserStatus;
  isActive: boolean;
};

export type User = UserSummary & {
  phone?: string | null;
  contractType: ContractType;
  hireDate: IsoDate;
  departureDate?: IsoDate | null;
  jobTitle?: string | null;
  departmentId?: Uuid | null;
  departmentName?: string | null;
  teamId?: Uuid | null;
  teamName?: string | null;
  profileCodes: ProfileCode[];
  authProvider: AuthProvider;
  invitationStatus: InvitationStatus;
};

export type Organisation = {
  id: Uuid;
  code: string;
  name: string;
  country: string;
  countryCode: string;
  regionCode: string;
  timezone: string;
  matriculePrefix: string;
  emailDomain: string;
  microsoftTenantId: string;
  isActive: boolean;
};

export type Profile = {
  id: number;
  code: ProfileCode;
  label: string;
  hierarchyLevel: number;
  isSystem: boolean;
  featuresCount?: number;
};

export type Feature = { code: string; label: string; scope: FeatureScope; module: string };

export type UserProfile = {
  id: Uuid;
  profile: Profile;
  startDate: IsoDate;
  endDate?: IsoDate | null;
  reason?: string | null;
  orderPriority: number;
  isActive: boolean;
};

/** Réponse de GET /auth/me : qui je suis et ce que j'ai le droit de faire */
export type MeContext = {
  user: User;
  organisation: Organisation;
  profiles: UserProfile[];
  activeProfile: Profile;
  features: Feature[];
};

export type Team = {
  id: Uuid;
  departmentId: Uuid;
  code: string;
  name: string;
  isActive: boolean;
  membersCount: number;
  manager?: UserSummary | null;
};

/* ---------- Pointage ---------- */
export type ClockEvent = {
  id: Uuid;
  userId: Uuid;
  user?: UserSummary;
  teamId?: Uuid | null;
  type: ClockType;
  workMode: WorkMode;
  occurredAt: IsoDateTime;
  declaredAt?: IsoDateTime | null;
  source: ClockSource;
  status: ClockStatus;
  validatedBy?: Uuid | null;
  validatedAt?: IsoDateTime | null;
  validationNote?: string | null;
};

/** Session de travail reconstituée par l'API (une entrée + une sortie) */
export type WorkSession = {
  userId: Uuid;
  user?: UserSummary;
  teamId?: Uuid | null;
  workDate: IsoDate;
  entryAt: IsoDateTime;
  exitAt?: IsoDateTime | null;
  /** Durée en minutes ; 0 tant que la session est ouverte */
  minutes: number;
  status: SessionStatus;
  workMode: WorkMode;
};

/* ---------- Absences et soldes ---------- */
export type AbsenceType = { id: number; code: string; label: string; hasCounter: boolean };

export type Absence = {
  id: Uuid;
  userId: Uuid;
  user?: UserSummary;
  typeId: number;
  typeCode: string;
  typeLabel: string;
  startDate: IsoDate;
  endDate: IsoDate;
  reason?: string | null;
  status: RequestStatus;
  daysCount: number;
};

export type LeaveBalance = {
  userId: Uuid;
  user?: UserSummary;
  typeCode: string;
  label: string;
  period: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
};

/* ---------- Anomalies et corrections ---------- */
export type Anomaly = {
  id: Uuid;
  userId: Uuid;
  user?: UserSummary;
  anomalyDate: IsoDate;
  /** ex. SESSION_INCOMPLETE, ABSENCE_A_JUSTIFIER */
  type: string;
  clockEventId?: Uuid | null;
  status: AnomalyStatus;
  absenceTypeId?: number | null;
  employeeComment?: string | null;
  justifiedAt?: IsoDateTime | null;
  decidedBy?: Uuid | null;
  decidedAt?: IsoDateTime | null;
  detail?: string | null;
};

export type CorrectionRequest = {
  id: Uuid;
  userId: Uuid;
  user?: UserSummary;
  anomalyId?: Uuid | null;
  workDate: IsoDate;
  proposedEntryAt?: IsoDateTime | null;
  proposedExitAt?: IsoDateTime | null;
  workMode?: WorkMode | null;
  reason?: string | null;
  status: RequestStatus;
  decidedBy?: Uuid | null;
  decidedAt?: IsoDateTime | null;
};

/* ---------- Tableau de bord ---------- */
export type Kpis = {
  scope: "SELF" | "TEAM" | "DEPARTMENT" | "ALL";
  scopeId?: Uuid | null;
  from: IsoDate;
  to: IsoDate;
  headcount: number;
  /** Taux de présence en pourcentage (0 à 100) */
  presenceRate: number | null;
  lateCount: number;
  overtimeMinutes: number;
  absenceCount: number;
  anomalyCount: number;
  /** true quand l'équipe compte moins de 3 membres : pas de moyenne affichée (RGPD) */
  anonymized: boolean;
};

/* ---------- Notifications ---------- */
export type AppNotification = {
  id: Uuid;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: IsoDateTime | null;
  createdAt: IsoDateTime;
};

export type NotificationList = ListResponse<AppNotification> & { unreadCount: number };
