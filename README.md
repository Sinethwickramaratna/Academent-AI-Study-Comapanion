# Academent AI - Study Companion

Academent AI is a premium, high-fidelity AI-powered study companion platform designed to help students optimize their learning potential. The application blends interactive AI tutoring, custom quiz generation, study planning, active notes tracking, and performance analytics into a beautiful, modern user experience.

The platform is split into a client-side **React** application (Vite-powered, Firebase authenticated) and a secure **Node/Express** backend integration that interfaces with Google's Generative AI APIs.

---

## 🌟 Key Features

1. **Academent AI Tutor**: Real-time study helper explaining complex concepts with real-world analogies (supported by Google GenAI).
2. **Interactive Quiz Generator**: Automated study evaluation and flashcard generator.
3. **Structured Onboarding Flow**: Personalized study profile configuration capturing university, major, study goals, preferred style, and weekly hours.
4. **WebGL Organic Sidebar Canvas**: A beautiful, liquid gradient WebGL background animating behind login, signup, and onboarding sections.
5. **Academic Progress & Analytics**: Interactive tracking for target GPAs, weekly study hours commitment, study streaks, and completed assignments.
6. **Robust Rate Limiting**: Built-in backend protection preventing API abuse on quiz generation and chat models.

---

## 🛠️ Technology Stack

### Frontend (`/Frontend/Academent`)
* **Core**: React 19, Javascript (ES6+)
* **Tooling**: Vite 8 (Hot Module Replacement)
* **Styling**: Tailwind CSS (Utility classes & CSS tokens)
* **Authentication**: Firebase Auth (Google Sign-In, Email/Password, OTP Verification)
* **Animations**: WebGL GLSL Shaders, CSS Micro-animations, View Transitions API

### Backend (`/backend`)
* **Runtime**: Node.js (ES Modules syntax)
* **Framework**: Express.js
* **AI Integration**: Google GenAI SDK (`@google/genai`) for Gemini LLMs
* **Security & Reliability**: `express-rate-limit` for DDoS prevention and resource management, `cors`, `dotenv`

---

## 📁 Repository Structure

```
Academent-AI-Study-Companion/
├── Document/                 # Project documentation and specifications
├── Frontend/
│   └── Academent/            # React + Vite client-side workspace
│       ├── public/           # Static public assets
│       ├── src/
│       │   ├── assets/       # Icons and graphics
│       │   ├── components/   # Centralized reusable components library
│       │   ├── context/      # Authentication context
│       │   ├── pages/        # Authentication, onboarding, and dashboard pages
│       │   └── Services/     # Firebase/Firestore API service calls
│       └── package.json
└── backend/                  # Node.js + Express backend service
    ├── middleware/           # Route-specific express-rate-limit handlers
    ├── routes/               # Express routing for chat and quiz modules
    ├── services/             # Gemini API integrations
    ├── server.js             # Main server entrypoint
    └── package.json
```

---

## 🚀 Installation & Local Development

### 1. Clone & Pre-requisites
Ensure you have **Node.js** (v18.0.0+) and **npm** installed on your machine.

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   GEMINI_API_KEY=your_gemini_api_key_here
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```
   *The server will run on `http://localhost:5000`.*

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd Frontend/Academent
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the environment variables by creating a `.env` file in `Frontend/Academent/`:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_BACKEND_URL=http://localhost:5000
   ```
4. Launch the local development server:
   ```bash
   npx vite
   # or
   npm run dev
   ```
5. Open your browser and head to the local URL (usually `http://localhost:5173`).

---

## 🛡️ Security & API Optimization

To prevent high-cost requests and denial-of-service attempts, the backend implements hierarchical rate limiting:
- **Global Limiter**: Applied to all incoming requests.
- **Quiz Generator Limiter**: Restricts aggressive generation requests.
- **Chat Tutor Limiter**: Places a ceiling on chat interaction frequencies.
All config variables reside in `backend/middleware/rateLimiter.js`.

---

## 🎨 Reusable Component Library
The frontend codebase features a modular component library designed for low-boilerplate layouts:
- **`WebGLBackground`**: Liquid organic shader canvas for side-illustration areas.
- **`CircularProgress`**: Custom circular progress tracker.
- **`FormInput`**: Text/password/email inputs with built-in strength metrics.
- **`FormSelect`**: Styled native select wrappers.
- **`SelectionCard`**: Interactive checkbox/radio chips with hover transformations.
- **`Sidebar`**: Left-anchored drawer and user accounts control panel.

For more details on frontend component usage, see [Frontend/Academent/README.md](file:///e:/Projects/Academent%20AI%20Study%20Companion/Frontend/Academent/README.md).
