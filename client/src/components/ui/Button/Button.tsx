import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Button.module.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** primaire = action principale (1 par écran), secondaire, discret, ou danger (action irréversible) */
  variant?: "primaire" | "secondaire" | "discret" | "danger";
  taille?: "m" | "s";
  /** Icône affichée avant le libellé */
  icone?: ReactNode;
  /** Affiche un état de chargement et désactive le bouton */
  chargement?: boolean;
};

export function Button({
  variant = "primaire",
  taille = "m",
  icone,
  chargement = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(styles.bouton, styles[variant], styles[taille], className)}
      disabled={disabled || chargement}
      aria-busy={chargement || undefined}
      {...rest}
    >
      {chargement ? <span className={styles.spinner} aria-hidden="true" /> : icone}
      <span>{children}</span>
    </button>
  );
}
