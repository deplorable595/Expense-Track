# ExpenseTrack V1.0 - Cyberpunk Edition

A futuristic, high-performance personal finance dashboard built with the latest web technologies. Features a sleek cyberpunk aesthetic, real-time data visualization, and robust administrative control.

## 🚀 Features

- **Cyberpunk UI**: Glassmorphism, neon glows, and smooth animations.
- **PWA Ready**: Installable on Mobile and Desktop with offline support.
- **Admin Console**: dedicated dashboard for managing users and viewing system-wide financial analytics.
- **Interactive Charts**: Visual breakdown of expenses by month and category.
- **Multi-User Support**: Secure login and registration system.
- **Data Persistence**: 
  - **Local Development**: Node.js JSON database.
  - **Production**: Optimized for Vercel/Serverless deployment.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion, Recharts.
- **Backend**: Node.js, Express (compatible with Serverless).
- **Build Tool**: Vite.

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/expense-track.git
   cd expense-track
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   This will start both the Frontend (`http://localhost:5173`) and the Backend (`http://localhost:3001`) concurrently.

## 🔑 Default Admin Access

When you first run the application, the system will automatically create a default Admin account if one does not exist.

- **Username**: `Admin`
- **Password**: `admin1234`

Use these credentials to access the **Admin Console** via the `SHIFT + A` shortcut or the hidden trigger in the UI (if configured).

## 📱 Mobile Installation

1. Open the app in your mobile browser.
2. Tap "Add to Home Screen" or "Install App".
3. Enjoy the native-like experience!

## ☁️ Deployment

This project is configured out-of-the-box for **Vercel**.

1. Push your code to GitHub.
2. Import the project in Vercel.
3. Use the default Vite settings.
4. Ensure your server functions (if separating backend) are configured in `api/` or `vercel.json` as needed for serverless execution.

---
*Built with ❤️ by Antigravity*
