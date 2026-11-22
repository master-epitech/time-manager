"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout";
import { Badge, Button, Card, Icon } from "@/components/ui";
import { api, ApiError, type Kpis, type WorkSession } from "@/lib/api";
import { useSession } from "@/lib/auth/SessionProvider";
import { useMaintenant } from "@/lib/hooks/useMaintenant";
import { statutJour, totalMinutes, type StatutJour } from "@/lib/pointage";
import {
  ajouterJours,
  formatDuree,
  formatHeure,
  formatJourTableau,
  formatSemaine,
  jourIso,
  lundiDe,
  numeroSemaine,
} from "@/lib/temps";
import styles from "./page.module.css";

/** Durée hebdomadaire due, en minutes. TODO : la lire depuis le contrat de l'employé. */
const MINUTES_DUES_SEMAINE = 35 * 60;

type Semaine = { sessions: WorkSession[]; kpis: Kpis | null };

export function MesPointages() {
  const { session } = useSession();
  const maintenant = useMaintenant();
  const fuseau = session.statut === "connecte" ? session.me.organisation.timezone : "Europe/Paris";
  const aujourdhui = jourIso(maintenant, fuseau);
  const semaineCourante = lundiDe(aujourdhui);

  // Semaine affichée, en décalage par rapport à la semaine courante (0 = cette semaine)
  const [decalage, setDecalage] = useState(0);
  const lundi = ajouterJours(semaineCourante, decalage * 7);
  const dimanche = ajouterJours(lundi, 6);

  // Données rangées par lundi : changer de semaine n'efface pas l'écran pendant le chargement
  const [donnees, setDonnees] = useState<Record<string, Semaine>>({});
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let actif = true;
    const periode = { from: lundi, to: dimanche };
    Promise.all([
      api.clock.mySessions(periode),
      // Les indicateurs sont un bonus : leur échec n'empêche pas d'afficher les pointages
      api.dashboard.me(periode).catch(() => null),
    ])
      .then(([sessions, kpis]) => {
        if (!actif) return;
        setDonnees((d) => ({ ...d, [lundi]: { sessions: sessions.data, kpis } }));
        setErreur(null);
      })
      .catch((e) => actif && setErreur(e instanceof ApiError ? e.message : "Impossible de charger vos pointages."));
    return () => {
      actif = false;
    };
  }, [lundi, dimanche]);

  const semaine = donnees[lundi];
  const jours = Array.from({ length: 7 }, (_, i) => ajouterJours(lundi, i));
  const sessionsDu = (jour: string) =>
    (semaine?.sessions ?? []).filter((s) => s.workDate === jour).sort((a, b) => a.entryAt.localeCompare(b.entryAt));

  const minutesSemaine = semaine ? totalMinutes(semaine.sessions, maintenant) : 0;
  const aRegulariser = semaine ? semaine.sessions.filter((s) => s.status === "INCOMPLETE").length : 0;

  return (
    <>
      <PageHeader
        titre="Mes pointages"
        sousTitre={`Semaine ${numeroSemaine(lundi)} · ${formatSemaine(lundi)}`}
        actions={
          <>
            <Button variant="secondaire" onClick={() => setDecalage((d) => d - 1)} aria-label="Semaine précédente">
              ←
            </Button>
            <Button variant="secondaire" onClick={() => setDecalage(0)} disabled={decalage === 0}>
              Cette semaine
            </Button>
            <Button
              variant="secondaire"
              onClick={() => setDecalage((d) => d + 1)}
              disabled={decalage >= 0}
              aria-label="Semaine suivante"
            >
              →
            </Button>
          </>
        }
      />

      {erreur && !semaine ? (
        <Card>
          <p role="alert">{erreur}</p>
        </Card>
      ) : !semaine ? (
        <p role="status" className={styles.chargement}>
          Chargement…
        </p>
      ) : (
        <>
          <section className={styles.resume} aria-label="Résumé de la semaine">
            <article className={styles.indicateur}>
              <span className={styles.libelle}>Heures de la semaine</span>
              <span className={styles.valeur}>
                {formatDuree(minutesSemaine)} <span className={styles.du}>/ {formatDuree(MINUTES_DUES_SEMAINE)}</span>
              </span>
            </article>
            <article className={styles.indicateur}>
              <span className={styles.libelle}>Heures supplémentaires</span>
              <span className={styles.valeur}>{formatDuree(Math.max(0, minutesSemaine - MINUTES_DUES_SEMAINE))}</span>
            </article>
            <article className={styles.indicateur}>
              <span className={styles.libelle}>Retards</span>
              <span className={styles.valeur}>{semaine.kpis?.lateCount ?? "—"}</span>
            </article>
            <article className={`${styles.indicateur} ${aRegulariser > 0 ? styles.alerte : ""}`}>
              <span className={styles.libelle}>
                <Icon name="warning" size={16} /> À régulariser
              </span>
              <span className={styles.valeur}>{aRegulariser}</span>
            </article>
          </section>

          <div className={styles.cadreTableau}>
            <table className={styles.tableau}>
              <caption className="sr-only">Pointages {formatSemaine(lundi)}</caption>
              <thead>
                <tr>
                  <th scope="col">Jour</th>
                  <th scope="col">Sessions</th>
                  <th scope="col">Lieu</th>
                  <th scope="col">Total</th>
                  <th scope="col">Statut</th>
                </tr>
              </thead>
              <tbody>
                {jours.map((jour) => {
                  const sessions = sessionsDu(jour);
                  const statut = statutJour(jour, sessions, aujourdhui);
                  const teletravail = sessions.some((s) => s.workMode === "REMOTE");
                  return (
                    <tr key={jour} className={jour === aujourdhui ? styles.aujourdhui : undefined}>
                      <th scope="row">{formatJourTableau(jour)}</th>
                      <td className={styles.mono}>
                        {sessions.length === 0
                          ? "—"
                          : sessions.map((s, i) => (
                              <span key={s.entryAt}>
                                {i > 0 && " · "}
                                {formatHeure(s.entryAt, fuseau)} →{" "}
                                {s.exitAt ? (
                                  formatHeure(s.exitAt, fuseau)
                                ) : s.status === "OPEN" ? (
                                  "en cours"
                                ) : (
                                  <span className={styles.manquant}>sortie non pointée</span>
                                )}
                              </span>
                            ))}
                      </td>
                      <td>
                        {sessions.length === 0 ? "—" : teletravail ? <Badge domaine="teletravail" /> : "Bureau"}
                      </td>
                      <td className={styles.mono}>
                        {sessions.length === 0 ? "—" : statut === "incomplet" ? "exclue" : formatDuree(totalMinutes(sessions, maintenant))}
                      </td>
                      <td>
                        <Statut statut={statut} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className={styles.note}>
            Heure fixée par le serveur · affichage en heure de Paris · une session incomplète est exclue des calculs
            jusqu&apos;à sa régularisation.
          </p>
        </>
      )}
    </>
  );
}

const LIBELLE_STATUT: Record<StatutJour, string> = {
  complet: "Complet",
  "en-cours": "En cours",
  incomplet: "Session incomplète",
  vide: "Aucun pointage",
  "non-travaille": "Jour non travaillé",
  "a-venir": "—",
};

/** Statut d'une journée : texte toujours présent, icône pour les cas à traiter */
function Statut({ statut }: { statut: StatutJour }) {
  if (statut === "incomplet") {
    return (
      <span className={styles.statutAction}>
        <Badge domaine="anomalie">Session incomplète</Badge>
        {/* TODO : ouvrir le panneau de correction (maquette 05) quand il existera */}
        <Link href="/demandes">Demander une correction</Link>
      </span>
    );
  }
  if (statut === "en-cours") return <Badge domaine="temps">En cours</Badge>;
  return <span className={statut === "complet" ? undefined : styles.discret}>{LIBELLE_STATUT[statut]}</span>;
}
