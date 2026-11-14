"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import { useSession } from "@/lib/auth/SessionProvider";
import { peutAcceder, type CompteurNav } from "@/lib/navigation";
import { Sidebar } from "./Sidebar";
import styles from "./AppShell.module.css";

/**
 * Compteurs PROVISOIRES des pastilles du menu manager (demandes à valider, anomalies).
 * TODO : les lire depuis l'API équipe quand les routes manager existeront.
 */
const COMPTEURS_PROVISOIRES: Record<CompteurNav, number> = { aValider: 5, anomalies: 4 };

/**
 * Squelette de toutes les pages connectées : menu de gauche + zone de contenu.
 * Attend la session, puis vérifie que le profil actif a le droit d'ouvrir la page (TM-65).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const pathname = usePathname();

  // Pendant le chargement ou la redirection vers /connexion : rien de sensible à l'écran
  if (session.statut !== "connecte") {
    return (
      <div className={styles.chargement} role="status">
        Chargement…
      </div>
    );
  }

  const profil = session.me.activeProfile.code;
  const autorise = peutAcceder(profil, pathname);

  return (
    <div className={styles.app}>
      {/* Lien d'évitement : permet aux utilisateurs clavier de sauter le menu */}
      <a href="#contenu" className={styles.evitement}>
        Aller au contenu
      </a>
      <Sidebar me={session.me} compteurs={COMPTEURS_PROVISOIRES} />
      <main id="contenu" className={styles.contenu} tabIndex={-1}>
        {autorise ? (
          children
        ) : (
          <Card titre="Accès refusé">
            <p>Votre profil ne permet pas d&apos;ouvrir cette page.</p>
            <p>
              <Link href="/accueil">Retour à l&apos;accueil</Link>
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
