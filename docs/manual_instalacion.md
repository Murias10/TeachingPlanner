# 7.1 Installation Manual

## 7.1.1 Introduction

This manual is aimed at a technical audience with basic knowledge of the terminal, Docker, and Linux system administration. Its goal is to provide all the information needed to reproduce a TeachingPlanner installation from scratch, both in a local development environment and on a production server.

The application consists of the following components:

- **4 Node.js/Express microservices** (authentication, user management, planning, and gateway)
- **2 MariaDB 11 databases** (one for planning, one for user management)
- **1 React 19 web application** served by the Caddy web server

All components are orchestrated with Docker Compose. In production, Docker images are built automatically via GitHub Actions and stored in GitHub Container Registry (GHCR).

The manual covers three installation scenarios:

1. **Local development environment**: Docker Compose for microservices and databases, with the Vite development server for the webapp.
2. **Deployment on a publicly accessible virtual machine**: images from GHCR, CI/CD via GitHub Actions with SSH access to the server.
3. **Deployment on a virtual machine in a private network**: a self-hosted GitHub Actions runner installed directly on the VM, required when the server is not reachable from the internet.

---

## 7.1.2 Application architecture

```mermaid
flowchart TD
    Browser["Client (browser)"]

    Browser -->|"HTTPS :443"| Webapp

    subgraph Webapp["webapp — Caddy"]
        W1["Serves the React SPA"]
        W2["Proxies /api/* to gateway_service"]
    end

    Webapp -->|"HTTP :8080"| Gateway

    subgraph Gateway["gateway_service"]
        G1["Routes requests to microservices"]
    end

    Gateway --> Auth["auth_service\n:5003"]
    Gateway --> User["user_service\n:5002"]
    Gateway --> Planner["planner_service\n:5001"]

    Auth --> MgmtDB["management_database :3306\nMariaDB 11"]
    User --> MgmtDB
    Planner --> PlannerDB["planner_database :3306\nMariaDB 11"]
```

The `auth_service` and `user_service` microservices share the `management_database`. The `planner_service` microservice uses `planner_database` exclusively.

---

## 7.1.3 Prerequisites

### For the local development environment

| Tool | Minimum version | Purpose |
|---|---|---|
| Git | 2.x | Obtain the source code |
| Docker Engine | 24.x | Run containers |
| Docker Compose Plugin | 2.20 | Orchestrate services |
| Node.js | 20 LTS | Run the webapp in development mode |
| npm | 10.x | Manage webapp dependencies |

### For virtual machine deployment

| Tool | Minimum version | Purpose |
|---|---|---|
| Git | 2.x | Clone the repository |
| Docker Engine | 24.x | Run containers |
| Docker Compose Plugin | 2.20 | Orchestrate services |
| OpenSSL | any | Generate self-signed SSL certificates |

Ubuntu 22.04 LTS (or later) is recommended as the server operating system. Ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) must be accessible.

---

## 7.1.4 Obtaining the source code

```bash
git clone https://github.com/murias10/teachingplanner.git
cd TeachingPlanner
```

---

## 7.1.5 Local development environment

The typical development workflow combines Docker Compose for microservices and databases with the Vite development server for the webapp. This separation allows frontend code changes to be reflected instantly in the browser via hot-module replacement (HMR) without rebuilding or restarting any container. If a microservice is modified, only that container needs to be rebuilt.

### Step 1 — Configure environment variables

Copy the template and edit the resulting file:

```bash
cp .env.template .env
```

#### Planning database (used by `planner_service`)

| Variable | Description | Example value |
|---|---|---|
| `PLANNER_DATABASE_ROOT_PASSWORD` | Password for the MariaDB `root` user | `rootpassword` |
| `PLANNER_DATABASE_DATABASE` | Name of the database to create | `planner_db` |
| `PLANNER_DATABASE_USER` | Application user in MariaDB | `planner_user` |
| `PLANNER_DATABASE_PASSWORD` | Password for the application user | `planner_password` |
| `PLANNER_DATABASE_PORT` | MariaDB listening port | `3306` |
| `PLANNER_DATABASE_HOST` | Container name (resolved by Docker's internal DNS) | `planner_database` |

#### Management database (used by `auth_service` and `user_service`)

| Variable | Description | Example value |
|---|---|---|
| `MANAGEMENT_DATABASE_ROOT_PASSWORD` | Password for the MariaDB `root` user | `rootpassword` |
| `MANAGEMENT_DATABASE_DATABASE` | Database name | `management_db` |
| `MANAGEMENT_DATABASE_USER` | Application user | `management_user` |
| `MANAGEMENT_DATABASE_PASSWORD` | User password | `management_password` |
| `MANAGEMENT_DATABASE_PORT` | Host port mapped to MariaDB (the container always uses 3306 internally) | `3307` |
| `MANAGEMENT_DATABASE_HOST` | Container name | `management_database` |

#### Backend microservices

| Variable | Description | Default value |
|---|---|---|
| `PLANNER_SERVICE_PORT` | Port on which `planner_service` listens | `5001` |
| `PLANNER_SERVICE_HOST` | Container name | `planner_service` |
| `AUTH_SERVICE_PORT` | Port of `auth_service` | `5003` |
| `AUTH_SERVICE_HOST` | Container name | `auth_service` |
| `AUTH_SERVICE_URL` | Full internal URL of `auth_service`, used by other services for inter-container communication | `http://auth_service:5003` |
| `USER_SERVICE_PORT` | Port of `user_service` | `5002` |
| `USER_SERVICE_HOST` | Container name | `user_service` |
| `GATEWAY_SERVICE_PORT` | Port of `gateway_service` | `8080` |
| `GATEWAY_SERVICE_HOST` | Container name | `gateway_service` |

#### Web application

| Variable | Description | Value |
|---|---|---|
| `WEBAPP_PORT` | External port exposed by Caddy | `80` in production, `3000` in development |
| `WEBAPP_HOST` | Webapp container name | `webapp` |
| `DOMAIN` | Domain used by Caddy to serve the application. With `localhost` it serves over HTTP; with a real domain it enables HTTPS using the mounted certificate | `localhost` in development |
| `SERVER_IP` | Public IP of the server, added to the CORS allowlist of `gateway_service`. Required when the application is accessed directly by IP (without a domain) | Server's public IP |
| `FRONTEND_URL` | Base URL of the frontend, used by `user_service` to build links in account activation and password recovery emails | `http://localhost:5173` in development |

#### Security and authentication

| Variable | Description | How to generate |
|---|---|---|
| `JWT_SECRET` | Secret key for signing and verifying JWT tokens. Minimum 32 characters | `openssl rand -base64 48` |
| `ENCRYPTION_KEY` | 32-byte hexadecimal key for encrypting Google OAuth tokens stored in the database | `openssl rand -hex 32` |

#### Email (SMTP)

The email sending functionality (account activation and password recovery) requires configuring an SMTP server.

| Variable | Description | Gmail example |
|---|---|---|
| `SMTP_HOST` | SMTP server address | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | Email address | `your_email@gmail.com` |
| `SMTP_PASS` | SMTP server password | 16-character app password |
| `SMTP_FROM` | Address shown as sender in emails | `noreply@yourdomain.com` |

> **Note on Gmail**: to use Gmail as an SMTP server you must use a 16-character **App Password**, not the regular Google account password. Generate it at: Google Account → Security → 2-Step Verification → App passwords.

#### Password reset token expiry

| Variable | Description | Default value |
|---|---|---|
| `PASSWORD_RESET_TOKEN_EXPIRY` | Validity period of the reset token, in milliseconds | `1800000` (30 minutes) |
| `PASSWORD_RESET_OTP_EXPIRY` | Validity period of the OTP code, in milliseconds | `900000` (15 minutes) |
| `PASSWORD_RESET_OTP_COOLDOWN` | Minimum wait time between OTP requests, in milliseconds | `60000` (1 minute) |

#### Google Calendar integration (optional)

The Google Calendar integration is an optional feature that allows users to manually export their plannings to their calendar. Synchronisation is triggered from the administration interface; there is no automatic background process.

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Client ID of the project created in Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Client Secret of the project |
| `GOOGLE_REDIRECT_URI` | OAuth callback URI registered in Google Cloud Console (e.g. `https://<domain>/api/auth/google/callback`) |

To set up Google OAuth from scratch:
1. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the Google Calendar API
3. Configure the OAuth consent screen (type "External")
4. Create credentials of type "OAuth Client ID" for a web application
5. Register the authorised JavaScript origins and redirect URIs for each environment (development and production)
6. Copy the Client ID and Client Secret to the `.env` file

### Step 2 — Start the backend and databases with Docker

The following command builds the microservice images from the local source code and starts all backend containers in the background:

```bash
docker compose -f docker-compose.dev.yml up --build -d \
  planner_database management_database \
  auth_service user_service planner_service gateway_service
```

This command:
- Builds the images for all 4 microservices from source
- Starts both MariaDB 11 instances
- Starts the 4 Node.js microservices
- Creates the database schemas automatically via TypeORM (`synchronize: true`); no migration scripts need to be run manually
- Inserts the initial system users from `auth_service/init-data.sql` on the first start

Services have **healthchecks** configured: microservices wait for databases to be available before attempting to connect. To check that all containers are running:

```bash
docker compose -f docker-compose.dev.yml ps
```

If a microservice is changed, rebuild only that container without affecting the rest:

```bash
# Example: rebuild and restart only auth_service
docker compose -f docker-compose.dev.yml up --build -d auth_service
```

### Step 3 — Install webapp dependencies

```bash
cd webapp
npm install
```

The file `webapp/.env.development` already contains the variable needed for Vite to communicate with the gateway:

```
VITE_GATEWAY_API_URL=http://localhost:8080/api
```

This file is included in the repository and points to port 8080, where Docker Compose exposes the `gateway_service`. It does not need to be modified for local development.

### Step 4 — Start the webapp development server

```bash
npm run dev
```

Vite starts at `http://localhost:5173`. Any saved change in the frontend code is applied automatically in the browser without restarting any process.

### Step 5 — Verify the local environment

Open the browser at `http://localhost:5173`. The initial users are defined in `auth_service/init-data.sql` and are inserted automatically on the first database start:

| Identifier | Name | Role | Email | Initial password |
|---|---|---|---|---|
| `uo290009` | Diego Murias Suárez | Administrator | uo290009@uniovi.es | `123456` |
| `jrpp` | Juan Ramón Perez | Administrator | jrpp@uniovi.es | `123456` |
| `falvarez` | Fernando Álvarez García | Administrator | falvarez@uniovi.es | `123456` |
| `teacher` | Diego Murias Suárez | Teacher | teacher@uniovi.es | `123456` |

It is recommended to change the initial passwords after the first login.

---

## 7.1.6 Deployment on a publicly accessible virtual machine

This scenario applies to any VM accessible from the internet (Azure, AWS, VPS, etc.). The GitHub Actions pipeline connects to the server via SSH, downloads the pre-built images from GitHub Container Registry (GHCR), and starts them with Docker Compose.

### Step 1 — Prepare the virtual machine

Connect to the server via SSH and run the following commands:

```bash
# Update the system
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git

# Install Docker Engine and the Compose plugin
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add the user to the docker group to avoid needing sudo
sudo usermod -aG docker $USER

# Log out and reconnect for the group change to take effect
exit
```

After reconnecting, verify the installation:

```bash
docker --version
docker compose version
docker ps   # Should not show a permission error
```

Configure the firewall (if not already enabled):

```bash
sudo ufw allow 22/tcp    # SSH — add BEFORE enabling the firewall
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status verbose
```

### Step 2 — Configure the environment

The `.env` file with the production configuration must be created manually on the VM **once**, before the first deployment. GitHub Actions workflows do not manage or copy it.

```bash
mkdir -p ~/TeachingPlanner && cd ~/TeachingPlanner

# Download the template directly from the repository
curl -o .env.template https://raw.githubusercontent.com/murias10/teachingplanner/main/.env.template
cp .env.template .env
chmod 600 .env   # Restrict access: only the owner can read and write
nano .env
```

Variables that must be adjusted from the template values for a production environment:

| Variable | Recommended production value |
|---|---|
| `DOMAIN` | Server domain or IP (e.g. `my-app.azure.com` or the public IP) |
| `FRONTEND_URL` | `https://<domain>` |
| `GOOGLE_REDIRECT_URI` | `https://<domain>/api/auth/google/callback` |
| `JWT_SECRET` | Generated with `openssl rand -base64 48` |
| `ENCRYPTION_KEY` | Generated with `openssl rand -hex 32` |
| `PLANNER_DATABASE_PASSWORD` | Strong password, different from the template value |
| `MANAGEMENT_DATABASE_PASSWORD` | Strong password, different from the template value |
| `PLANNER_DATABASE_ROOT_PASSWORD` | Strong password, different from the template value |
| `MANAGEMENT_DATABASE_ROOT_PASSWORD` | Strong password, different from the template value |

### Step 3 — Generate the SSL certificate and upload it to GitHub Secrets

Caddy uses the `cert.pem` and `key.pem` files to serve the application over HTTPS. **Certificates are not copied manually to the VM**: the deployment workflow writes them automatically on each run by reading the GitHub secrets. The only manual step is to generate them locally and upload them as secrets.

Run on the local machine (not on the VM):

```bash
mkdir -p ./certs
cd ./certs

# Generate a self-signed certificate valid for 365 days.
# The Subject Alternative Name (SAN) field makes the certificate
# valid for both the domain and the server IP.
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout key.pem -out cert.pem \
  -subj "/C=ES/ST=Asturias/L=Oviedo/O=TeachingPlanner/CN=<DOMAIN_OR_IP>" \
  -addext "subjectAltName=DNS:<DOMAIN>,DNS:localhost,IP:<SERVER_IP>,IP:127.0.0.1"

# Verify that the certificate includes the defined SANs
openssl x509 -in cert.pem -text -noout | grep -A 3 "Subject Alternative Name"
```

Replace `<DOMAIN_OR_IP>`, `<DOMAIN>`, and `<SERVER_IP>` with the actual server values. If the application will only be served by IP (without a domain), omit the `DNS:` fields from the SAN.

Caddy reads the certificates from `/certs/cert.pem` and `/certs/key.pem`, as specified in `webapp/Caddyfile`:

```
{$DOMAIN:localhost} {
    tls /certs/cert.pem /certs/key.pem
    ...
}
```

The `DOMAIN` environment variable controls Caddy's behaviour: if set to `localhost`, it serves the application over HTTP without SSL; if set to a real domain or IP, it enables HTTPS with the specified certificate.

To **renew the certificate** in the future, simply update the `SSL_CERT` and `SSL_KEY` secrets in GitHub and re-run the workflow; no manual SSH connection to the server is needed.

### Step 4 — Configure GitHub secrets

The certificates generated in the previous step are stored as repository secrets. On each workflow run, the deployment job writes them automatically to `~/TeachingPlanner/certs/` on the VM.

Steps to create the secrets:
1. Go to the repository on GitHub → Settings → Secrets and variables → Actions
2. Create the following secrets:

| Secret name | Content |
|---|---|
| `SSL_CERT` | Full content of the `cert.pem` file, including the `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----` lines |
| `SSL_KEY` | Full content of the `key.pem` file, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines |
| `AZURE_SSH_PRIVATE_KEY` | SSH private key that allows the runner to connect to the server |
| `AZURE_VM_IP` | Server IP address |
| `AZURE_VM_USER` | SSH username (e.g. `ubuntu` or `azureuser`) |

In addition to the secrets, create the following **Actions variable** (Settings → Secrets and variables → Actions → **Variables** tab → New repository variable):

| Variable name | Value |
|---|---|
| `REPOSITORY_NAME` | `murias10/teachingplanner` (lowercase) |

This variable is used by the workflow to build the image names in GHCR (e.g. `ghcr.io/murias10/teachingplanner/webapp:latest`). Without it the build step fails with an empty image name.

### Step 5 — Run the deployment

The workflow `.github/workflows/deploy_azure.yml` is triggered manually from the GitHub interface:

1. Go to the repository on GitHub → Actions → select the "Deploy to Azure" workflow
2. Click "Run workflow" → "Run workflow"

The workflow runs the following stages sequentially:

1. **Unit tests**: run on a standard GitHub runner (`ubuntu-latest`)
2. **E2E tests**: run on a standard GitHub runner
3. **Build and push images**: builds the 7 Docker images and publishes them to GHCR under `ghcr.io/murias10/teachingplanner/<service>:latest`
4. **Deployment**: connects to the server via SSH and:
   - Writes the SSL certificates from the secrets to `~/TeachingPlanner/certs/`
   - `docker compose down --rmi all --remove-orphans` (stops and removes containers, images, and orphaned services)
   - `docker compose up -d --pull always --force-recreate --remove-orphans` (downloads the new images and starts the containers)

The estimated duration of the full process is between 7 and 12 minutes.

### Step 6 — Verify the deployment

```bash
cd ~/TeachingPlanner

# Check the status of all containers
docker compose ps

# View logs in real time
docker compose logs -f

# Check that the application responds
curl -k https://<IP_OR_DOMAIN>
```

All services should show status `Up`. Access the application from the browser at `https://<IP_OR_DOMAIN>`. If the certificate is self-signed, the browser will show a warning; accept it to continue.

---

## 7.1.7 Deployment on a virtual machine in a private network (self-hosted)

### Why a self-hosted runner is needed

When the production VM is inside a private network — such as the University of Oviedo's internal network — it is not reachable from the internet. A standard GitHub Actions runner cannot connect to the server via SSH because the VM is only accessible through the university VPN.

The solution is to install a **self-hosted GitHub Actions runner** directly on the production VM. Once installed, the runner listens for jobs from GitHub and executes them locally, without requiring any inbound connection from the outside.

The CI/CD pipeline is split into two parts:

- **Tests and image build** (`ubuntu-latest`): run on standard GitHub runners, which have internet access and can publish images to GHCR.
- **Deployment** (`self-hosted`): run on the runner installed on the VM, which pulls the images from GHCR and starts the containers.

```mermaid
flowchart TD
    Push["git push origin main"]

    Push --> StdRunner

    subgraph StdRunner["ubuntu-latest runner"]
        T1["1. Unit tests"]
        T2["2. E2E tests"]
        T3["3. Build and push images to GHCR"]
        T1 --> T2 --> T3
    end

    StdRunner -->|"Triggers 'deploy' job"| SelfRunner

    subgraph SelfRunner["Self-hosted runner — inside the VPN"]
        D1["4. Write SSL certificates"]
        D2["5. docker compose down"]
        D3["6. docker image prune -f"]
        D4["7. docker compose pull"]
        D5["8. docker compose up -d"]
        D1 --> D2 --> D3 --> D4 --> D5
    end
```

### Step 1 — Prepare the virtual machine

Follow **Step 1 of section 7.1.6** (install Ubuntu 22.04+, Docker Engine, and configure the firewall).

### Step 2 — Install the self-hosted GitHub Actions runner

#### Step 2.1 — Obtain the registration token

1. Go to the repository on GitHub → Settings → Actions → Runners → New self-hosted runner
2. Select **Linux** as the operating system and **x64** as the architecture
3. Keep the page open: the installation commands are generated with a one-time token that expires after a few minutes

#### Step 2.2 — Install the runner on the VM

Connect to the VM via SSH (from a machine with access to the university VPN) and run:

```bash
# Create the runner directory
mkdir -p ~/actions-runner && cd ~/actions-runner

# Download the runner (use the exact command shown on the GitHub page,
# as the version may vary)
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extract the archive
tar xzf ./actions-runner-linux-x64-*.tar.gz
```

#### Step 2.3 — Configure the runner

```bash
# Run the configuration script (use the exact command from the GitHub page)
./config.sh --url https://github.com/murias10/teachingplanner --token <GITHUB_TOKEN>
```

The configuration wizard asks the following questions:

| Question | Recommended answer |
|---|---|
| Enter the name of the runner | Press Enter (default name) |
| Enter the name of runner group | Press Enter (default group) |
| Enter labels for this runner | `self-hosted,linux` |
| Enter name of work folder | Press Enter (`_work` directory) |

#### Step 2.4 — Install the runner as a system service

To have the runner start automatically each time the VM reboots:

```bash
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

The expected output includes the line `Active: active (running)`.

#### Step 2.5 — Verify in GitHub

Go back to GitHub → Settings → Actions → Runners. The runner should be listed with status **Idle** (green indicator). If it appears as **Offline**, check the diagnostic logs:

```bash
cd ~/actions-runner
cat _diag/Runner_*.log
```

### Step 3 — Configure the application environment

The `.env` file must be created manually in `~/TeachingPlanner` **once** before the first deployment. The self-hosted runner does not create or copy the `.env` — it reads it from that path on every run.

```bash
mkdir -p ~/TeachingPlanner && cd ~/TeachingPlanner

# Download the template directly from the repository
curl -o .env.template https://raw.githubusercontent.com/murias10/teachingplanner/main/.env.template
cp .env.template .env
chmod 600 .env
nano .env
```

In addition to the common production variables described in section 7.1.6, adjust the following for the self-hosted environment with the university domain:

| Variable | Value |
|---|---|
| `DOMAIN` | Assigned domain (e.g. `planificador.ingenieriainformatica.uniovi.es`) |
| `FRONTEND_URL` | `https://planificador.ingenieriainformatica.uniovi.es` |
| `GOOGLE_REDIRECT_URI` | `https://planificador.ingenieriainformatica.uniovi.es/api/auth/google/callback` |

### Step 4 — Generate the SSL certificate

For the initial phase without official certificates, follow the self-signed certificate generation procedure in **Step 3 of section 7.1.6**, replacing `<DOMAIN>` and `<SERVER_IP>` with the university environment values.

#### Official certificates (GEANT TLS)

Once the university provides the official certificates (GEANT TLS certificates for `*.ingenieriainformatica.uniovi.es`), update the `SSL_CERT` and `SSL_KEY` secrets in GitHub with the content of the new files and re-run the workflow. No SSH connection to the VM is needed.

### Step 5 — Configure access to GitHub Container Registry

The self-hosted runner needs to authenticate with GHCR to pull images during deployment.

#### Step 5.1 — Create a Personal Access Token (PAT) in GitHub

1. Go to GitHub (personal profile) → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Configure the token:
   - **Note**: `TeachingPlanner VM Runner`
   - **Expiration**: according to team policy
   - **Scopes**: check `read:packages` and `repo`
4. Copy the token immediately; it is only shown once

#### Step 5.2 — Authenticate with GHCR from the VM

```bash
echo "<PERSONAL_ACCESS_TOKEN>" | docker login ghcr.io -u <github_username> --password-stdin
# Expected output: Login Succeeded
```

The credentials are stored in `~/.docker/config.json` and the runner will use them on every deployment.

### Step 6 — Upload the certificates as GitHub secrets

Follow **Step 4 of section 7.1.6** to create the `SSL_CERT` and `SSL_KEY` secrets and the `REPOSITORY_NAME` variable. The secrets `AZURE_SSH_PRIVATE_KEY`, `AZURE_VM_IP`, and `AZURE_VM_USER` are **not needed** in this scenario (the runner runs on the VM itself).

### Step 7 — Trigger the first deployment

The workflow `.github/workflows/deploy_selfhosted.yml` is triggered automatically on every push to the `main` branch:

```bash
# From the local development machine
git add .
git commit -m "chore: configure self-hosted deployment"
git push origin main
```

The workflow runs the following stages:

| Stage | Runner | Description |
|---|---|---|
| Unit tests | `ubuntu-latest` | Runs the microservice tests |
| E2E tests | `ubuntu-latest` | Runs the end-to-end tests of the webapp |
| Build and push images | `ubuntu-latest` | Builds and publishes the 7 images to GHCR |
| Deployment | `self-hosted` | Writes certificates, pulls images, and starts containers |

The estimated duration is between 7 and 12 minutes. The first deployment may take longer as the base images need to be downloaded.

### Step 8 — Monitor and verify the deployment

Workflow progress can be followed in real time at GitHub → Actions → select the running execution.

To verify the status from the VM (connect via SSH from inside the VPN):

```bash
cd ~/TeachingPlanner

# Status of all containers
docker compose ps

# Real-time logs (all services)
docker compose logs -f

# Logs for a specific service
docker compose logs -f gateway_service
```

All services should show status `Up`. Access from the browser (with the VPN active):

```
https://planificador.ingenieriainformatica.uniovi.es
```