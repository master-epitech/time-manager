import type { ReactNode } from "react";
import styles from "./PageHeader.module.css";

type PageHeaderProps = {
  titre: string;
  sousTitre?: string;
  /** Boutons d'action à droite du titre */
  actions?: ReactNode;
};

/** En-tête commun à tous les écrans : titre (h1), sous-titre, actions. */
export function PageHeader({ titre, sousTitre, actions }: PageHeaderProps) {
  return (
    <header className={styles.entete}>
      <div>
        <h1 className={styles.titre}>{titre}</h1>
        {sousTitre && <p className={styles.sousTitre}>{sousTitre}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
