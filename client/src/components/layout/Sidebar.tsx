"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { MeContext } from "@/lib/api";
import { LIBELLE_PROFIL } from "@/lib/auth/roles";
import { useSession } from "@/lib/auth/SessionProvider";
import { LIEN_COMPTE, sectionsPour, type CompteurNav, type LienNav } from "@/lib/navigation";
import { useNavAgrandie } from "@/lib/useNavAgrandie";
import styles from "./Sidebar.module.css";

type SidebarProps = {
  me: MeContext;
  compteurs: Record<CompteurNav, number>;
};

/** Menu de gauche : réduit par défaut (icônes), agrandissable, filtré selon le rôle. */
export function Sidebar({ me, compteurs }: SidebarProps) {
  const pathname = usePathname();
  const { deconnecter } = useSession();
  const [agrandie, basculer] = useNavAgrandie();
  const { user, activeProfile } = me;
  const sections = sectionsPour(activeProfile.code);

  const estActif = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const renduLien = (lien: LienNav) => {
    const actif = estActif(lien.href);
    const nombre = lien.compteur ? compteurs[lien.compteur] : 0;
    return (
      <li key={lien.href}>
        <Link
          href={lien.href}
          className={cn(styles.lien, actif && styles.actif)}
          aria-current={actif ? "page" : undefined}
          title={agrandie ? undefined : lien.label}
        >
          {/* Icône dans la couleur de son domaine, blanche sur le lien actif */}
          <span
            className={styles.icone}
            style={{ color: actif ? "var(--surface)" : `var(--${lien.domaine ?? "gris"})` }}
          >
            <Icon name={lien.icone} />
          </span>
          <span className={styles.libelle}>{lien.label}</span>
          {nombre > 0 && (
            <span className={styles.pastille}>
              {nombre}
              <span className="sr-only"> en attente</span>
            </span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label="Navigation principale"
      className={cn(styles.nav, agrandie ? styles.agrandie : styles.reduite)}
    >
      <div className={styles.marque}>
        <span className={styles.logo} aria-hidden="true">
          TM
        </span>
        <span className={styles.libelle}>Time Manager</span>
      </div>

      <button
        type="button"
        className={styles.bascule}
        onClick={basculer}
        aria-expanded={agrandie}
        aria-label={agrandie ? "Réduire le menu" : "Agrandir le menu"}
      >
        <span className={styles.libelle} aria-hidden="true">
          Réduire
        </span>
        <Icon name="chevrons" className={styles.chevron} />
      </button>

      <div className={styles.sections}>
        {sections.map((section) => (
          <div key={section.titre} className={styles.section}>
            <p className={styles.titreSection} id={`nav-${section.titre}`}>
              {section.titre}
            </p>
            <ul aria-labelledby={`nav-${section.titre}`}>{section.liens.map(renduLien)}</ul>
          </div>
        ))}
      </div>

      <div className={styles.pied}>
        <ul>
          {renduLien(LIEN_COMPTE)}
          <li>
            <button
              type="button"
              className={styles.lien}
              onClick={deconnecter}
              title={agrandie ? undefined : "Se déconnecter"}
            >
              <span className={styles.icone} style={{ color: "var(--gris)" }}>
                <Icon name="logout" />
              </span>
              <span className={styles.libelle}>Se déconnecter</span>
            </button>
          </li>
        </ul>
        <div className={styles.utilisateur}>
          <span className={styles.avatar} aria-hidden="true">
            {user.firstName[0]}
            {user.lastName[0]}
          </span>
          <span className={styles.libelle}>
            <strong>
              {user.firstName} {user.lastName}
            </strong>
            <small>
              {LIBELLE_PROFIL[activeProfile.code]}
              {user.teamName && ` · ${user.teamName}`}
            </small>
          </span>
        </div>
      </div>
    </nav>
  );
}
