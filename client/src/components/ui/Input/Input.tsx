"use client";

import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "../Icon/Icon";
import styles from "./Input.module.css";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Libellé visible, obligatoire pour l'accessibilité */
  label: string;
  /** Aide affichée sous le champ */
  aide?: string;
  /** Message d'erreur : met le champ en erreur et l'annonce aux lecteurs d'écran */
  erreur?: string;
};

export function Input({ label, aide, erreur, id, className, ...rest }: InputProps) {
  // Identifiants uniques pour relier libellé, aide et erreur au champ
  const autoId = useId();
  const champId = id ?? autoId;
  const aideId = aide ? `${champId}-aide` : undefined;
  const erreurId = erreur ? `${champId}-erreur` : undefined;

  return (
    <div className={cn(styles.groupe, className)}>
      <label htmlFor={champId} className={styles.label}>
        {label}
        {rest.required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={champId}
        className={cn(styles.champ, erreur && styles.champErreur)}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={[aideId, erreurId].filter(Boolean).join(" ") || undefined}
        {...rest}
      />
      {aide && (
        <p id={aideId} className={styles.aide}>
          {aide}
        </p>
      )}
      {erreur && (
        // Icône + texte : l'erreur n'est jamais signalée par la seule couleur
        <p id={erreurId} className={styles.erreur} role="alert">
          <Icon name="warning" size={16} />
          {erreur}
        </p>
      )}
    </div>
  );
}
