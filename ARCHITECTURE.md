# 🏛️ Architecture & Technical Decisions

*Read the Portuguese version: [ARCHITECTURE.pt-BR.md](ARCHITECTURE.pt-BR.md)*

This document explains the technical choices in the DealSmart AI Communications Hub. The goal is to provide a robust, maintainable, and production-ready application.

---

## 1. AI Integration: Strategy & Factory Patterns

Instead of hardcoding API calls directly into Next.js Routes, the AI module (`src/lib/ai/`) uses standard Object-Oriented Design Patterns.

- **Strategy Pattern:** We use the [AiProvider Interface](src/lib/ai/types.ts#L14) to enforce a unified method: `generateSuggestion(messages)`. Classes like `OpenAiProvider`, `ClaudeProvider`, and `GeminiProvider` implement this interface to handle their specific API constraints.
- **Factory Pattern:** Routes do not instantiate providers directly. They call [AiFactory](src/lib/ai/AiFactory.ts#L11). The factory checks the Database (`AppSettings`) for the active model, verifies `.env` keys, and returns the appropriate Provider.
- **Fail-Safe Mechanism:** If database access fails, the factory uses a `try...catch` block to [fallback to a default LLM (Gemini)](src/lib/ai/AiFactory.ts#L46), ensuring the app remains functional.

## 2. Real-Time Chat: Optimistic UI vs. WebSockets

For a serverless Next.js application (like Vercel), maintaining persistent WebSockets introduces infrastructure complexity. We opted for **Short-Polling mixed with Optimistic UI** state.

- **The Problem:** Simple polling ([fetching every 3 seconds](src/components/ChatArea.tsx#L54)) causes layout shifts. A sent message might disappear on the next poll if the database hasn't saved it yet, then reappear later.
- **The Solution:** We tag newly sent messages with an [`isOptimistic = true` local flag](src/components/ChatArea.tsx#L81). When the polling routine fetches fresh data, it intelligently [filters and merges](src/components/ChatArea.tsx#L37) the backend payload with the array of optimistic messages.
- **The Result:** The frontend reflects messages instantly, closely simulating WebSocket performance while running on standard stateless REST API architecture.

## 3. Rate Limiting Protection: Cache TTL

Polling external CRMs like HubSpot every 3 seconds would quickly exhaust API rate limits, resulting in a 429 Error.

To prevent this, we use an `In-Memory LRU Cache TTL` ([src/lib/hubspot-cache.ts](src/lib/hubspot-cache.ts#L32)).
- When the UI requests contact data, it checks the local Node.js `Map` cache.
- If the data is [less than 60 seconds old](src/lib/hubspot-cache.ts#L54), the server returns the cached response locally (in `~2ms`).
- When the 60-second Time-To-Live expires, it makes exactly one fresh request to HubSpot and [updates the cache map](src/lib/hubspot-cache.ts#L69).
- **Outcome:** No matter how many active browser tabs poll the [`/api/conversations/[id]`](src/app/api/conversations/[id]/route.ts#L39) endpoint simultaneously, the HubSpot API is called at most once per minute per contact.

## 4. Security: Safe Credential Handling

- All LLM computations and CRM interactions happen strictly on the server (Next.js `/api/` App Routes). 
- API Keys are never exposed to the client-side browser bundle.
- The UI dropdown safely verifies available API keys via a proxy route ([`/api/settings/ai/route.ts`](src/app/api/settings/ai/route.ts#L14)) to conditionally render available AI models in the UI.

## 5. Software Testing (Vitest)

We chose **Vitest** over Jest for native TypeScript support and rapid execution within the Vite/ESM ecosystem.
- The test suite focuses on verifying core business logic.
- Tests mock the Prisma Data Layer and HubSpot Network Requests (`vi.mock`) to prevent unintended side-effects.
- Time-based rate-limiting rules are mathematically tested by advancing system time using [`vi.setSystemTime()`](src/lib/__tests__/hubspot-cache.test.ts#L52) to validate TTL expiration without executing actual timeouts or network requests.

## 6. AI Suggestion Engine & Token Management

The AI Suggestion feature acts as the core intelligence loop, analyzing the ongoing chat history to draft context-aware sales responses.

### Implementation and Context
When generating a reply, the system must structure the prompt for the LLM effectively:
- **Context Awareness:** The frontend maps previous messages into standard `User` (Customer) and `Assistant/Model` (Sales Rep) roles. This ensures the language model accurately interprets the dialogue history.
- **Dynamic System Prompts:** Before the request reaches the external LLM providers, the Factory Provider class [injects a `System Prompt`](src/app/api/ai/suggest/route.ts#L29) retrieved directly from the Database (`AppSettings`). This instruction enforces the AI's persona, and the dealership owner can update this prompt dynamically via the UI without a code deploy.

### Token Optimization Controls
LLM APIs charge per token (input and output text volume). To ensure operational cost-efficiency and low network latency, two limits were implemented:
1. **Context Window Slicing:** Sending an extensive, months-long conversation history is both costly and slow. The `ChatArea` component [applies an array `slice(-10)` operation](src/components/ChatArea.tsx#L124) right before the fetch call. The API only receives the 10 most recent interactions, preserving the necessary short-term context while minimizing payload size by up to 90%.
2. **Hard Output Limits (`max_tokens`):** All LLM API fetch functions enforce a strict `maxOutputTokens: 1000` rule. This configuration establishes a hard backend limit, preventing edge cases where the model generates unpredictably long texts and keeping API billing strictly capped.
