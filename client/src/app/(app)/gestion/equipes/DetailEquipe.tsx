"use client";

import { useEffect, useState } from "react";
import { Button, Icon, Select } from "@/components/ui";
import { api, ApiError, type Department, type Team, type User } from "@/lib/api";
import styles from "./page.module.css";

type DetailEquipeProps = {
  equipe: Team;
  departement?: Department;
  /** Équipes actives vers lesquelles transférer un membre */
  destinations: Team[];
  /** RH / administrateur : renommer, désactiver, nommer le responsable */
  gestionComplete: boolean;
  onModifier: () => void;
  /** Appelé après chaque changement (effectifs, responsable, statut) */
  onChange: (message: string) => void;
};

const nomComplet = (u: { firstName: string; lastName: string }) => `${u.firstName} ${u.lastName}`;

/** Fiche d'une équipe : responsable (N+1), N+2, membres (ajout / retrait) — TM-70 */
export function DetailEquipe({ equipe, departement, destinations, gestionComplete, onModifier, onChange }: DetailEquipeProps) {
  const [membres, setMembres] = useState<User[] | null>(null);
  const [candidats, setCandidats] = useState<User[]>([]);
  const [version, setVersion] = useState(0);
  const [ajout, setAjout] = useState("");
  const [nouveauManager, setNouveauManager] = useState<string | null>(null);
  const [aRetirer, setARetirer] = useState<string | null>(null);
  // Transfert en cours : membre concerné et équipe d'arrivée choisie
  const [transfert, setTransfert] = useState<{ membre: string; vers: string } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let actif = true;
    Promise.all([
      api.users.list({ teamId: equipe.id, pageSize: 100 }),
      // Candidats à l'ajout : comptes actifs du périmètre, hors de cette équipe
      api.users.list({ status: "ACTIF", pageSize: 100 }),
    ])
      .then(([m, tous]) => {
        if (!actif) return;
        setMembres(m.data);
        setCandidats(tous.data.filter((u) => u.isActive && u.teamId !== equipe.id));
        setErreur(null);
      })
      .catch((e) => actif && setErreur(e instanceof ApiError ? e.message : "Impossible de charger les membres."));
    return () => {
      actif = false;
    };
  }, [equipe.id, version]);

  /** Lance une action, affiche l'erreur éventuelle, recharge la fiche et la liste */
  async function executer(action: () => Promise<unknown>, message: string) {
    setErreur(null);
    try {
      await action();
      setVersion((v) => v + 1);
      onChange(message);
    } catch (e) {
      setErreur(e instanceof ApiError ? e.message : "L'opération a échoué.");
    }
  }

  const aujourdhui = new Date().toISOString().slice(0, 10);
  const membresActifs = (membres ?? []).filter((m) => m.isActive);
  const vide = equipe.membersCount === 0;

  return (
    <section className={styles.detail} aria-labelledby="equipe-titre">
      <div className={styles.detailEntete}>
        <div>
          <h2 id="equipe-titre" className={styles.detailTitre}>
            {equipe.name}
            {!equipe.isActive && <span className={styles.etiquette}>Désactivée</span>}
          </h2>
          <p className={styles.secondaire}>
            {equipe.code} · {departement ? `Département ${departement.name}` : "Département inconnu"}
          </p>
        </div>
        {gestionComplete && equipe.isActive && (
          <div className={styles.boutons}>
            <Button variant="secondaire" taille="s" onClick={onModifier}>
              Modifier
            </Button>
            <Button
              variant="danger"
              taille="s"
              disabled={!vide}
              aria-describedby={vide ? undefined : "info-desactivation"}
              onClick={() => executer(() => api.teams.deactivate(equipe.id), `Équipe « ${equipe.name} » désactivée.`)}
            >
              Désactiver
            </Button>
          </div>
        )}
      </div>
      {gestionComplete && equipe.isActive && !vide && (
        <p id="info-desactivation" className={styles.secondaire}>
          Désactivation possible uniquement si l&apos;équipe est vide (ses membres ont été transférés).
        </p>
      )}

      {erreur && (
        <p className={styles.erreurGlobale} role="alert">
          <Icon name="warning" /> {erreur}
        </p>
      )}

      <div className={styles.hierarchie}>
        <div>
          <span className={styles.petitTitre}>Responsable (N+1 des membres)</span>
          {nouveauManager === null ? (
            <span className={styles.valeur}>
              {equipe.manager ? nomComplet(equipe.manager) : "Aucun responsable"}
              {gestionComplete && equipe.isActive && (
                <Button variant="discret" taille="s" onClick={() => setNouveauManager(equipe.manager?.id ?? membresActifs[0]?.id ?? "")}>
                  Changer
                </Button>
              )}
            </span>
          ) : (
            <div className={styles.choix}>
              <Select
                label="Nouveau responsable"
                value={nouveauManager}
                onChange={(e) => setNouveauManager(e.target.value)}
                options={[...membresActifs, ...candidats].map((u) => ({
                  value: u.id,
                  label: `${nomComplet(u)}${u.teamId === equipe.id ? "" : ` (${u.teamName ?? "sans équipe"})`}`,
                }))}
              />
              <Button
                taille="s"
                disabled={!nouveauManager}
                onClick={() => {
                  const choisi = nouveauManager;
                  setNouveauManager(null);
                  if (choisi) {
                    void executer(
                      () => api.teams.setManager(equipe.id, { userId: choisi, startDate: aujourdhui }),
                      "Responsable mis à jour.",
                    );
                  }
                }}
              >
                Valider
              </Button>
              <Button variant="discret" taille="s" onClick={() => setNouveauManager(null)}>
                Annuler
              </Button>
            </div>
          )}
        </div>
        <div>
          <span className={styles.petitTitre}>N+2</span>
          <span className={styles.valeur}>{departement?.manager ? `${nomComplet(departement.manager)} · Direction` : "—"}</span>
        </div>
      </div>

      <div className={styles.membresEntete}>
        <h3 className={styles.sousTitre}>Membres ({membresActifs.length})</h3>
      </div>

      {equipe.isActive && candidats.length > 0 && (
        <div className={styles.choix}>
          <Select
            label="Ajouter un membre"
            value={ajout}
            onChange={(e) => setAjout(e.target.value)}
            options={[
              { value: "", label: "Choisir un compte…" },
              ...candidats.map((u) => ({ value: u.id, label: `${nomComplet(u)} — ${u.teamName ?? "sans équipe"}` })),
            ]}
            aide="Un employé n'appartient qu'à une équipe : il quitte son équipe actuelle."
          />
          <Button
            taille="s"
            disabled={!ajout}
            onClick={() => {
              const choisi = candidats.find((u) => u.id === ajout);
              setAjout("");
              if (choisi) {
                void executer(() => api.teams.addMembers(equipe.id, [choisi.id]), `${nomComplet(choisi)} ajouté(e) à l'équipe.`);
              }
            }}
          >
            Ajouter
          </Button>
        </div>
      )}

      {membres === null ? (
        <p role="status" className={styles.secondaire}>
          Chargement…
        </p>
      ) : membres.length === 0 ? (
        <p className={styles.secondaire}>Aucun membre dans cette équipe.</p>
      ) : (
        <div className={styles.cadreTableau}>
          <table className={styles.tableau}>
            <caption className="sr-only">Membres de l&apos;équipe {equipe.name}</caption>
            <thead>
              <tr>
                <th scope="col">Membre</th>
                <th scope="col">Matricule</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {(membres ?? []).map((m) => {
                const estManager = equipe.manager?.id === m.id;
                return (
                  <tr key={m.id} className={m.isActive ? undefined : styles.inactif}>
                    <th scope="row">
                      <strong>{nomComplet(m)}</strong>
                      <span className={styles.secondaire}>
                        {!m.isActive ? "Compte désactivé" : estManager ? "Responsable" : (m.jobTitle ?? "—")}
                      </span>
                    </th>
                    <td className={styles.mono}>{m.matricule}</td>
                    <td>
                      {/* Actions réservées aux RH ; le responsable reste en place (en nommer un autre d'abord) */}
                      {gestionComplete && !estManager && (
                        <ActionsMembre
                          membre={m}
                          destinations={destinations}
                          transfert={transfert?.membre === m.id ? transfert.vers : null}
                          confirmerRetrait={aRetirer === m.id}
                          onTransfert={(vers) => setTransfert(vers === null ? null : { membre: m.id, vers })}
                          onValiderTransfert={() => {
                            const arrivee = destinations.find((t) => t.id === transfert?.vers);
                            setTransfert(null);
                            if (arrivee) {
                              void executer(
                                () => api.teams.addMembers(arrivee.id, [m.id]),
                                `${nomComplet(m)} transféré(e) vers « ${arrivee.name} ».`,
                              );
                            }
                          }}
                          onRetrait={(confirmer) => setARetirer(confirmer ? m.id : null)}
                          onValiderRetrait={() => {
                            setARetirer(null);
                            void executer(() => api.teams.removeMember(equipe.id, m.id), `${nomComplet(m)} retiré(e) de l'équipe.`);
                          }}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className={styles.secondaire}>
        Un employé actif appartient toujours à une équipe : on le transfère, on ne le retire pas. Seul un compte désactivé
        peut être retiré. Validation du transfert par l&apos;ancien manager : à trancher (TM-100).
      </p>
    </section>
  );
}

type ActionsMembreProps = {
  membre: User;
  destinations: Team[];
  /** Équipe d'arrivée choisie ; null = pas de transfert en cours */
  transfert: string | null;
  confirmerRetrait: boolean;
  onTransfert: (vers: string | null) => void;
  onValiderTransfert: () => void;
  onRetrait: (confirmer: boolean) => void;
  onValiderRetrait: () => void;
};

/** Transférer un membre actif vers une autre équipe, ou retirer un compte désactivé */
function ActionsMembre(props: ActionsMembreProps) {
  const { membre, destinations, transfert, confirmerRetrait } = props;
  const nom = nomComplet(membre);

  if (!membre.isActive) {
    return (
      <div className={styles.boutons}>
        {confirmerRetrait ? (
          <>
            <Button variant="danger" taille="s" onClick={props.onValiderRetrait}>
              Confirmer
            </Button>
            <Button variant="discret" taille="s" onClick={() => props.onRetrait(false)}>
              Annuler
            </Button>
          </>
        ) : (
          <Button variant="discret" taille="s" onClick={() => props.onRetrait(true)} aria-label={`Retirer ${nom}`}>
            Retirer
          </Button>
        )}
      </div>
    );
  }

  if (transfert === null) {
    return (
      <div className={styles.boutons}>
        <Button
          variant="secondaire"
          taille="s"
          disabled={destinations.length === 0}
          onClick={() => props.onTransfert(destinations[0]?.id ?? "")}
          aria-label={`Transférer ${nom}`}
        >
          Transférer…
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.choix}>
      <Select
        label={`Transférer ${nom} vers`}
        value={transfert}
        onChange={(e) => props.onTransfert(e.target.value)}
        options={destinations.map((t) => ({ value: t.id, label: t.name }))}
      />
      <Button taille="s" onClick={props.onValiderTransfert}>
        Valider
      </Button>
      <Button variant="discret" taille="s" onClick={() => props.onTransfert(null)}>
        Annuler
      </Button>
    </div>
  );
}
