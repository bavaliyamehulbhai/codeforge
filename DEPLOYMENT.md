# CodeForge Production Deployment Guide 🚀

Follow these steps to deploy your MERN stack application with high-concurrency support.

## 📦 Phase 1: Database (MongoDB Atlas)

1.  Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database).
2.  In **Network Access**, allow access from `0.0.0.0/0` (Render needs this).
3.  Copy your **Connection String** (e.g., `mongodb+srv://...`).

---

## ⚡ Phase 2: Backend (Render.com)

1.  Create a new **Web Service** on Render.
2.  Connect your GitHub repository.
3.  **Root Directory**: `backend`
4.  **Build Command**: `npm install`
5.  **Start Command**: `npm start`
6.  **Environment Variables**:
    *   `MONGODB_URI`: (Your Atlas string)
    *   `NODE_ENV`: `production`
    *   `JWT_SECRET`: (Random 32-char string)
    *   `CORS_ORIGINS`: `https://your-app.netlify.app` (Your future Netlify URL)

---

## 🌐 Phase 3: Frontend (Netlify or Vercel)

1.  Connect your GitHub repository.
2.  **Base Directory**: `frontend`
3.  **Build Command**: `npm run build`
4.  **Publish Directory**: `dist`
5.  **Environment Variables**:
    *   `VITE_API_URL`: [Your Backend URL]
    *   `VITE_JUDGE0_API_URL`: `https://ce.judge0.com`

---

## ✅ Post-Deployment Verification

1.  Visit `https://your-backend.onrender.com/health` to confirm the **Neural Cluster** is active.
2.  Open your frontend and try to save a snippet.
3.  Check the **Neuro-Assistant** in the Compiler to see real-time insights syncing.

> [!IMPORTANT]
> If you experience a "CORS Error" after deployment, verify that the `CORS_ORIGINS` on Render exactly matches your Netlify URL (including `https://`).

---

### **Need Help?**
If any step fails, I can help you debug the logs from Render or Netlify!
