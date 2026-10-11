# Project Deployment Guide

This guide details multiple proven, production-tested deployment methods for the **Hospital Data Warehouse & Patient Analysis** platform.

---

## 🌟 Method 1: Deploy on Render (Recommended & Free Tier)

Render allows you to deploy the unified Docker container (Frontend SPA + FastAPI Backend) for free directly from your GitHub repository.

### Step-by-Step Instructions:
1. **Push your code to GitHub** (as shown in the GitHub guide).
2. Go to **[https://render.com](https://render.com)** and sign in with GitHub.
3. In the Render Dashboard, click **New +** and select **Web Service**.
4. Choose **"Build and deploy from a Git repository"** and connect your repository (`hospital-data-warehouse-patient-analysis`).
5. Configure the service:
   - **Name**: `hospital-data-warehouse` (or any name you like)
   - **Language / Environment**: Select **Docker**
   - **Region**: Choose the closest location (e.g., Singapore, Frankfurt, Oregon)
   - **Branch**: `main`
   - **Plan**: Select **Free**
6. Click **Advanced** and add the environment variable:
   - `SECRET_KEY` = `your-secure-random-key-here`
7. Click **Create Web Service**.
8. Render will automatically build the multi-stage Docker container (compiling React with Node and setting up FastAPI with Python), seed the demonstration databases, and provide a live public HTTPS URL (e.g. `https://hospital-data-warehouse.onrender.com`).

---

## 🚂 Method 2: Deploy on Railway

Railway offers seamless Docker deployments:
1. Go to **[https://railway.app](https://railway.app)** and log in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your repository.
4. Railway automatically detects the `Dockerfile` in the root directory.
5. In the service **Settings** → **Networking**, click **Generate Domain**.
6. Your application will be live at `https://your-app.up.railway.app`!

---

## 🐳 Method 3: Deploy with Docker on Any VPS (DigitalOcean / AWS / Linode)

If you have a Linux cloud server / VPS (Ubuntu, Debian, CentOS) with Docker and Docker Compose installed:

```bash
# 1. Clone your repository on your server
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY

# 2. Build and launch the container in the background
docker compose up -d --build

# 3. Check logs to confirm startup
docker compose logs -f
```

Your service will immediately be accessible on port 8000 (e.g., `http://YOUR_SERVER_IP:8000`).

---

## ⚡ Method 4: Split Deployment (Vercel Frontend + Render Backend)

If you prefer deploying the frontend and backend on distinct cloud providers:

### A. Deploy Backend on Render:
1. Create a new **Web Service** on Render.
2. Select **Python** runtime.
3. Build command: `pip install -r backend/requirements.txt && python scripts/initialize_db.py && python scripts/run_etl.py`
4. Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
5. Note your backend URL (e.g., `https://hospital-api.onrender.com`).

### B. Deploy Frontend on Vercel:
1. Go to **[https://vercel.com](https://vercel.com)**.
2. Import your GitHub repository.
3. Set **Root Directory** to `frontend`.
4. Framework Preset: **Vite**.
5. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://hospital-api.onrender.com`
6. Click **Deploy**.

---

## 🔐 Post-Deployment Verification Checklist

Once deployed, verify:
- [ ] Open the URL and verify the login screen renders.
- [ ] Log in with `admin` / `Admin123!`.
- [ ] Check that the Dashboard KPIs load without network errors.
- [ ] Navigate to **Data Warehouse** or **Patient Clustering** to confirm analytical features execute.
- [ ] Open `/docs` on your domain to inspect the interactive Swagger API documentation.
