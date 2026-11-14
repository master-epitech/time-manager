import type { SVGProps } from "react";

/**
 * Icônes de l'application (trait 2 px, style des maquettes).
 * Un seul composant pour toutes les icônes : on ajoute un tracé dans PATHS
 * plutôt que de créer un fichier par icône.
 */
const PATHS = {
  // Domaines
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  sun: "M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  house: "M3 11 12 4l9 7M5 10v10h14V10M10 20v-6h4v6",
  warning: "M12 4 2.5 20h19L12 4ZM12 10v4M12 17h.01",
  doc: "M7 3h7l5 5v13H7V3ZM14 3v5h5M10 13h6M10 17h6",
  // Navigation
  grid: "M4 4h7v7H4V4ZM13 4h7v7h-7V4ZM4 13h7v7H4v-7ZM13 13h7v7h-7v-7Z",
  calendar: "M4 6h16v14H4V6ZM4 10h16M8 3v4M16 3v4",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14c2 .8 3 2.9 3 6",
  "check-square": "M4 4h16v16H4V4ZM8 12l3 3 5-6",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c0-4.4 3.6-8 8-8s8 3.6 8 8",
  org: "M9 3h6v5H9V3ZM3 16h6v5H3v-5ZM15 16h6v5h-6v-5ZM12 8v4M6 16v-4h12v4",
  "user-circle": "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6.5 18.5c1.2-1.9 3.2-3 5.5-3s4.3 1.1 5.5 3",
  chevrons: "M11 17l-5-5 5-5M18 17l-5-5 5-5",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  // Utilitaires
  check: "M5 12l5 5 9-10",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01",
} as const;

export type IconName = keyof typeof PATHS;

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  name: IconName;
  size?: number;
  /** Texte lu par les lecteurs d'écran. Sans titre, l'icône est décorative. */
  title?: string;
};

export function Icon({ name, size = 18, title, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
      {...rest}
    >
      {title && <title>{title}</title>}
      <path d={PATHS[name]} />
    </svg>
  );
}
