import type { ReactNode } from "react";
import { AppShell } from "@/components/layout";
import { COMPTEURS_FACTICES, UTILISATEUR_FACTICE } from "@/lib/session-factice";

/*
 * Layout de toutes les pages connectées. Le dossier « (app) » est un groupe de routes :
 * les parenthèses n'apparaissent pas dans l'URL (/accueil, pas /app/accueil).
 * TODO TM-65 : remplacer les données factices par la session réelle et rediriger vers /connexion si absente.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell utilisateur={UTILISATEUR_FACTICE} compteurs={COMPTEURS_FACTICES}>
      {children}
    </AppShell>
  );
}
