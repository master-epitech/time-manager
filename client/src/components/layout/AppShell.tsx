import type { ReactNode } from "react";
import type { CompteurNav } from "@/lib/navigation";
import type { UtilisateurConnecte } from "@/lib/session-factice";
import { Sidebar } from "./Sidebar";
import styles from "./AppShell.module.css";

type AppShellProps = {
  utilisateur: UtilisateurConnecte;
  compteurs: Record<CompteurNav, number>;
  children: ReactNode;
};

/** Squelette de toutes les pages connectées : menu de gauche + zone de contenu. */
export function AppShell({ utilisateur, compteurs, children }: AppShellProps) {
  return (
    <div className={styles.app}>
      {/* Lien d'évitement : permet aux utilisateurs clavier de sauter le menu */}
      <a href="#contenu" className={styles.evitement}>
        Aller au contenu
      </a>
      <Sidebar utilisateur={utilisateur} compteurs={compteurs} />
      <main id="contenu" className={styles.contenu} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
