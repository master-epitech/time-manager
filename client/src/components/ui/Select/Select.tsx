"use client";

import { useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "../Icon/Icon";
import styles from "../Input/Input.module.css";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Libellé visible, obligatoire pour l'accessibilité */
  label: string;
  options: { value: string; label: string }[];
  aide?: string;
  erreur?: string;
};

/** Liste déroulante native (accessible au clavier et sur mobile), même apparence que Input. */
export function Select({ label, options, aide, erreur, id, className, ...rest }: SelectProps) {
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
      <select
        id={champId}
        className={cn(styles.champ, erreur && styles.champErreur)}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={[aideId, erreurId].filter(Boolean).join(" ") || undefined}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {aide && (
        <p id={aideId} className={styles.aide}>
          {aide}
        </p>
      )}
      {erreur && (
        <p id={erreurId} className={styles.erreur} role="alert">
          <Icon name="warning" size={16} />
          {erreur}
        </p>
      )}
    </div>
  );
}
