"use client";

import { useEffect, useState } from "react";

/** Heure courante, rafraîchie toutes les `intervalleMs` (horloge et durées en cours) */
export function useMaintenant(intervalleMs = 15_000): Date {
  const [maintenant, setMaintenant] = useState(() => new Date());
  useEffect(() => {
    const minuteur = setInterval(() => setMaintenant(new Date()), intervalleMs);
    return () => clearInterval(minuteur);
  }, [intervalleMs]);
  return maintenant;
}
