# 🎯 HireMate – Your Internship Architect

<div align="center">

**An AI-powered Career Coaching Chatbot that prepares students for high-tier software engineering internships.**

Built with **React** • **Node.js** • **MongoDB** • **Ollama (LLaMA)**

</div>

---

## 🚀 Features

### 💬 ChatGPT-Style Interface
- Clean, dark-themed UI with flat message rows and user/AI avatars
- Markdown rendering (headings, bullet points, code blocks, tables) via `react-markdown`
- Wide, centered prompt bar with image upload support
- Real-time streaming responses via Server-Sent Events (SSE)
- **Stop Generating** button to halt AI responses mid-stream

### 🧠 Smart AI Mentor (Ollama-powered)
- Runs **100% locally** using Ollama with LLaMA models — no external API keys needed
- Provides structured, professional answers with interview context
- Remembers conversation history via MongoDB text search
- `repeat_penalty: 1.2` and `temperature: 0.5` for focused, non-repetitive answers

### 🔄 Dynamic Persona Switching
Switch the AI's behavior on-the-fly with natural language commands:

| Command | Behavior |
|---------|----------|
| `Act as a placement guide` | Detailed career roadmaps & interview tips |
| `Give me MCQ answers` | Single-letter answers with 1-sentence explanations |
| `Give me cut to cut answers` | Direct, zero-fluff answers only |
| `Reset` | Returns to standard ChatGPT-style responses |

Persona state is **persisted in MongoDB** — the AI remembers your preference across sessions.

### 📊 Career Profile Dashboard
- Automatically categorizes your questions into 4 domains:
  - **Frontend** (React, CSS, HTML, Tailwind)
  - **Backend** (Node, Express, SQL, MongoDB, Docker)
  - **Data Science** (Pandas, Regression, ML, PyTorch)
  - **DSA** (Arrays, Trees, Sorting, Dynamic Programming)
- Visual progress bars showing your domain distribution
- AI-calculated job profile recommendation (e.g., "Full Stack Developer", "Data Scientist")

### 🛡️ Authentication
- JWT-based secure login/signup
- Per-user conversation history and performance tracking

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React, Vite, Tailwind CSS v4, Lucide Icons, react-markdown |
| **Backend** | Node.js, Express.js, Mongoose |
| **Database** | MongoDB |
| **AI Engine** | Ollama (LLaMA 2 / LLaMA 3.2 Vision) |
| **Auth** | JWT + bcrypt |

---

## 📦 Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- [Ollama](https://ollama.com/) installed and running locally

### 1. Clone the repository
```bash
git clone https://github.com/viditkumar21/basic-react.git
cd basic-react
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/chatbot
JWT_SECRET=your_jwt_secret_here
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
```

### 4. Start Ollama
```bash
ollama pull llama2
ollama serve
```

### 5. Run the Application
```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📁 Project Structure

```
chatbot/
├── backend/
│   ├── controllers/
│   │   ├── chatController.js    # Chat streaming, performance tracking, personas
│   │   └── authController.js    # Login/Signup logic
│   ├── models/
│   │   ├── Chat.js              # Conversation schema
│   │   └── User.js              # User schema with performance & persona fields
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT verification
│   ├── routes/
│   │   ├── chatRoutes.js
│   │   └── authRoutes.js
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatArea.jsx         # Main chat interface
│   │   │   ├── Sidebar.jsx          # History, Skills, Profile tabs
│   │   │   ├── JobProfileDashboard.jsx  # Career progress bars
│   │   │   ├── SkillsDashboard.jsx  # Skill gap analysis
│   │   │   ├── ModelStatus.jsx      # Ollama online/offline indicator
│   │   │   └── AuthScreen.jsx       # Login/Signup form
│   │   ├── context/
│   │   │   ├── ChatContext.jsx      # Chat state, streaming, abort logic
│   │   │   └── AuthContext.jsx      # Auth state & token management
│   │   ├── App.jsx
│   │   └── index.css                # Global styles + prose typography
│   └── package.json
└── README.md
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ by [Vidit Kumar](https://github.com/viditkumar21)**

</div>
