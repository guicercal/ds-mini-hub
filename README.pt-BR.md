# 🧠 DealSmart AI Communications Hub

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Testing-729B1B?style=flat-square&logo=vitest)](https://vitest.dev/)

*Leia a versão em Inglês: [README.md](README.md)*

Bem-vindo ao **DealSmart AI Communications Hub**. Esta aplicação é uma interface de CRM em tempo real que auxilia equipes de vendas com sugestões geradas por Inteligência Artificial. O sistema atua como uma Caixa de Entrada Omnichannel, rastreando conversas e sugerindo respostas contextuais através de múltiplos LLMs (OpenAI, Google Gemini, Anthropic Claude).

## ✨ Principais Funcionalidades

- **Motor Multi-LLM:** Alterne entre ChatGPT-4o, Gemini 2.5 Flash e Claude 3 através de um seletor na UI. O backend utiliza os padrões Factory e Strategy para facilitar a troca de modelos.
- **UI Otimista & Polling:** Chat fluido em tempo real sem WebSockets. A interface implementa atualizações otimistas combinadas com short-polling para evitar "flicker" de tela ou mudanças de layout.
- **Cache de Rate-Limit:** Um cache em memória (LRU) gerencia as requisições à API da HubSpot, evitando o bloqueio por limite de acessos (Rate Limit) durante o polling contínuo.
- **Sincronização de CRM:** Mensagens são sincronizadas de volta à HubSpot como "Notas" atreladas ao contato, contando com mecanismos de tolerância a falhas caso a API de terceiros fique indisponível.

---

## 🚀 Começando

### 1. Pré-requisitos
Certifique-se de ter instalado em sua máquina:
- **Node.js** (v18 ou superior recomendado)
- **npm** ou **yarn**

### 2. Instalação
Clone o repositório e instale as dependências:
```bash
git clone <your-repo-url>
cd dealsmart-hub
npm install
```

### 3. Configuração de Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto e insira suas credenciais. O app se adapta dinamicamente às chaves que você fornecer.

```env
# Banco de Dados
DATABASE_URL="file:./dev.db"

# Configuração de CRM
HUBSPOT_ACCESS_TOKEN="seu_token_privado_do_hubspot"

# Provedores de IA (Configure um, ou todos eles)
OPENAI_API_KEY="sk-..."
GEMINI_API_KEY="AIza..."
CLAUDE_API_KEY="sk-ant-..."
```
> **Nota:** O menu Dropdown (Seletor) no frontend esconderá automaticamente os modelos de IA que não possuírem uma chave configurada neste arquivo.

### 4. Setup do Banco de Dados
Este projeto utiliza SQLite para facilitar a avaliação técnica. Inicialize o Prisma ORM:
```bash
npx prisma db push
npx prisma generate
```

*(Opcional)* Abasteça o banco com conversas de teste:
```bash
npx prisma db seed
```
*(Caso não possua o script de seed, basta inserir um registro manualmente via `npx prisma studio` para testar o UI de chat).*

### 5. Executando a Aplicação
Inicie o servidor de desenvolvimento Next.js:
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.

---

## 🧪 Testes

Este projeto adota o **Vitest** pela sua performance e compatibilidade nativa com TypeScript. Focamos a estratégia de testes nos caminhos críticos (*Core Business*): A fábrica de Inteligência Artificial, os mecanismos de Fallback e a lógica do Cache do Rate-Limit.

Para rodar a suíte de testes:
```bash
npm run test
```

Para rodar os testes em modo interativo contínuo (Watch) durante o desenvolvimento:
```bash
npm run test:watch
```

## 🏗️ Arquitetura

As decisões técnicas deste projeto visam demonstrar práticas de Engenharia de Software em nível Sênior, priorizando manutenibilidade, segurança e performance.

Para uma explicação direta sobre a escolha dos padrões de projeto e estratégias Serverless, veja nossa documentação técnica:

👉 **[Ler a Documentação de Arquitetura (ARCHITECTURE.pt-BR.md)](ARCHITECTURE.pt-BR.md)**
