# Deployment Guide (Vercel)

This project is fully configured for easy deployment on Vercel.

## 🚀 Quick Deployment Steps

1. **Log in to Vercel**: Go to [vercel.com](https://vercel.com) and log in.
2. **Add New Project**:
   - Click **"Add New..."** -> **"Project"**.
   - Select **"Import"** next to your GitHub repository `ExpenseTrackV0.1`.
3. **Configure Settings**:
   - **Framework Preset**: Vercel should auto-detect **Vite**.
   - **Root Directory**: Leave as `./`.
   - **Build Command**: `npm run build` (Default).
   - **Output Directory**: `dist` (Default).
   - **Environment Variables**: None required for default setup.
4. **Deploy**:
   - Click **"Deploy"**.

## ⚠️ Important Note on Data

Since this project uses a filesystem database (`dataset.json`), specifically configured for the **Serverless Environment**:

- **Data Persistence**: On Vercel, the app uses **Ephemeral Storage** (`/tmp` directory).
- **Behavior**: This means **user data (registrations, expenses) will reset** whenever the serverless function goes to sleep (usually after a period of inactivity) or redeploys.
- **Solution for Production**: For permanent data storage in a real-world scenario, you would connect this to a database like MongoDB (Atlas) or PostgreSQL (Supabase). This demo version enables full functionality without needing external database keys.

## ✅ API Configuration

The project includes a `vercel.json` and `api/index.js` wrapper that automatically converts the Express backend into Vercel Serverless Functions. No manual API configuration is needed.
