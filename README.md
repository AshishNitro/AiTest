# No-Code AI Workflow Builder

<p align="center">
  <strong>Visually create intelligent AI workflows with drag-and-drop components</strong>
</p>

---

## 🗂️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                       │
│  ┌───────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ Component  │  │  React Flow      │  │  Configuration   │  │
│  │ Library    │  │  Canvas          │  │  Panel           │  │
│  └───────────┘  └──────────────────┘  └──────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   Chat Modal                            ││
│  └─────────────────────────────────────────────────────────┘│
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API
┌───────────────────────┴─────────────────────────────────────┐
│                     Backend (FastAPI)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ Workflow  │ │ Document │ │ LLM      │ │ Web Search     │  │
│  │ Engine    │ │ Service  │ │ Service  │ │ Service        │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │
└───────┬──────────────┬──────────────┬───────────────────────┘
        │              │              │
  ┌─────┴─────┐ ┌──────┴────┐ ┌──────┴──────┐
  │ PostgreSQL │ │ ChromaDB  │ │ LLM APIs    │
  │ (Metadata) │ │ (Vectors) │ │ OpenAI/     │
  │            │ │           │ │ Gemini      │
  └────────────┘ └───────────┘ └─────────────┘
```

## ✨ Features

- **Visual Workflow Builder** — Drag-and-drop interface built with React Flow
- **5 Component Types** — User Input, Knowledge Base, LLM Engine, Web Search, Output
- **Multi-LLM Support** — OpenAI GPT & Google Gemini
- **RAG Pipeline** — Upload PDFs, generate embeddings, retrieve context with ChromaDB
- **Web Search Integration** — SerpAPI and Brave Search
- **Chat Interface** — Interactive chat modal with message history and source attribution
- **Workflow Persistence** — Save/load workflows from PostgreSQL
- **Docker Deployment** — Fully containerized with Docker Compose

## 🧩 Workflow Components

| Component          | Description                     | Inputs         | Outputs  |
| ------------------ | ------------------------------- | -------------- | -------- |
| **User Input**     | Entry point for user queries    | —              | Query    |
| **Knowledge Base** | Document upload & vector search | Query          | Context  |
| **LLM Engine**     | AI response generation          | Query, Context | Response |
| **Web Search**     | Live web search results         | Query          | Context  |
| **Output**         | Displays final response         | Output Text    | —        |

## 🛠️ Tech Stack

| Layer          | Technology                       |
| -------------- | -------------------------------- |
| Frontend       | React, Vite, React Flow, Zustand |
| Backend        | FastAPI, SQLAlchemy, Pydantic    |
| Database       | PostgreSQL                       |
| Vector Store   | ChromaDB                         |
| LLMs           | OpenAI GPT, Google Gemini        |
| Embeddings     | OpenAI, Gemini Embeddings        |
| Web Search     | SerpAPI, Brave Search            |
| PDF Processing | PyMuPDF                          |
| Deployment     | Docker, Docker Compose           |

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **PostgreSQL** ≥ 14
- **Docker** (optional, for containerized deployment)

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd PlanetAi

# Start all services
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Local Development

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys and database URL

# Start the server
uvicorn app.main:app --reload --port 8000
```

#### Database Setup

```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE planetai;"
```

The tables are auto-created on first startup.

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at http://localhost:5173

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/planetai
OPENAI_API_KEY=sk-...         # Optional: set as default
GEMINI_API_KEY=AI...           # Optional: set as default
SERPAPI_KEY=...                # Optional: for web search
BRAVE_API_KEY=...              # Optional: for web search
```

> **Note:** API keys can also be configured per-component in the workflow editor UI.

## 📖 Usage

### 1. Create a Stack

Click "Create New Stack" on the landing page and give it a name.

### 2. Build Your Workflow

Drag components from the left panel onto the canvas:

1. Add a **User Input** node
2. (Optional) Add a **Knowledge Base** node and upload PDFs
3. Add an **LLM Engine** node and configure your API key/model
4. Add an **Output** node
5. Connect nodes by dragging from output handles to input handles

### 3. Configure Components

Click any node to open its configuration panel on the right:

- Set API keys, models, and embedding options
- Upload documents for the Knowledge Base
- Write custom prompt templates with `{context}` and `{query}` placeholders

### 4. Build & Chat

1. Click **Build Stack** to validate your workflow
2. Click **Chat with AI** to open the chat interface
3. Ask questions and get AI-powered responses!

## 📁 Project Structure

```
PlanetAi/
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── api/               # API client (Axios)
│   │   ├── components/
│   │   │   ├── chat/          # Chat modal
│   │   │   ├── nodes/         # React Flow custom nodes
│   │   │   └── panels/        # Sidebar panels
│   │   ├── pages/             # Landing & Editor pages
│   │   ├── store/             # Zustand state management
│   │   └── styles/            # Global CSS
│   ├── Dockerfile
│   └── vite.config.js
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── core/              # Config & database
│   │   ├── models/            # SQLAlchemy models & Pydantic schemas
│   │   └── services/          # Business logic services
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml
└── README.md
```

## 🔌 API Endpoints

| Method   | Endpoint                                      | Description                |
| -------- | --------------------------------------------- | -------------------------- |
| `GET`    | `/api/stacks/`                                | List all stacks            |
| `POST`   | `/api/stacks/`                                | Create a new stack         |
| `GET`    | `/api/stacks/{id}`                            | Get stack details          |
| `PUT`    | `/api/stacks/{id}`                            | Update stack (nodes/edges) |
| `DELETE` | `/api/stacks/{id}`                            | Delete a stack             |
| `POST`   | `/api/stacks/{id}/documents/upload`           | Upload a document          |
| `POST`   | `/api/stacks/{id}/documents/{doc_id}/process` | Process document           |
| `POST`   | `/api/stacks/{id}/validate`                   | Validate workflow          |
| `POST`   | `/api/stacks/{id}/chat`                       | Execute workflow & chat    |
| `GET`    | `/api/stacks/{id}/chat/history`               | Get chat history           |

## 📝 License

MIT
