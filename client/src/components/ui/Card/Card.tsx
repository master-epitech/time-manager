import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Card.module.css";

type CardProps = {
  /** Titre de la carte (h2 par défaut) */
  titre?: string;
  /** Actions affichées à droite du titre (boutons, liens) */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Bloc de contenu blanc sur le fond lilas clair : base de tous les écrans. */
export function Card({ titre, actions, children, className }: CardProps) {
  return (
    <section className={cn(styles.carte, className)}>
      {(titre || actions) && (
        <header className={styles.entete}>
          {titre && <h2 className={styles.titre}>{titre}</h2>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
