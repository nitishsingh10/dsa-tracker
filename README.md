# DSA Tracker ⚡

A sleek, dark-themed web app to track your Data Structures & Algorithms assignments — auto-synced with Google Sheets.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-purple?logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-cyan?logo=tailwindcss)

## Features

- **Google Sheets Sync** — Connect your assignment sheet and auto-import problems
- **Topic Grouping** — Problems organized by DSA topic (Hashing, Trees, DP, etc.)
- **Progress Tracking** — Cycle through Todo → Solving → Done per problem
- **Filters** — Search, filter by difficulty (Easy/Medium/Hard), platform, or status
- **Star & Notes** — Bookmark important problems and add personal notes
- **Class Notes** — Quick access to linked Google Drive notes
- **Offline-Ready** — Data cached in localStorage, works without internet after first sync
- **Dark Mode** — Premium dark UI with Inter font

## Tech Stack

| Layer     | Tech                       |
|-----------|----------------------------|
| Framework | React 19 + Vite 8          |
| Styling   | Tailwind CSS 4             |
| Auth      | Google Identity Services    |
| Data      | Google Sheets API v4        |
| Storage   | localStorage (client-side)  |
| Hosting   | Vercel                      |

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Cloud project with OAuth 2.0 credentials
- A Google Sheet with your DSA assignments (tab named `25B`)

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/dsatracker.git
cd dsatracker

# Install dependencies
npm install

# (Optional) Set your Google OAuth Client ID
cp .env.example .env
# Edit .env and add your VITE_GOOGLE_CLIENT_ID

# Start dev server
npm run dev
```

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized JavaScript origins:
   - `http://localhost:5173` (for local dev)
   - `https://your-app.vercel.app` (for production)
4. Enable the **Google Sheets API**

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to [vercel.com](https://vercel.com) for automatic deployments.

**After deploying**, add your Vercel domain to the OAuth client's authorized JavaScript origins in Google Cloud Console.

### Environment Variables (Vercel Dashboard)

| Variable                  | Description              |
|---------------------------|--------------------------|
| `VITE_GOOGLE_CLIENT_ID`   | Google OAuth Client ID   |

## Project Structure

```
src/
├── components/       # React UI components
│   ├── Dashboard.jsx     # Progress stats bar
│   ├── Filters.jsx       # Search & filter controls
│   ├── LoginScreen.jsx   # Google sign-in screen
│   ├── Navbar.jsx        # Top navigation bar
│   ├── NotesModal.jsx    # Problem notes editor
│   ├── ProblemList.jsx   # Main problem grid (grouped by topic)
│   ├── SheetPrompt.jsx   # Sheet URL input modal
│   └── Toast.jsx         # Notification toasts
├── contexts/         # React context providers
│   ├── AuthContext.jsx   # Google OAuth state
│   └── TrackerContext.jsx # Problem data & sync logic
├── services/         # API & storage layer
│   ├── googleAuth.js     # Token management
│   ├── sheetsApi.js      # Google Sheets API calls
│   └── storage.js        # localStorage helpers
├── utils/            # Data processing
│   ├── mergeEngine.js    # Merge new data with existing progress
│   └── parseSheet.js     # Parse sheet rows into problem objects
├── config.js         # App configuration
├── index.css         # Global styles & theme
└── main.jsx          # Entry point
```

## License

MIT
