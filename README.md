# Shades-of-SG
We are building a web application for the SCCCI AI Challenge to help a local archivist, Violet, engage the elderly and students with Singaporean music and stories. It features a secure, internal AI Studio where Violet can upload her music and lyrics to automatically generate cinematic, frame-by-frame music videos for her YouTube channel.

**Public URL (Production):** `[INSERT CLOUD URL HERE WHEN DEPLOYED]`

---

## 🚀 Getting Started (To-Do for the Team)

Follow these exact steps to get the Monorepo running locally on your machine.

### Step 1: Clone the Repository
```bash
git clone https://github.com/Htet-Aung/Shades-of-SG
cd Shades-of-SG
```

### Step 2: Backend Setup
The backend runs on Node.js and Express.js, utilizing SQLite and Sequelize for the database layer.
```bash
cd backend
npm install
```
**CRITICAL:** You must create your own local environment variables. Create a `.env` file inside the `backend/` folder and paste this exact configuration:
```env
PORT=5000
NODE_ENV=development
DB_STORAGE=./database.sqlite
```
*Start the backend server:*
```bash
node server.js
```

### Step 3: Frontend Setup
The frontend is a React Single Page Application built with Vite, utilizing shadcn/ui and Tiptap.
Open a **new terminal tab** (keep the backend running in the first one):
```bash
cd frontend
npm install
```
*Start the frontend development server:*
```bash
npm run dev
```
*(Note: The frontend is configured to automatically proxy API requests to our backend on port 5000.)*

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

## 👥 Team Modules & Workload Isolation
Every team member is assigned a specific module to guarantee the CRUD mandate is met. **Only modify the designated controller, route, and frontend page for your specific feature**.

* **Module A: Media & Campaign Manager** (CRUD for campaigns and media assets).
* **Module B: The AI "KTV" Video Studio** (React video player and AI image integration).
* **Module C: The "Life Story" Memory Wall & CRM** (Padlet-style reflections and moderation).
* **Module D: AI Education & Gamification Hub** (Dynamic trivia and short articles).
* **Module E: Security & System Architecture** (User Auth, DB Schema, Cloud Deployment).

---

## ☁️ How to Deploy 
*(Note for the team: We will update this section with specific commands once we finalize our cloud providers. Below is the standard protocol for our stack.)*

**Backend Deployment (e.g., Render, Railway, Fly.io)**
1. Connect the GitHub repository to the hosting provider.
2. Set the Root Directory to `backend/`.
3. Set the Build Command to `npm install`.
4. Set the Start Command to `node server.js`.
5. Add the necessary Environment Variables (matching our `.env` file, but assigning a production URL).

**Frontend Deployment (e.g., Vercel, Netlify)**
1. Connect the GitHub repository to the hosting provider.
2. Set the Root Directory to `frontend/`.
3. Set the Build Command to `npm run build`.
4. Set the Publish directory to `dist/`.
5. Update the backend proxy URL in production to point to the live backend URL instead of `localhost:5000`.
