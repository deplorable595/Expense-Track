# Deployment Guide (Vercel with MongoDB)

This project is now fully configured for **Persistent Online Storage** using MongoDB, ensuring data is saved across browsers and sessions.

## 🚀 Deployment Steps

1. **Log in to Vercel**: Go to [vercel.com](https://vercel.com).
2. **Import Project**: Import `ExpenseTrackV0.1`.
3. **Deploy**: Click Deploy with default settings.

## 🗄️ Setting up Persistence (MongoDB)

To ensure your data survives server restarts and works across multiple devices, you must connect a MongoDB database.

1. **Get a MongoDB Connection String**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free Tier is sufficient).
   - Create a Cluster.
   - Click **Connect** -> **Drivers** -> Copy the connection string (e.g., `mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`).
   - *Remember to replace `<password>` with your actual database user password.*

2. **Add Environment Variable in Vercel**:
   - Go to your Project Settings in Vercel -> **Environment Variables**.
   - **Key**: `MONGODB_URI`
   - **Value**: (Paste your connection string from Step 1).
   - Click **Save**.

3. **Redeploy**:
   - Go to the **Deployments** tab.
   - Click the "..." mostly recently commit -> **Redeploy**.

## 🔄 How it Works
- If `MONGODB_URI` is present, the server automatically switches to storing data in your MongoDB Atlas cluster.
- If `MONGODB_URI` is missing, it falls back to the temporary file system (Warning: Data will be lost on restart).
