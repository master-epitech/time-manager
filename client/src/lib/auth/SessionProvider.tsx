"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, onSessionExpired, type MeContext } from "@/lib/api";

type Session =
  | { statut: "chargement" }
  | { statut: "connecte"; me: MeContext }
  | { statut: "anonyme" };

type SessionContexte = {
  session: Session;
  deconnecter: () => Promise<void>;
};

const Contexte = createContext<SessionContexte | null>(null);

/**
 * Charge l'utilisateur connecté (GET /auth/me) et le met à disposition de toute l'application.
 * Sans session valide (non connecté ou session expirée), renvoie vers /connexion (TM-65).
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session>({ statut: "chargement" });

  const versConnexion = useCallback(() => {
    setSession({ statut: "anonyme" });
    router.replace("/connexion");
  }, [router]);

  useEffect(() => {
    let actif = true;
    api.auth
      .me()
      .then((me) => actif && setSession({ statut: "connecte", me }))
      .catch(() => actif && versConnexion());
    // Une réponse 401 sur n'importe quel appel signifie que la session a expiré
    const desabonner = onSessionExpired(versConnexion);
    return () => {
      actif = false;
      desabonner();
    };
  }, [versConnexion]);

  const deconnecter = useCallback(async () => {
    await api.auth.logout();
    setSession({ statut: "anonyme" });
    router.replace("/connexion");
  }, [router]);

  return <Contexte.Provider value={{ session, deconnecter }}>{children}</Contexte.Provider>;
}

/** Accès à la session depuis n'importe quel composant de l'application */
export function useSession(): SessionContexte {
  const contexte = useContext(Contexte);
  if (!contexte) throw new Error("useSession doit être utilisé sous <SessionProvider>");
  return contexte;
}
