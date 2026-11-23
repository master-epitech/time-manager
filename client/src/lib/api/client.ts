import { request } from "./http";
import { clearToken, setToken } from "./session";
import type {
  Absence,
  AbsenceType,
  Anomaly,
  ClockEvent,
  ClockType,
  AuthProvider,
  ContractType,
  CorrectionRequest,
  Department,
  IsoDate,
  IsoDateTime,
  Kpis,
  LeaveBalance,
  ListResponse,
  LoginRequest,
  MeContext,
  NotificationList,
  Profile,
  ProfileCode,
  Team,
  User,
  UserStatus,
  Uuid,
  WorkMode,
  WorkSession,
} from "./types";

/** Période demandée à l'API (bornes incluses) */
export type Periode = { from: IsoDate; to: IsoDate };

export type NewAbsence = { typeId: number; startDate: IsoDate; endDate: IsoDate; reason?: string };

export type NewCorrection = {
  workDate: IsoDate;
  proposedEntryAt?: IsoDateTime;
  proposedExitAt?: IsoDateTime;
  workMode?: WorkMode;
  reason: string;
  anomalyId?: Uuid;
};

/** Filtres de la liste des comptes (GET /users) ; un filtre vide est ignoré */
export type FiltresUtilisateurs = {
  q?: string;
  status?: UserStatus;
  profileCode?: ProfileCode;
  teamId?: Uuid;
  departmentId?: Uuid;
  page?: number;
  pageSize?: number;
};

/** Création d'un compte (POST /users) : pas d'inscription publique, le compte est créé par un manager ou les RH */
export type NewUser = {
  firstName: string;
  lastName: string;
  email: string;
  profileCode: ProfileCode;
  departmentId?: Uuid;
  teamId?: Uuid;
  jobTitle?: string;
  phone?: string;
  contractType?: ContractType;
  hireDate?: IsoDate;
  authProvider?: AuthProvider;
  /** Envoie l'invitation Microsoft 365 (authProvider MICROSOFT ou BOTH) */
  sendMicrosoftInvitation?: boolean;
};

/** Modification d'un compte (PATCH /users/:id) */
export type UserUpdate = Partial<Pick<User, "firstName" | "lastName" | "email" | "phone" | "jobTitle" | "status">>;

/** Changement d'équipe ou de département (POST /users/:id/assignment) */
export type Affectation = { departmentId: Uuid; teamId?: Uuid; startDate: IsoDate; jobTitle?: string };

/**
 * Tout ce que le front peut demander à l'API, regroupé par domaine.
 * Deux implémentations respectent ce contrat : l'API réelle (ci-dessous) et les données
 * factices (mock-client.ts). Les écrans ne savent pas laquelle ils utilisent.
 */
export interface ApiClient {
  auth: {
    login(credentials: LoginRequest): Promise<void>;
    logout(): Promise<void>;
    me(): Promise<MeContext>;
  };
  clock: {
    /** Pointer une entrée ou une sortie ; le lieu est déduit du planning (R19) */
    punch(type: ClockType): Promise<ClockEvent>;
    mySessions(periode: Periode): Promise<ListResponse<WorkSession>>;
  };
  absences: {
    mine(): Promise<ListResponse<Absence>>;
    myBalances(period: string): Promise<ListResponse<LeaveBalance>>;
    types(): Promise<ListResponse<AbsenceType>>;
    request(absence: NewAbsence): Promise<Absence>;
  };
  anomalies: {
    mine(): Promise<ListResponse<Anomaly>>;
    myCorrections(): Promise<ListResponse<CorrectionRequest>>;
    requestCorrection(correction: NewCorrection): Promise<CorrectionRequest>;
  };
  dashboard: {
    me(periode: Periode): Promise<Kpis>;
    team(teamId: Uuid, periode: Periode): Promise<Kpis>;
  };
  notifications: {
    list(): Promise<NotificationList>;
  };
  users: {
    list(filtres?: FiltresUtilisateurs): Promise<ListResponse<User>>;
    get(id: Uuid): Promise<User>;
    create(user: NewUser): Promise<User>;
    update(id: Uuid, modifications: UserUpdate): Promise<User>;
    assign(id: Uuid, affectation: Affectation): Promise<User>;
    deactivate(id: Uuid): Promise<void>;
    activate(id: Uuid): Promise<void>;
  };
  teams: {
    list(departmentId?: Uuid): Promise<ListResponse<Team>>;
  };
  departments: {
    list(): Promise<ListResponse<Department>>;
  };
  profiles: {
    list(): Promise<ListResponse<Profile>>;
  };
}

const periodeQuery = ({ from, to }: Periode) => ({ date_from: from, date_to: to });

/** Implémentation réelle : appelle FastAPI selon le contrat v1 (docs/api/) */
export const httpClient: ApiClient = {
  auth: {
    async login(credentials) {
      const { accessToken } = await request<{ accessToken: string }>("POST", "/auth/login", {
        body: credentials,
        auth: false,
      });
      setToken(accessToken);
    },
    async logout() {
      try {
        await request<void>("POST", "/auth/logout");
      } finally {
        clearToken(); // on se déconnecte côté front même si l'appel échoue
      }
    },
    me: () => request("GET", "/auth/me"),
  },
  clock: {
    punch: (type) => request("POST", "/me/clock-events", { body: { type } }),
    mySessions: (periode) => request("GET", "/me/clock-sessions", { query: periodeQuery(periode) }),
  },
  absences: {
    mine: () => request("GET", "/me/absences"),
    myBalances: (period) => request("GET", "/me/leave-balances", { query: { period } }),
    types: () => request("GET", "/absence-types"),
    request: (absence) => request("POST", "/me/absences", { body: absence }),
  },
  anomalies: {
    mine: () => request("GET", "/me/anomalies"),
    myCorrections: () => request("GET", "/me/corrections"),
    requestCorrection: (correction) => request("POST", "/me/corrections", { body: correction }),
  },
  dashboard: {
    me: (periode) => request("GET", "/dashboard/me", { query: periodeQuery(periode) }),
    team: (teamId, periode) => request("GET", "/dashboard/team", { query: { team_id: teamId, ...periodeQuery(periode) } }),
  },
  notifications: {
    list: () => request("GET", "/notifications"),
  },
  users: {
    list: (f = {}) =>
      request("GET", "/users", {
        query: {
          q: f.q,
          status: f.status,
          profile_code: f.profileCode,
          team_id: f.teamId,
          department_id: f.departmentId,
          page: f.page,
          page_size: f.pageSize,
        },
      }),
    get: (id) => request("GET", `/users/${id}`),
    create: (user) => request("POST", "/users", { body: user }),
    update: (id, modifications) => request("PATCH", `/users/${id}`, { body: modifications }),
    assign: (id, affectation) => request("POST", `/users/${id}/assignment`, { body: affectation }),
    deactivate: (id) => request("POST", `/users/${id}/deactivate`),
    activate: (id) => request("POST", `/users/${id}/activate`),
  },
  teams: {
    list: (departmentId) => request("GET", "/teams", { query: { department_id: departmentId } }),
  },
  departments: {
    list: () => request("GET", "/departments"),
  },
  profiles: {
    list: () => request("GET", "/profiles"),
  },
};
