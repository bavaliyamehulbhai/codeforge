# CodeForge 🚀

CodeForge is a modern, high-performance web-based code editor and execution environment built on the MERN stack. It provides a rich, multi-language coding experience right in your browser, enabling developers to write, compile, and share code seamlessly.

## 🌟 Key Features

- **Multi-Language Support**: First-class support for writing and executing code in **C++, Go, Java, JavaScript, Python, and Rust**.
- **Advanced Code Editor**: Powered by CodeMirror 6, featuring intelligent syntax highlighting, auto-completion, and premium themes (VS Code, One Dark).
- **Secure Backend API**: Node.js & Express server fortified with robust security middlewares including Helmet, Rate Limiting, and JWT-based authentication.
- **Robust Database**: MongoDB (via Mongoose) for efficient storage of user profiles, projects, and code snippets.
- **Cloud Integrations**: Supabase integration for seamless database capabilities and real-time features.
- **Performance Optimized**: Lightning-fast Vite-powered React frontend, backend caching (`node-cache`), and response compression.
- **Export & Share**: Built-in support to convert code snippets to beautiful images (`html-to-image`).

---

## 🏗️ Architecture & Tech Stack

### 🖥️ Frontend (Client)
- **Core**: React 18, TypeScript, Vite
- **Code Editor**: `@uiw/react-codemirror` (CodeMirror 6)
- **Styling**: PostCSS, Autoprefixer, `clsx`
- **Icons**: Lucide React
- **Routing**: React Router DOM v6
- **Data Fetching**: Axios
- **BaaS / Cloud**: Supabase (`@supabase/supabase-js`)

### ⚙️ Backend (Server)
- **Core**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT), `bcryptjs` for password hashing
- **Security**: `helmet`, `cors`, `express-rate-limit`
- **Performance**: `compression`, `node-cache`

---

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd codeforge
   ```

2. **Set up the Backend**
   ```bash
   cd backend
   npm install
   ```
   *Create a `.env` file in the `backend` directory with the following variables:*
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```
   *Start the development server:*
   ```bash
   npm run dev
   ```

3. **Set up the Frontend**
   ```bash
   cd ../frontend
   npm install
   ```
   *Start the Vite development server:*
   ```bash
   npm run dev
   ```

4. **Open the Application**
   Navigate to `http://localhost:5173` in your browser.

---

## 📁 Project Structure

```text
codeforge/
├── backend/               # Express Server & MongoDB Database
│   ├── index.js           # Server entry point
│   ├── package.json       # Backend configuration
│   └── ...                # Models, Routes, Controllers, Middlewares
├── frontend/              # React, TypeScript, and Vite
│   ├── src/               # Application source code
│   ├── package.json       # Frontend configuration
│   └── vite.config.ts     # Vite build settings
└── README.md              # Project documentation
```

---

## 📜 Available Scripts

### Frontend Scripts (in `/frontend`)
- `npm run dev`: Starts the Vite development server.
- `npm run build`: Compiles TypeScript and builds the app for production.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs ESLint to find and fix problems in the frontend code.

### Backend Scripts (in `/backend`)
- `npm start`: Starts the Express server in production mode.
- `npm run dev`: Starts the server in watch mode for development.

---

## 🛡️ Security & Performance

- **Helmet**: Secures the Express apps by setting various HTTP headers.
- **Rate Limiting**: Protects APIs against brute-force attacks and DDoS by limiting repeated requests.
- **Bcrypt**: Ensures user passwords are securely hashed before storing them in the database.
- **Compression**: Decreases the downloadable amount of data that's served to users, improving performance.
- **Node-Cache**: In-memory caching for faster response times on frequently accessed data.

---

<div align="center">
  <i>Built with ❤️ for developers by developers.</i>
</div>
