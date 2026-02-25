# 🧠 DealSmart AI Communications Hub

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Testing-729B1B?style=flat-square&logo=vitest)](https://vitest.dev/)

*Read the Portuguese version: [README.pt-BR.md](README.pt-BR.md)*

Welcome to the **DealSmart AI Communications Hub**. This application is a real-time CRM interface designed to assist sales teams with AI-generated responses. It acts as an Omnichannel Inbox, tracking customer conversations and providing contextual replies using multiple LLMs (OpenAI, Google Gemini, Anthropic Claude).

## ✨ Key Features

- **Multi-LLM Engine:** Switch between ChatGPT-4o, Gemini 2.5 Flash, and Claude 3 using a UI selector. The backend uses the Factory and Strategy patterns for easy model swapping.
- **Optimistic UI & Short-Polling:** Real-time chat fluidity without WebSockets. The UI uses optimistic updates combined with polling to prevent screen flickering or layout shifts.
- **Rate-Limiting Cache:** An In-Memory LRU Cache manages HubSpot CRM API requests, preventing API rate limit issues during active polling.
- **CRM Synchronization:** Messages sync securely to HubSpot as Notes tied to the Contact, with graceful fallbacks if the CRM API is unavailable.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone <your-repo-url>
cd dealsmart-hub
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and populate it with your API keys. The app dynamically adapts to whatever keys you provide.

```env
# Database
DATABASE_URL="file:./dev.db"

# CRM Configuration
HUBSPOT_ACCESS_TOKEN="your_hubspot_private_app_token"

# AI Providers (Feel free to configure one or all of them)
OPENAI_API_KEY="sk-..."
GEMINI_API_KEY="AIza..."
CLAUDE_API_KEY="sk-ant-..."
```
> **Note:** The UI Dropdown will automatically hide AI models that lack a configured API key in this file.

### 4. Database Setup
This project uses SQLite for ease of evaluation. Initialize the Prisma ORM:
```bash
npx prisma db push
npx prisma generate
```

*(Optional)* Seed the database with sample conversations:
```bash
npx prisma db seed
```
*(If you haven't configured a seed script yet, you can manually insert a record via `npx prisma studio` to test the UI).*

### 5. Run the Application
Start the Next.js development server:
```bash
npm run dev
```
Navigate to `http://localhost:3000` in your browser.

---

## 🧪 Testing

This project employs **Vitest** to ensure the architectural integrity of the core business logic. We focus our testing strategy on the critical paths: AI Factory instantiation, Fallback mechanisms, and API Rate-Limiting Cache Logic.

To run the test suite:
```bash
npm run test
```

To run tests in interactive watch mode during development:
```bash
npm run test:watch
```

## 🏗️ Architecture Deep Dive

The technical decisions behind this project were made to showcase Senior-level software engineering practices, prioritizing maintainability, security, and performance. 

For a comprehensive explanation of the **Factory Pattern**, **Optimistic State Merging**, and our **Serverless Caching Strategy**, please read our detailed Architecture Document:

👉 **[Read the Architecture Documentation (ARCHITECTURE.md)](ARCHITECTURE.md)**
