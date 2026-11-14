import type { ReactNode } from "react";
import { AppShell } from "@/components/layout";
import { SessionProvider } from "@/lib/auth/SessionProvider";

/*
 * Layout de toutes les pages connectées. Le dossier « (app) » est un groupe de routes :
 * les parenthèses n'apparaissent pas dans l'URL (/accueil, pas /app/accueil).
 * La session est chargée ici : sans session valide, l'utilisateur est renvoyé vers /connexion (TM-65).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
