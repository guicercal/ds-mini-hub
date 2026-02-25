# DealSmart Communications Hub - Planejamento

## 1. Visão Geral
Projeto de avaliação: Um "Communications Hub" simplificado para concessionárias. Permite que a equipe visualize conversas com clientes (apoiadas por IA) e gerencie integrações com o HubSpot CRM.

## 2. Decisões de Arquitetura (Aprovadas)
- **Stack:** Next.js (App Router) como Monorepo Full-Stack. (Decisão: Demonstrar proficiência no ecossistema atual do Next.js).
- **Banco de Dados Local:** SQLite via Prisma ORM. *Motivo: É um teste "take-home". O avaliador pode clonar, rodar `npm install` e `npm run dev` sem precisar subir um container Docker de PostgreSQL.*
- **UI/Estilização:** Tailwind CSS + Componentes acessíveis (Radix/Shadcn UI).
- **Sincronismo HubSpot:** Sincronismo direto. Se a API do HubSpot falhar no momento de logar a mensagem, salvamos com a flag `syncFailed: true` para manter a UI responsiva e não travar o envio.
- **Resiliência IA:** Fallback explícito na UI em caso de lentidão ou falha no LLM (ex: Rate Limit), preservando a experiência da equipe de vendas.
- **Tempo Real (Real-time):** Server-Sent Events (SSE) ou Polling Otimizado (SWR) nativos do Next.js, ideais para arquitetura Serverless.

## 3. Modelo de Dados (Prisma)
### `Conversation`
- `id`: String (UUID)
- `hubspotContactId`: String (ID do contato no HubSpot)
- `status`: Enum (NEW, IN_PROGRESS, RESOLVED)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### `Message`
- `id`: String (UUID)
- `conversationId`: String (Relacionamento)
- `senderType`: Enum (CUSTOMER, HUMAN_AGENT, AI_AGENT)
- `text`: String
- `createdAt`: DateTime
- `syncFailed`: Boolean (Padrão: `false` - Ativado caso o HubSpot demore ou falhe)

## 4. Integrações
### A. HubSpot CRM
1. `GET /crm/v3/objects/contacts`: Buscar contatos para inicializar/parear as conversas.
2. `POST /crm/v3/objects/notes` & Associar: Quando uma mensagem for enviada no chat, registrar no perfil do HubSpot como uma nota/engajamento.

### B. LLM (OpenAI - Claude/GPT)
1. Construir prompt contextual: *"Você é um assistente de vendas da concessionária..."*
2. Fornecer as últimas mensagens como contexto.
3. Tratamento de erro na rota e exibição de erro legível no Frontend se falhar.

## 5. Fases de Implementação

- [ ] **Fase 1: Setup do Projeto e Infraestrutura**
  - Inicializar Next.js + Tailwind.
  - Configurar Prisma + SQLite.
  - Setup das variáveis de ambiente (`HUBSPOT_ACCESS_TOKEN`, `OPENAI_API_KEY`).
  
- [ ] **Fase 2: Integração de Leitura e Seed**
  - Conectar ao HubSpot e buscar 5 contatos de teste.
  - Criar script de Seed local para montar as 3 conversas de teste mencionadas no *take-home* vinculadas a esses contatos.

- [ ] **Fase 3: Desenvolvimento da UI (Frontend)**
  - Sidebar com lista de conversas.
  - Área principal da conversa (balões diferenciados para IA, Humano e Cliente).
  - Painel de sugestão da IA (com Skeleton Loading e estados de Fallback).

- [ ] **Fase 4: APIs Backend (Next.js Route Handlers)**
  - `GET /api/conversations`: Listagem.
  - `POST /api/messages`: Envio de mensagens + salvamento local.
  - `POST /api/ai/suggest`: Geração de resposta sugerida (LLM).

- [ ] **Fase 5: Sincronização e Tempo Real**
  - Implementar reflexo no HubSpot no momento do POST da mensagem (com flag de fallback `syncFailed`).
  - Polling dinâmico/SSE na tela de chat para atualização em tempo real sem refresh.
