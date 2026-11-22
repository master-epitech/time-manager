"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Icon } from "@/components/ui";
import { api, ApiError, type ClockType, type WorkSession } from "@/lib/api";
import { formatDuree, formatHeure, minutesEntre } from "@/lib/temps";
import styles from "./Badgeuse.module.css";

type BadgeuseProps = {
  /** Sessions de la journée, dans l'ordre chronologique */
  sessionsDuJour: WorkSession[];
  fuseau: string;
  maintenant: Date;
  /** Appelé après un pointage réussi pour recharger les données */
  onPointage: () => Promise<void> | void;
};

/**
 * Bouton de pointage (TM-75).
 * Libellé : Entrée → Sortie → Reprendre (après une pause).
 * L'heure enregistrée est celle du serveur : le client n'envoie que le type de pointage.
 */
export function Badgeuse({ sessionsDuJour, fuseau, maintenant, onPointage }: BadgeuseProps) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const ouverte = sessionsDuJour.find((s) => s.status === "OPEN");
  const type: ClockType = ouverte ? "SORTIE" : "ENTREE";
  const libelle = ouverte ? "Sortie" : sessionsDuJour.length > 0 ? "Reprendre" : "Entrée";
  const lieu = (ouverte?.workMode ?? "BUREAU") === "REMOTE" ? "Télétravail" : "Bureau";

  async function pointer() {
    setErreur(null);
    setEnCours(true);
    try {
      await api.clock.punch(type);
      await onPointage();
    } catch (e) {
      setErreur(e instanceof ApiError ? e.message : "Le pointage n'a pas pu être enregistré.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section className={styles.carte} aria-labelledby="badgeuse-titre">
      <div className={styles.entete}>
        <h2 id="badgeuse-titre" className={styles.titre}>
          Aujourd&apos;hui
        </h2>
        <time className={styles.horloge} dateTime={maintenant.toISOString()}>
          {formatHeure(maintenant, fuseau)}
        </time>
      </div>

      <span className={styles.lieu}>
        <Icon name={lieu === "Bureau" ? "org" : "house"} />
        {lieu} · selon planning
      </span>

      <div className={styles.actions}>
        <Button className={styles.bouton} onClick={pointer} chargement={enCours}>
          {libelle}
        </Button>
        <Link href="/pointages" className={styles.plus} aria-label="Plus d'actions : voir mes pointages, demander une correction">
          ···
        </Link>
      </div>

      {/* Le résultat du pointage est annoncé aux lecteurs d'écran */}
      <p className={styles.etat} aria-live="polite">
        {ouverte ? (
          <>
            En cours depuis <span className={styles.mono}>{formatHeure(ouverte.entryAt, fuseau)}</span> (
            <span className={styles.mono}>{formatDuree(minutesEntre(ouverte.entryAt, maintenant))}</span>)
          </>
        ) : (
          "Pas de session en cours"
        )}
      </p>

      {erreur && (
        <p className={styles.erreur} role="alert">
          <Icon name="warning" /> {erreur}
        </p>
      )}

      <div className={styles.sessions}>
        <span className={styles.sousTitre}>Sessions du jour</span>
        {sessionsDuJour.length === 0 ? (
          <span className={styles.vide}>Aucun pointage aujourd&apos;hui</span>
        ) : (
          <ul>
            {sessionsDuJour.map((s) => (
              <li key={s.entryAt} className={styles.mono}>
                {formatHeure(s.entryAt, fuseau)} → {s.exitAt ? formatHeure(s.exitAt, fuseau) : "en cours"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
