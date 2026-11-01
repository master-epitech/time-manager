"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { LIEN_COMPTE, SECTIONS_NAV, type CompteurNav, type LienNav } from "@/lib/navigation";
import type { UtilisateurConnecte } from "@/lib/session-factice";
import { useNavAgrandie } from "@/lib/useNavAgrandie";
import styles from "./Sidebar.module.css";

type SidebarProps = {
  utilisateur: UtilisateurConnecte;
  compteurs: Record<CompteurNav, number>;
};

/** Menu de gauche : réduit par défaut (icônes), agrandissable, filtré selon le rôle. */
export function Sidebar({ utilisateur, compteurs }: SidebarProps) {
  const pathname = usePathname();
  const [agrandie, basculer] = useNavAgrandie();
  const sections = SECTIONS_NAV.filter((s) => s.roles.includes(utilisateur.role));

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
        <ul>{renduLien(LIEN_COMPTE)}</ul>
        <div className={styles.utilisateur}>
          <span className={styles.avatar} aria-hidden="true">
            {utilisateur.prenom[0]}
            {utilisateur.nom[0]}
          </span>
          <span className={styles.libelle}>
            <strong>
              {utilisateur.prenom} {utilisateur.nom}
            </strong>
            <small>{utilisateur.role === "manager" ? "Manager" : "Employé"} · {utilisateur.equipe}</small>
          </span>
        </div>
      </div>
    </nav>
  );
}
