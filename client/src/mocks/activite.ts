/**
 * Activité factice de l'équipe « Service Client — Niveau 1 » sur la semaine
 * du lundi 9 au vendredi 13 novembre 2026 (le 11 est férié).
 * Les heures sont en UTC, comme dans l'API : 08:32 à Paris (hiver) = 07:32Z.
 */
import type {
  Absence,
  Anomaly,
  AppNotification,
  ClockEvent,
  CorrectionRequest,
  Kpis,
  LeaveBalance,
  MeContext,
  NotificationList,
  WorkMode,
  WorkSession,
} from "@/lib/api/types";
import {
  FEATURES_EMPLOYE,
  FEATURES_MANAGER,
  IDS,
  INES,
  KARIM,
  LEA,
  OMAR,
  ORGANISATION,
  PROFILS,
  resume,
} from "./referentiel";

/* ---------- Contexte de connexion (GET /auth/me) ---------- */
export const ME_EMPLOYE: MeContext = {
  user: LEA,
  organisation: ORGANISATION,
  profiles: [
    { id: "a3000000-0000-0000-0000-000000000006", profile: PROFILS.EMPLOYEE, startDate: "2026-01-01", orderPriority: 1, isActive: true },
  ],
  activeProfile: PROFILS.EMPLOYEE,
  features: FEATURES_EMPLOYE,
};

export const ME_MANAGER: MeContext = {
  user: KARIM,
  organisation: ORGANISATION,
  profiles: [
    { id: "a3000000-0000-0000-0000-000000000004", profile: PROFILS.MANAGER, startDate: "2026-03-01", reason: "Promotion responsable support N1", orderPriority: 1, isActive: true },
    { id: "a3000000-0000-0000-0000-000000000005", profile: PROFILS.EMPLOYEE, startDate: "2026-01-01", orderPriority: 2, isActive: true },
  ],
  activeProfile: PROFILS.MANAGER,
  features: FEATURES_MANAGER,
};

/* ---------- Sessions de travail ---------- */
/** Crée une session ; la durée est calculée pour rester toujours cohérente avec les heures */
function session(
  userId: string,
  workDate: string,
  entree: string,
  sortie: string | null,
  workMode: WorkMode = "BUREAU",
): WorkSession {
  // Heures saisies en heure de Paris (UTC+1 en novembre), stockées en UTC comme le renverra l'API
  const versUtc = (heure: string) => new Date(`${workDate}T${heure}:00+01:00`).toISOString();
  const entryAt = versUtc(entree);
  const exitAt = sortie ? versUtc(sortie) : null;
  const minutes = exitAt ? Math.round((Date.parse(exitAt) - Date.parse(entryAt)) / 60000) : 0;
  return {
    userId,
    teamId: IDS.equipeServiceClientN1,
    workDate,
    entryAt,
    exitAt,
    minutes,
    // Une session sans sortie depuis plus de 16 h est incomplète (R15)
    status: exitAt ? "COMPLETE" : "INCOMPLETE",
    workMode,
  };
}

/** Sessions de Léa (GET /clock/sessions) : 2 par jour, une session incomplète vendredi */
export const SESSIONS_LEA: WorkSession[] = [
  session(IDS.lea, "2026-11-09", "07:32", "11:00"),
  session(IDS.lea, "2026-11-09", "12:30", "16:05"),
  session(IDS.lea, "2026-11-10", "07:58", "11:30", "REMOTE"),
  session(IDS.lea, "2026-11-10", "12:30", "16:02", "REMOTE"),
  session(IDS.lea, "2026-11-12", "07:45", "11:00"),
  session(IDS.lea, "2026-11-12", "12:00", "16:10"),
  session(IDS.lea, "2026-11-13", "07:50", null), // oubli de pointer la sortie
];

/** Sessions de l'équipe (vue manager), avec l'utilisateur imbriqué */
export const SESSIONS_EQUIPE: WorkSession[] = [
  ...SESSIONS_LEA.map((s) => ({ ...s, user: resume(LEA) })),
  ...[
    session(IDS.omar, "2026-11-09", "08:20", "16:40"),
    session(IDS.omar, "2026-11-10", "08:05", "16:30"),
    session(IDS.omar, "2026-11-13", "08:10", "16:15"),
  ].map((s) => ({ ...s, user: resume(OMAR) })),
  ...[
    session(IDS.ines, "2026-11-09", "07:55", "15:55"),
    session(IDS.ines, "2026-11-10", "07:50", "16:20", "REMOTE"),
    session(IDS.ines, "2026-11-12", "07:58", "16:05"),
    session(IDS.ines, "2026-11-13", "07:45", "15:30"),
  ].map((s) => ({ ...s, user: resume(INES) })),
];

/** Dernier pointage de Léa (POST /clock renvoie ce format) */
export const DERNIER_POINTAGE_LEA: ClockEvent = {
  id: "c0000000-0000-0000-0000-000000000013",
  userId: IDS.lea,
  teamId: IDS.equipeServiceClientN1,
  type: "ENTREE",
  workMode: "BUREAU",
  occurredAt: "2026-11-13T07:50:00.000Z",
  source: "WEB",
  status: "VALIDE",
};

/* ---------- Absences et soldes ---------- */
export const ABSENCES: Absence[] = [
  {
    id: "aa000000-0000-0000-0000-000000000002",
    userId: IDS.lea,
    user: resume(LEA),
    typeId: 1,
    typeCode: "CP",
    typeLabel: "Congés payés",
    startDate: "2026-12-21",
    endDate: "2026-12-24",
    reason: "Vacances de Noël",
    status: "EN_ATTENTE",
    daysCount: 4,
  },
  {
    id: "aa000000-0000-0000-0000-000000000003",
    userId: IDS.omar,
    user: resume(OMAR),
    typeId: 2,
    typeCode: "RTT",
    typeLabel: "RTT",
    startDate: "2026-11-20",
    endDate: "2026-11-20",
    status: "APPROUVEE",
    daysCount: 1,
  },
];

export const SOLDES_LEA: LeaveBalance[] = [
  { userId: IDS.lea, typeCode: "CP", label: "Congés payés", period: "2026", totalDays: 25, usedDays: 3, remainingDays: 22 },
  { userId: IDS.lea, typeCode: "RTT", label: "RTT", period: "2026", totalDays: 10, usedDays: 2, remainingDays: 8 },
];

/* ---------- Anomalies et corrections ---------- */
export const ANOMALIES: Anomaly[] = [
  {
    id: "ad000000-0000-0000-0000-000000000001",
    userId: IDS.lea,
    user: resume(LEA),
    anomalyDate: "2026-11-13",
    type: "SESSION_INCOMPLETE",
    clockEventId: DERNIER_POINTAGE_LEA.id,
    status: "OUVERTE",
    detail: "Sortie non pointée (session ouverte depuis plus de 16 h)",
  },
  {
    id: "ad000000-0000-0000-0000-000000000002",
    userId: IDS.omar,
    user: resume(OMAR),
    anomalyDate: "2026-11-12",
    type: "ABSENCE_A_JUSTIFIER",
    status: "A_JUSTIFIER",
    detail: "Aucun pointage sur un jour travaillé",
  },
];

export const CORRECTIONS: CorrectionRequest[] = [
  {
    id: "ae000000-0000-0000-0000-000000000001",
    userId: IDS.lea,
    user: resume(LEA),
    anomalyId: "ad000000-0000-0000-0000-000000000001",
    workDate: "2026-11-13",
    proposedEntryAt: "2026-11-13T07:50:00.000Z",
    proposedExitAt: "2026-11-13T16:05:00.000Z",
    workMode: "BUREAU",
    reason: "Oubli de pointage en partant",
    status: "EN_ATTENTE",
  },
];

/* ---------- Indicateurs ---------- */
export const KPIS_EQUIPE: Kpis = {
  scope: "TEAM",
  scopeId: IDS.equipeServiceClientN1,
  from: "2026-11-09",
  to: "2026-11-13",
  headcount: 3,
  presenceRate: 91.7,
  lateCount: 1,
  overtimeMinutes: 45,
  absenceCount: 1,
  anomalyCount: 2,
  anonymized: false,
};

export const KPIS_LEA: Kpis = {
  scope: "SELF",
  scopeId: IDS.lea,
  from: "2026-11-09",
  to: "2026-11-13",
  headcount: 1,
  presenceRate: 100,
  lateCount: 0,
  overtimeMinutes: 0,
  absenceCount: 0,
  anomalyCount: 1,
  anonymized: false,
};

/* ---------- Notifications ---------- */
const NOTIFS: AppNotification[] = [
  {
    id: "af000000-0000-0000-0000-000000000001",
    type: "ANOMALY",
    title: "Sortie non pointée",
    message: "Votre session du vendredi 13 novembre est incomplète. Demandez une correction.",
    isRead: false,
    createdAt: "2026-11-14T00:00:00.000Z",
  },
  {
    id: "af000000-0000-0000-0000-000000000002",
    type: "ABSENCE",
    title: "Demande de congés envoyée",
    message: "Votre demande de congés du 21 au 24 décembre attend la validation de Karim Benali.",
    isRead: true,
    readAt: "2026-11-10T09:00:00.000Z",
    createdAt: "2026-11-10T08:12:00.000Z",
  },
];

export const NOTIFICATIONS_LEA: NotificationList = {
  data: NOTIFS,
  unreadCount: NOTIFS.filter((n) => !n.isRead).length,
};
