# Shades-of-SG
We are building a web application for the SCCCI AI Challenge to help a local archivist, Violet, engage the elderly and students with Singaporean music and stories. It features a secure, internal AI Studio where Violet can upload her music and lyrics to automatically generate cinematic, frame-by-frame music videos for her YouTube channel.

**Public URL:** `[INSERT CLOUD URL HERE WHEN DEPLOYED]`

---

## 🚀 Getting Started

Follow these exact steps to get the Monorepo running locally on your machine.

### Step 1: Clone the Repository
```bash
git clone https://github.com/FSAD-Unpaid-Interns/Shades-of-SG
cd Shades-of-SG
```

### Step 2: Backend Setup
The backend runs on Node.js, Express.js, and Sequelize. It connects to Supabase PostgreSQL when `DATABASE_URL` is provided, and falls back to local SQLite for quick development.
```bash
cd backend
npm install
```
**CRITICAL Environment Variables:** You must create your own local environment configuration.
1. Duplicate `backend/.env.example`.
2. Rename the duplicated file to `backend/.env`.
3. Paste in your Supabase, Cloudinary, and auth secrets provided by the team lead.

*Start the backend server:*
```bash
npm run dev
```

### Step 3: Frontend Setup
The frontend is a React Single Page Application built with Vite, utilizing shadcn/ui and Tiptap.
Open a **new terminal tab** (keep the backend running in the first one):
```bash
cd frontend
npm install
```
Duplicate `frontend/.env.example` to `frontend/.env` if you need to override the default API path.

*Start the frontend development server:*
```bash
npm run dev
```
*(Note: The frontend is configured to automatically proxy API requests to our backend on port 5000.)*

### Step 4: Verify Tooling
From the repository root:
```bash
npm run lint
npm test
```

---

## 📁 Standardized File Structure
To avoid merge conflicts, **strictly adhere** to this required file modularity. Do not create rogue files outside of this structure.

```text
Shades-of-SG/
├── backend/
│   ├── package.json
│   ├── server.js            # The main entry point
│   ├── config/              # Database connections and environment variables
│   ├── middleware/          # Authentication guards protecting client routes
│   ├── models/              # Sequelize DB schemas
│   ├── controllers/         # Actual CRUD logic and external API calls
│   └── routes/              # Express routers pointing to controllers
└── frontend/
    ├── package.json
    ├── vite.config.js       # Contains the backend proxy setting
    └── src/
        ├── context/         # Manages global frontend state
        ├── services/        # API call functions communicating with backend
        ├── components/      # Reusable shadcn/ui elements and shared components
        └── pages/           # Isolated page views
```

---

## ☁️ How to Deploy
*(We will update this section with specific commands once we finalize our cloud providers.)*
