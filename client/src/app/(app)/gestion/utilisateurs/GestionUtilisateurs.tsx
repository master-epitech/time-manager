"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout";
import { Button, Card, Icon, Input, Select } from "@/components/ui";
import { api, ApiError, type ListResponse, type ProfileCode, type Team, type User, type UserStatus } from "@/lib/api";
import { LIBELLE_PROFIL } from "@/lib/auth/roles";
import { useSession } from "@/lib/auth/SessionProvider";
import { dateFr, equipesAutorisees, etatCompte, LIBELLE_CONTRAT } from "@/lib/comptes";
import { cn } from "@/lib/cn";
import { FormulaireCompte } from "./FormulaireCompte";
import styles from "./page.module.css";

const TAILLE_PAGE = 20;

/** Profils qui gèrent tous les comptes ; le manager ne gère que son équipe et ne crée que des employés */
const GESTION_COMPLETE: ProfileCode[] = ["HR", "SUPER_ADMIN"];
const PROFILS_ATTRIBUABLES: ProfileCode[] = ["EMPLOYEE", "MANAGER", "HR", "DIRECTOR", "CEO"];

type Panneau = { mode: "creation" } | { mode: "modification"; compte: User } | null;

export function GestionUtilisateurs() {
  const { session } = useSession();
  const me = session.statut === "connecte" ? session.me : null;
  const gestionComplete = me ? GESTION_COMPLETE.includes(me.activeProfile.code) : false;

  // Filtres : la recherche est appliquée 300 ms après la dernière frappe
  const [saisie, setSaisie] = useState("");
  const [recherche, setRecherche] = useState("");
  const [profil, setProfil] = useState<ProfileCode | "">("");
  const [statut, setStatut] = useState<UserStatus | "">("");
  const [page, setPage] = useState(1);

  const [resultat, setResultat] = useState<ListResponse<User> | null>(null);
  const [equipes, setEquipes] = useState<Team[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [version, setVersion] = useState(0); // incrémentée après chaque modification pour recharger
  const [panneau, setPanneau] = useState<Panneau>(null);
  const [aConfirmer, setAConfirmer] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const minuteur = setTimeout(() => {
      setRecherche(saisie.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(minuteur);
  }, [saisie]);

  useEffect(() => {
    let actif = true;
    api.users
      .list({ q: recherche, profileCode: profil || undefined, status: statut || undefined, page, pageSize: TAILLE_PAGE })
      .then((r) => {
        if (!actif) return;
        setResultat(r);
        setErreur(null);
      })
      .catch((e) => actif && setErreur(e instanceof ApiError ? e.message : "Impossible de charger les comptes."));
    return () => {
      actif = false;
    };
  }, [recherche, profil, statut, page, version]);

  useEffect(() => {
    let actif = true;
    api.teams
      .list()
      .then((r) => actif && setEquipes(r.data))
      .catch(() => actif && setEquipes([]));
    return () => {
      actif = false;
    };
  }, []);

  if (!me) return null;

  const equipesFormulaire = equipesAutorisees(equipes, me.user.id, gestionComplete);
  const profilsFormulaire: ProfileCode[] = gestionComplete ? PROFILS_ATTRIBUABLES : ["EMPLOYEE"];
  const meta = resultat?.meta;

  async function changerActivation(compte: User) {
    setAConfirmer(null);
    try {
      if (compte.isActive) await api.users.deactivate(compte.id);
      else await api.users.activate(compte.id);
      setMessage(`Compte de ${compte.firstName} ${compte.lastName} ${compte.isActive ? "désactivé" : "réactivé"}.`);
      setVersion((v) => v + 1);
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "L'opération a échoué.");
    }
  }

  function apresEnregistrement(compte: User, cree: boolean) {
    setPanneau(null);
    setMessage(
      cree
        ? `Compte créé : ${compte.firstName} ${compte.lastName} · matricule ${compte.matricule}.`
        : `Compte de ${compte.firstName} ${compte.lastName} enregistré.`,
    );
    setVersion((v) => v + 1);
  }

  return (
    <>
      <PageHeader
        titre="Utilisateurs"
        sousTitre={gestionComplete ? "Tous les comptes de l'organisation" : "Comptes de votre équipe · pas d'inscription publique"}
        actions={
          <Button onClick={() => setPanneau({ mode: "creation" })} disabled={equipesFormulaire.length === 0}>
            + Créer un compte
          </Button>
        }
      />

      {message && (
        <p className={styles.message} role="status">
          <Icon name="check" /> {message}
        </p>
      )}

      <div className={styles.grille}>
        <section className={styles.liste} aria-label="Liste des utilisateurs">
          <div className={styles.filtres}>
            <Input
              label="Rechercher"
              type="search"
              placeholder="Nom, email ou matricule"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
            />
            <Select
              label="Profil"
              value={profil}
              onChange={(e) => {
                setProfil(e.target.value as ProfileCode | "");
                setPage(1);
              }}
              options={[
                { value: "", label: "Tous" },
                ...PROFILS_ATTRIBUABLES.map((p) => ({ value: p, label: LIBELLE_PROFIL[p] })),
              ]}
            />
            <Select
              label="Statut"
              value={statut}
              onChange={(e) => {
                setStatut(e.target.value as UserStatus | "");
                setPage(1);
              }}
              options={[
                { value: "", label: "Tous" },
                { value: "ACTIF", label: "Actif" },
                { value: "SUSPENDU", label: "Suspendu" },
                { value: "SORTI", label: "Sorti" },
              ]}
            />
          </div>

          {erreur ? (
            <Card>
              <p role="alert">{erreur}</p>
            </Card>
          ) : !resultat ? (
            <p role="status" className={styles.discret}>
              Chargement…
            </p>
          ) : resultat.data.length === 0 ? (
            <Card>
              <p>Aucun compte ne correspond à ces critères.</p>
            </Card>
          ) : (
            <div className={styles.cadreTableau}>
              <table className={styles.tableau}>
                <caption className="sr-only">
                  Comptes utilisateurs{meta ? `, ${meta.total} au total` : ""}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Utilisateur</th>
                    <th scope="col">Matricule</th>
                    <th scope="col">Équipe · profil</th>
                    <th scope="col">Contrat</th>
                    <th scope="col">Compte</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resultat.data.map((u) => {
                    const etat = etatCompte(u);
                    const nom = `${u.firstName} ${u.lastName}`;
                    return (
                      <tr key={u.id} className={u.isActive ? undefined : styles.inactif}>
                        <th scope="row">
                          <strong>{nom}</strong>
                          <span className={styles.secondaire}>
                            {u.departureDate ? `départ le ${dateFr(u.departureDate)}` : u.email}
                          </span>
                        </th>
                        <td className={styles.mono}>{u.matricule}</td>
                        <td>
                          {u.teamName ?? "Sans équipe"} · {u.profileCodes.map((p) => LIBELLE_PROFIL[p]).join(", ")}
                        </td>
                        <td>{LIBELLE_CONTRAT[u.contractType]}</td>
                        <td>
                          <span className={cn(styles.etat, styles[etat.ton])}>
                            <Icon name={etat.ton === "actif" ? "check" : etat.ton === "attention" ? "warning" : "info"} size={14} />
                            {etat.texte}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actions}>
                            {aConfirmer === u.id ? (
                              <>
                                <Button variant="danger" taille="s" onClick={() => changerActivation(u)}>
                                  Confirmer
                                </Button>
                                <Button variant="discret" taille="s" onClick={() => setAConfirmer(null)}>
                                  Annuler
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="secondaire"
                                  taille="s"
                                  onClick={() => setPanneau({ mode: "modification", compte: u })}
                                  aria-label={`Modifier ${nom}`}
                                >
                                  Modifier
                                </Button>
                                {u.isActive ? (
                                  u.id !== me.user.id && (
                                    <Button
                                      variant="discret"
                                      taille="s"
                                      onClick={() => setAConfirmer(u.id)}
                                      aria-label={`Désactiver ${nom}`}
                                    >
                                      Désactiver
                                    </Button>
                                  )
                                ) : (
                                  <Button variant="discret" taille="s" onClick={() => changerActivation(u)} aria-label={`Réactiver ${nom}`}>
                                    Réactiver
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Pagination">
              <Button variant="secondaire" taille="s" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Précédent
              </Button>
              <span>
                Page {meta.page} sur {meta.totalPages}
              </span>
              <Button variant="secondaire" taille="s" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                Suivant
              </Button>
            </nav>
          )}

          <p className={styles.discret}>
            Un compte désactivé ne peut plus se connecter ; son historique est conservé. Le matricule est unique et ne change
            jamais.
          </p>
        </section>

        {panneau && (
          <FormulaireCompte
            // La clé recrée le formulaire quand on passe d'un compte à un autre
            key={panneau.mode === "modification" ? panneau.compte.id : "creation"}
            compte={panneau.mode === "modification" ? panneau.compte : undefined}
            equipes={
              panneau.mode === "modification"
                ? // En modification, l'équipe actuelle reste proposée même hors périmètre
                  [...equipesFormulaire, ...equipes.filter((e) => e.id === panneau.compte.teamId && !equipesFormulaire.includes(e))]
                : equipesFormulaire
            }
            profils={profilsFormulaire}
            domaine={me.organisation.emailDomain}
            onEnregistre={apresEnregistrement}
            onFermer={() => setPanneau(null)}
          />
        )}
      </div>
    </>
  );
}
