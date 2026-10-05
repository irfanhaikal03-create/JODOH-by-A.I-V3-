# JODOH by A.I

> **Executive-Tier Matchmaking Suite for Event Organizers**  
> Powered by Google Gemini AI, Firebase Firestore & Authentication, React 19, TypeScript, and Tailwind CSS.

---

## 🌟 Overview

**JODOH by A.I** is an executive-grade matchmaking and attendee dossier management platform designed for speed-dating hosts, event managers, and professional matchmakers. 

The suite enables organizers to manage attendee dossiers with discreet privacy, evaluate multi-dimensional compatibility vectors, and generate deterministic or AI-synthesized **exclusive 1-to-1 pairings** where each candidate appears strictly once (zero partner overlap).

---

## ✨ Key Features

### 1. Cohort Masterfile & Candidate Registry
- **Comprehensive Profiles**: Register participants with photo (file upload or URL), full name, age (18–99), gender, marital status, smoking habit, profession, location, passions/hobbies, and qualitative partner preferences.
- **Visual Monogram Avatars**: Automatic graceful fallback to stylized monogram avatars if no photograph is provided.
- **Real-Time Search & Filtering**: Instant search across candidate names, occupations, locations, and interests, combined with segmented gender and habit filters.
- **Dual Persistence Architecture**: Continuous local storage persistence combined with real-time Firebase Firestore cloud synchronization.

### 2. Algorithmic & Gemini AI Matchmaking Engine
- **Strict 1-to-1 Exclusivity**: Evaluates the entire cohort permutation matrix to discover optimal pairing configurations where no person appears more than once.
- **Multi-Vector Affinity Scoring**:
  - Core demographic and age alignment
  - Geographic proxemics (metro zone proximity)
  - Lifestyle and smoking status concordance
  - Career trajectory and work-life boundaries
  - Mutual passions, leisure synergies, and core life values
- **PRD Section F04 Minimum Quorum Enforcer**: Automated validation ensuring at least 1 male and 1 female profile exist before triggering synthesis. Includes a simulation mode for testing quorum edge cases.

### 3. Top Pairings Results Dashboard
- **#1 Gold Ribbon Master Card**: High-affinity showcase pairing with side-by-side attendee dossiers, central affinity badge, and cross-checked trait chips.
- **3-Pillar Qualitative Evaluation**:
  1. *Why They Match*: AI-synthesized rationale and value alignment score.
  2. *Potential Challenges*: Constructive friction analysis and risk mitigation probability.
  3. *Tailored Date Recommendations*: Numbered, context-specific icebreaker ideas tailored to their mutual passions.
- **Ranks #2 through #10 Hierarchy**: Interactive accordion cards with expandable deep-dive drawers and a global "Expand / Collapse All" toggle.

### 4. Executive Export & Reporting
- **Client-Side PDF Dossier**: Instant compilation and download of a multi-page executive match report formatted for presentation and archiving (built with `jsPDF` for reliable operation in iframe and sandboxed environments).
- **In-App Dossier Preview & Print Modal**: Full visual preview of the dossier report on-screen with direct Print / Save as PDF capability.
- **CSV Data Export**: One-click download of structured match data for spreadsheets and external CRM systems.

### 5. Firebase Cloud Sync & Google Authentication
- **Google Sign-In**: Quick authentication for event organizers.
- **Firestore Database**: Stores participants and generated compatibility results securely with user-level isolation (`ownerId == request.auth.uid`).
- **Offline & Local Cache First**: Works seamlessly offline; syncs automatically once signed in.

### 6. Responsive Design
- Fully optimized for desktop workstations, tablets, and smartphones.
- Mobile slide-over navigation with dedicated dismiss controls.
- Adaptive typography and fluid metric cards preventing layout clipping or text overlap on narrow screens.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (strict mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **AI Engine**: [Google Gen AI SDK (`@google/genai`)](https://www.npmjs.com/package/@google/genai)
- **Cloud Database & Auth**: [Firebase Firestore & Firebase Auth](https://firebase.google.com/)
- **Backend API**: [Express](https://expressjs.com/) on Node.js / [TSX](https://github.com/privatenumber/tsx)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF)
- **Icons & Typography**: Google Fonts (*Playfair Display*, *Plus Jakarta Sans*, *Material Symbols Outlined*)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)
- (Optional) A **Firebase Project** for cloud synchronization

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/jodoh-by-ai.git
   cd jodoh-by-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   PORT=3000
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

---

## 📜 Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| **`npm run dev`** | `tsx server.ts` | Runs the full-stack development server with Vite middleware |
| **`npm run build`** | `vite build` | Compiles client assets into the `dist/` directory |
| **`npm start`** | `tsx server.ts` | Starts the production server |
| **`npm run lint`** | `tsc --noEmit` | Runs TypeScript type checking across the project |

---

## 📂 Project Structure

```text
├── index.html                      # HTML entry point with metadata & typography
├── metadata.json                   # App capabilities & configuration
├── package.json                    # Project dependencies & scripts
├── server.ts                       # Express backend & Gemini API integration
├── firestore.rules                 # Hardened Attribute-Based Access Control security rules
├── firebase-blueprint.json         # Intermediate schema definition for Firestore
├── firebase-applet-config.json     # Firebase web project configuration
├── src/
│   ├── main.tsx                    # React client entry point
│   ├── firebase.ts                 # Firebase app, auth, and firestore initialization
│   ├── index.css                   # Tailwind v4 theme, design tokens & typography
│   ├── App.tsx                     # Main application layout, auth & global state
│   ├── types.ts                    # TypeScript data models (Participant, MatchResult)
│   ├── data/
│   │   └── initialData.ts          # Seed candidate profiles & pre-computed matches
│   └── components/
│       ├── Header.tsx              # Application header, branding, engine status & auth
│       ├── Sidebar.tsx             # Navigation rail with mobile drawer
│       ├── ParticipantsPoolView.tsx# Cohort masterfile, candidate grid & filters
│       ├── TopMatchesView.tsx      # Match results, Gold Ribbon card & export triggers
│       ├── DossierPreviewModal.tsx # In-app executive PDF print & preview dialog
│       ├── AddEditParticipantModal.tsx # Participant modal with photo upload
│       ├── DeleteConfirmModal.tsx  # Deletion verification dialog
│       ├── GenerationModal.tsx     # Synthesis progress visualization
│       ├── InsufficientWarningModal.tsx # Quorum check modal (PRD Section F04)
│       ├── AffinityVectorsModal.tsx# Mathematical vector model explanation
│       ├── MatchingRulesModal.tsx  # Organizer heuristics documentation
│       └── Toast.tsx               # Notification toasts
├── tsconfig.json                   # TypeScript compiler configuration
└── vite.config.ts                  # Vite build tool configuration
```

---

## 🔒 Privacy & Security

- **Attribute-Based Firestore Rules**: Strict security rules prevent cross-tenant data leakage; only the authenticated organizer can access their own participants and match dossiers.
- **Local Fallback**: Full functionality is preserved locally even without internet access or when unauthenticated.
- **Secure Server-Side API**: Gemini AI API keys remain server-side and are never exposed to browser clients.

---

## 📄 License

This project is licensed under the [Apache License 2.0](LICENSE).
