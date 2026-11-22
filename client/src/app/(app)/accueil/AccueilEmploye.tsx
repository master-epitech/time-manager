"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout";
import { Badgeuse } from "@/components/pointage/Badgeuse";
import { Card, Icon } from "@/components/ui";
import { api, ApiError, type Absence, type Anomaly, type CorrectionRequest, type LeaveBalance, type WorkSession } from "@/lib/api";
import { useSession } from "@/lib/auth/SessionProvider";
import { useMaintenant } from "@/lib/hooks/useMaintenant";
import { ajouterJours, formatDateLongue, formatDuree, formatJourCourt, jourIso, lundiDe, minutesEntre } from "@/lib/temps";
import styles from "./page.module.css";

/**
 * Durée hebdomadaire due, en minutes.
 * TODO : la lire depuis le contrat / planning de l'employé quand l'API l'exposera.
 */
const MINUTES_DUES_SEMAINE = 35 * 60;

/** Libellés courts des types d'anomalie */
const LIBELLE_ANOMALIE: Record<string, string> = {
  SESSION_INCOMPLETE: "sortie non pointée",
  ABSENCE_A_JUSTIFIER: "absence à justifier",
};

type Donnees = {
  sessions: WorkSession[];
  absences: Absence[];
  corrections: CorrectionRequest[];
  anomalies: Anomaly[];
  soldes: LeaveBalance[];
};

export function AccueilEmploye() {
  const { session } = useSession();
  const maintenant = useMaintenant();
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  // AppShell n'affiche la page qu'une fois connecté : la session est forcément chargée ici
  const me = session.statut === "connecte" ? session.me : null;
  const fuseau = me?.organisation.timezone ?? "Europe/Paris";
  const aujourdhui = jourIso(maintenant, fuseau);
  const lundi = lundiDe(aujourdhui);

  /** Lit toutes les données de l'accueil en parallèle */
  const lireDonnees = useCallback(async (): Promise<Donnees> => {
    const [sessions, absences, corrections, anomalies, soldes] = await Promise.all([
      api.clock.mySessions({ from: lundi, to: ajouterJours(lundi, 6) }),
      api.absences.mine(),
      api.anomalies.myCorrections(),
      api.anomalies.mine(),
      api.absences.myBalances(lundi.slice(0, 4)),
    ]);
    return {
      sessions: sessions.data,
      absences: absences.data,
      corrections: corrections.data,
      anomalies: anomalies.data,
      soldes: soldes.data,
    };
  }, [lundi]);

  useEffect(() => {
    let actif = true; // évite de mettre à jour un écran déjà quitté
    lireDonnees()
      .then((d) => {
        if (!actif) return;
        setDonnees(d);
        setErreur(null);
      })
      .catch((e) => actif && setErreur(e instanceof ApiError ? e.message : "Impossible de charger vos données."));
    return () => {
      actif = false;
    };
  }, [lireDonnees]);

  /** Recharge après un pointage (le pointage est déjà enregistré : un échec ici n'est pas bloquant) */
  const recharger = useCallback(async () => {
    try {
      setDonnees(await lireDonnees());
    } catch {
      /* les données seront rechargées au prochain affichage */
    }
  }, [lireDonnees]);

  if (!me) return null;

  const entete = (
    <PageHeader
      titre={`Bonjour ${me.user.firstName}`}
      sousTitre={[formatDateLongue(maintenant, fuseau), me.user.teamName].filter(Boolean).join(" · ")}
    />
  );

  if (erreur && !donnees) {
    return (
      <>
        {entete}
        <Card>
          <p role="alert">{erreur}</p>
        </Card>
      </>
    );
  }
  if (!donnees) {
    return (
      <>
        {entete}
        <p role="status" className={styles.chargement}>
          Chargement…
        </p>
      </>
    );
  }

  // Temps travaillé : sessions terminées + temps écoulé de la session en cours
  const dureeSession = (s: WorkSession) => (s.status === "OPEN" ? minutesEntre(s.entryAt, maintenant) : s.minutes);
  const sessionsDuJour = donnees.sessions
    .filter((s) => s.workDate === aujourdhui)
    .sort((a, b) => a.entryAt.localeCompare(b.entryAt));
  const minutesSemaine = donnees.sessions.reduce((total, s) => total + dureeSession(s), 0);
  const minutesJour = sessionsDuJour.reduce((total, s) => total + dureeSession(s), 0);
  const progression = Math.min(100, Math.round((minutesSemaine / MINUTES_DUES_SEMAINE) * 100));

  const congesEnAttente = donnees.absences.filter((a) => a.status === "EN_ATTENTE").length;
  const correctionsEnAttente = donnees.corrections.filter((c) => c.status === "EN_ATTENTE").length;
  const anomaliesOuvertes = donnees.anomalies
    .filter((a) => a.status !== "RESOLUE")
    .sort((a, b) => b.anomalyDate.localeCompare(a.anomalyDate));
  const derniereAnomalie = anomaliesOuvertes[0];

  return (
    <>
      {entete}

      <div className={styles.grille}>
        <section className={styles.principal} aria-labelledby="demandes-titre">
          <h2 id="demandes-titre" className={styles.titreSection}>
            Mes demandes en attente
          </h2>
          <div className={styles.tuiles}>
            <TuileDemande domaine="conges" nombre={congesEnAttente} libelle="Congés" lien="Voir mes congés" />
            <TuileDemande domaine="temps" nombre={correctionsEnAttente} libelle="Corrections" lien="Voir mes corrections" />
          </div>

          <div className={styles.duo}>
            {derniereAnomalie ? (
              <article className={styles.anomalie}>
                <div className={styles.ligneNombre}>
                  <Icon name="warning" />
                  <span className={styles.grandNombre}>{anomaliesOuvertes.length}</span>
                </div>
                <span className={styles.libelleFort}>
                  {anomaliesOuvertes.length > 1 ? "Pointages à régulariser" : "Pointage à régulariser"}
                </span>
                <Link href="/pointages" className={styles.lienAnomalie}>
                  {formatJourCourt(derniereAnomalie.anomalyDate)} ·{" "}
                  {LIBELLE_ANOMALIE[derniereAnomalie.type] ?? "à vérifier"} → Régulariser
                </Link>
              </article>
            ) : (
              <article className={styles.carte}>
                <div className={styles.ligneNombre}>
                  <Icon name="check" />
                  <span className={styles.libelleFort}>Aucun pointage à régulariser</span>
                </div>
              </article>
            )}

            <article className={`${styles.carte} ${styles.bordureTemps}`}>
              <span className={styles.petitTitre}>Cette semaine</span>
              <span className={styles.total}>
                {formatDuree(minutesSemaine)} <span className={styles.du}>/ {formatDuree(MINUTES_DUES_SEMAINE)}</span>
              </span>
              <div className={styles.jauge} role="img" aria-label={`${progression} % des heures dues`}>
                <div style={{ width: `${progression}%` }} />
              </div>
              <span className={styles.petitTexte}>
                Aujourd&apos;hui : <span className={styles.mono}>{formatDuree(minutesJour)}</span>
              </span>
            </article>
          </div>
        </section>

        <aside className={styles.cote}>
          <Badgeuse sessionsDuJour={sessionsDuJour} fuseau={fuseau} maintenant={maintenant} onPointage={recharger} />

          <Card titre="Mes soldes">
            {donnees.soldes.length === 0 ? (
              <p className={styles.petitTexte}>Aucun solde pour {lundi.slice(0, 4)}.</p>
            ) : (
              <ul className={styles.soldes}>
                {donnees.soldes.map((s) => (
                  <li key={s.typeCode}>
                    <span>
                      <span className={styles.typeSolde}>
                        <Icon name="sun" />
                        {s.label}
                      </span>
                      <span className={styles.petitTexte}>
                        Pris : {s.usedDays} j sur {s.totalDays} j
                      </span>
                    </span>
                    <span className={styles.valeurSolde}>{s.remainingDays} j</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}

type TuileDemandeProps = {
  domaine: "conges" | "teletravail" | "temps";
  nombre: number;
  libelle: string;
  lien: string;
};

/** Tuile « demandes en attente » : nombre, bouton + pour une nouvelle demande, lien vers la liste */
function TuileDemande({ domaine, nombre, libelle, lien }: TuileDemandeProps) {
  const couleur = { color: `var(--${domaine})`, borderColor: `var(--${domaine})` };
  return (
    <article className={styles.tuile} style={{ borderTopColor: `var(--${domaine})` }}>
      <div className={styles.ligneTuile}>
        <span className={styles.grandNombre} style={couleur}>
          {nombre}
        </span>
        <Link href="/demandes" className={styles.nouvelle} style={couleur} aria-label={`Nouvelle demande : ${libelle}`}>
          +
        </Link>
      </div>
      <span className={styles.libelleFort}>{libelle}</span>
      <Link href="/demandes" className={styles.petitTexte}>
        {lien} →
      </Link>
    </article>
  );
}
