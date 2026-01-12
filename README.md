# ConceptPulse

<div align="center">

**A Precision Learning Intelligence System**

*Transform your study notes into personalized learning experiences with AI-powered diagnostics*

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com)

</div>

---

## ✨ Overview

ConceptPulse is an intelligent learning platform that analyzes your study materials and creates personalized revision schedules using spaced repetition. Upload your notes, and our AI will identify key concepts, generate practice questions, and track your mastery over time.

## 🎯 Key Features

### 📤 Smart Upload
- Upload PDFs or images of your notes
- AI-powered concept extraction using Google Gemini
- Automatic topic detection and categorization

### 🧠 Diagnostic Analysis  
- Generates practice questions from your content
- Identifies knowledge gaps and weak areas
- Provides detailed performance insights

### 📊 Progress Tracking
- Visual mastery progression charts
- Topic-by-topic performance breakdown
- Memory retention curve analysis
- "What this means for you" personalized insights

### 🔄 Spaced Repetition
- Scientifically-optimized revision scheduling
- Daily practice sessions
- Streak tracking for motivation
- Smart prioritization of weak concepts

### ⚙️ Settings
- Profile customization
- Dark/Light mode toggle
- Notification preferences
- Account management

## 🛠 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS 4, Custom Glassmorphism |
| **UI Components** | Radix UI, shadcn/ui, Lucide Icons |
| **Backend** | Supabase (Auth, Database, Edge Functions) |
| **AI** | Google Gemini API |
| **Charts** | Recharts |
| **Animations** | Custom CSS, Motion |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/radheshyam-cod/Concept-Pulse.git
cd Concept-Pulse-main

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📁 Project Structure

```
Concept-Pulse-main/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── ui/          # Reusable UI components
│   │   │   ├── Navbar.tsx   # Navigation bar
│   │   │   └── AIChat.tsx   # AI assistant
│   │   └── pages/
│   │       ├── AuthPage.tsx
│   │       ├── DashboardPage.tsx
│   │       ├── UploadPage.tsx
│   │       ├── DiagnosisPage.tsx
│   │       ├── RevisionPage.tsx
│   │       ├── ProgressPage.tsx
│   │       └── SettingsPage.tsx
│   ├── lib/
│   │   └── supabase.ts      # API & database
│   └── styles/
│       ├── theme.css        # Color system
│       ├── animations.css   # Animations
│       └── fonts.css        # Typography
├── supabase/
│   └── functions/           # Edge functions
└── package.json
```

## 🎨 Design System

ConceptPulse features a **premium precision learning aesthetic**:

- **Primary**: Electric Indigo (246° 75%)
- **Accent**: Vibrant Violet (270° 76%)
- **Hero Gradient**: Indigo → Violet → Fuchsia
- **Glass Effects**: 75% opacity with backdrop blur
- **Shadows**: Layered with color tints


## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Supabase](https://supabase.com) - Backend infrastructure
- [Google Gemini](https://ai.google.dev) - AI capabilities
- [Lucide](https://lucide.dev) - Icons

---

<div align="center">

**ConceptPulse** — Precision learning, intelligently delivered.

</div>
