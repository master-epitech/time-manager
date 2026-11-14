import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Connexion · Time Manager" };

/** Page de connexion (TM-64), d'après la maquette « 01 · Connexion ». Hors du layout de l'application : pas de menu. */
export default function ConnexionPage() {
  return (
    <main className={styles.page}>
      <div className={styles.carte}>
        <div className={styles.marque}>
          <span className={styles.logo} aria-hidden="true">
            TM
          </span>
          <span>Time Manager</span>
        </div>

        <h1 className={styles.titre}>Connexion</h1>
        <p className={styles.sousTitre}>Votre compte est créé par votre manager.</p>

        <LoginForm />

        <p className={styles.mention}>Pas d&apos;inscription publique · Données traitées conformément au RGPD</p>
      </div>
    </main>
  );
}
