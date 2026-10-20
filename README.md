# Time Manager

Epitech T-DEV-700. React client, FastAPI server, Postgres, behind a reverse proxy.

## Layout

```
client/   React + Vite + TypeScript  (npm run dev | build | test)
server/   FastAPI + psycopg          (uv sync, uv run uvicorn app.main:app --reload)
proxy/    nginx reverse proxy config: /api -> server, / -> client
.env.example  the variables every environment needs; copy to .env
```

Each service gets a `Dockerfile.dev` and a `Dockerfile.prod`; `docker-compose.yml`
runs production, `docker-compose.dev.yml` is the development override. The files are
in place and empty: the DevOps part is written by hand, step by step.

## Twin repositories

This project lives in two GitHub repositories that must hold exactly the same history:

| Repository | Role |
| --- | --- |
| `rronaldo007/time-manager` (personal) | Where the work happens. Pull requests, GitHub Actions, CI/CD. |
| `EpitechMscProPromo2028/T-DEV-700-LYN-7-1-time_manager-11` (organization) | The one that gets graded. SAML SSO and Actions are locked down there, so it only receives a copy. |

Twin means the same commits, same hashes, same authors and dates, in both places. Nothing
is ever committed on the organization repository directly: everything goes through the
personal one, otherwise the two diverge and the next push fails.

Two mechanisms keep them in sync:

1. **Local git config.** The `origin` remote has two push URLs, the personal repository
   then the organization one. A single `git push` from the laptop lands on both. It needs
   an SSH key authorized for the organization's SAML SSO.
2. **GitHub Actions.** `.github/workflows/mirror.yml` pushes `main` to the organization
   after every push or merge on the personal repository, with the `EPITECH_MIRROR_TOKEN`
   secret. This covers merges done on GitHub that never touch the laptop. Without the
   secret the workflow skips instead of failing.

To set up a clone:

```
git clone git@github.com:rronaldo007/time-manager.git
cd time-manager
git remote set-url --add --push origin git@github.com:rronaldo007/time-manager.git
git remote set-url --add --push origin git@github.com:EpitechMscProPromo2028/T-DEV-700-LYN-7-1-time_manager-11.git
git remote add epitech git@github.com:EpitechMscProPromo2028/T-DEV-700-LYN-7-1-time_manager-11.git
```

Check with `git remote -v`: `origin` must show two `(push)` lines.
