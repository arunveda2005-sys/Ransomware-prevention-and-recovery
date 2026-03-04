# 🚀 Deployment Guide

This guide will help you deploy the E-Commerce Security platform. The best, easiest, and free architecture is:
- **Backend (Python + Flask + ML):** Render.com
- **Frontend (React + Vite):** Vercel.com

---

## 🏗️ 1. Deploy the Backend to Render

Render is perfect for our Python backend because it supports our `render.yaml` configuration out of the box.

### Prerequisites:
1. Ensure your code is pushed to a GitHub repository.
2. Sign up for a free account at [Render.com](https://render.com/).

### Steps:
1. Go to your Render Dashboard and click **"New +" -> "Blueprint"**.
2. Connect your GitHub account and select your repository.
3. Render will automatically read the `render.yaml` file located in your project root.
4. Set the required Environment Variable when prompted:
   - `MONGODB_URI`: Your MongoDB Atlas connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/ecommerce_defense?retryWrites=true&w=majority`).
5. Click **"Apply"**.

Render will install dependencies (`pip install -r backend/requirements.txt`) and start the `gunicorn` eventlet server.

> **Note:** Once deployed, copy your Render URL (e.g., `https://ecommerce-defense-backend.onrender.com`). You will need this for the Frontend.

---

## 🎨 2. Deploy the Frontend to Vercel

Vercel provides the fastest and most reliable global CDN for React applications.

### Prerequisites:
1. Sign up for a free account at [Vercel.com](https://vercel.com).
2. Note: *We have already added a `vercel.json` to handle React Router navigation appropriately.*

### Steps:
1. Go to your Vercel Dashboard and click **"Add New..." -> "Project"**.
2. Connect your GitHub account and import your repository.
3. **Configure Project Settings:**
   - **Framework Preset:** Vite (Vercel usually detects this automatically).
   - **Root Directory:** Edit this and select the `frontend/` folder.
4. **Environment Variables:**
   Add the following environment variable:
   - Name: `VITE_API_URL`
   - Value: `https://ecommerce-defense-backend.onrender.com` *(Replace this with your actual Render backend URL)*
5. Click **"Deploy"**.

Vercel will package and deploy your frontend globally.

---

## 📝 3. Final Verification

1. Once Vercel finishes, open your new public Vercel URL (e.g., `https://ecommerce-defense.vercel.app`).
2. Go to the Database page or trigger an attack and verify that the backend processes it.
3. Ensure no CORS errors appear in your browser's Developer Console (the Render backend configuration specifically allows `*` origins).

🎊 **You're fully deployed in the Cloud!**
