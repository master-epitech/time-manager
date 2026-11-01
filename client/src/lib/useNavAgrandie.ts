"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
 * Mémorise si le menu de gauche est agrandi, d'une page à l'autre.
 * - Réduit par défaut (et côté serveur) pour éviter tout décalage au chargement.
 * - localStorage peut être indisponible (navigation privée) : on garde alors la valeur en mémoire.
 */
const CLE = "tm-nav-agrandie";
const EVENEMENT = "tm-nav-change";
let valeurMemoire = false;

function lire(): boolean {
  try {
    return localStorage.getItem(CLE) === "1";
  } catch {
    return valeurMemoire;
  }
}

function sAbonner(rappel: () => void) {
  window.addEventListener("storage", rappel);
  window.addEventListener(EVENEMENT, rappel);
  return () => {
    window.removeEventListener("storage", rappel);
    window.removeEventListener(EVENEMENT, rappel);
  };
}

export function useNavAgrandie(): [boolean, () => void] {
  const agrandie = useSyncExternalStore(sAbonner, lire, () => false);

  const basculer = useCallback(() => {
    valeurMemoire = !lire();
    try {
      localStorage.setItem(CLE, valeurMemoire ? "1" : "0");
    } catch {
      /* stockage indisponible : la valeur en mémoire suffit */
    }
    window.dispatchEvent(new Event(EVENEMENT));
  }, []);

  return [agrandie, basculer];
}
