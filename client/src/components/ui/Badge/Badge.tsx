import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { DOMAINS, type Domain } from "@/lib/domains";
import { Icon } from "../Icon/Icon";
import styles from "./Badge.module.css";

type BadgeProps = {
  /** Domaine métier : fixe la couleur ET l'icône du badge */
  domaine: Domain;
  /** Texte du badge ; par défaut, le nom du domaine */
  children?: ReactNode;
  className?: string;
};

/** Étiquette de statut ou de catégorie, toujours icône + texte (jamais la couleur seule). */
export function Badge({ domaine, children, className }: BadgeProps) {
  const { label, icon } = DOMAINS[domaine];
  return (
    <span className={cn(styles.badge, styles[domaine], className)}>
      <Icon name={icon} size={14} />
      {children ?? label}
    </span>
  );
}
