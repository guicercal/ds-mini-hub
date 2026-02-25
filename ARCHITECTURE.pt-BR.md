# 🏛️ Arquitetura e Decisões Técnicas

*Leia a versão em Inglês: [ARCHITECTURE.md](ARCHITECTURE.md)*

Este documento explica as escolhas técnicas do projeto DealSmart AI Communications Hub. O objetivo foi criar uma aplicação robusta, de fácil manutenção e pronta para o nível de produção.

---

## 1. Integração de IA: Padrões Strategy & Factory

Para evitar a codificação rígida (hardcoding) de chamadas HTTP nas rotas do Next.js, o módulo de IA (`src/lib/ai/`) foi construído utilizando *Design Patterns* tradicionais.

- **Padrão Strategy:** Criamos a interface [AiProvider](src/lib/ai/types.ts#L14) que define o contrato: `generateSuggestion(messages)`. As classes `OpenAiProvider`, `ClaudeProvider`, e `GeminiProvider` implementam essa interface para lidar com as peculiaridades e integrações de cada modelo (OpenAI, Anthropic, Google).
- **Padrão Factory:** As rotas não inicializam provedores diretamente. Elas acionam a fábrica [AiFactory](src/lib/ai/AiFactory.ts#L11). A fábrica consulta o banco local (`AppSettings`) para checar qual o modelo ativo pelo usuário, verifica as chaves configuradas no `.env` e retorna a instância adequada da IA.
- **Fail-Safe:** Caso o banco falhe, um `try...catch` garante que a Factory [retorne um modelo padrão (Gemini)](src/lib/ai/AiFactory.ts#L46), impedindo a aplicação de travar.

## 2. Fluidez de Chat: Optimistic UI vs WebSockets

Em um ambiente serverless (como a Vercel), manter conexões WebSockets persistentes gera complexidade técnica e requer serviços adicionais dependentes. Por isso, optamos por **Short-Polling combinado a Optimistic UI**.

- **O Problema:** Um polling simples ([efetuar fetch a cada 3 segundos](src/components/ChatArea.tsx#L54)) causa falhas visuais. Ao enviar uma mensagem, ela aparece na tela, desaparece no próximo poll caso não tenha salvado a tempo no banco e, e reaparece em seguida (efeito "flicker").
- **A Solução:** Marcamos as mensagens locais recém-enviadas com a flag [`isOptimistic = true` no ChatArea.tsx](src/components/ChatArea.tsx#L81). Ao receber uma nova lista do backend, o frontend inteligentemente [mescla o JSON real com essas mensagens temporárias locais](src/components/ChatArea.tsx#L37).
- **O Resultado:** A interface exibe a mensagem de imediato simulando a velocidade de um WebSocket, enquanto a arquitetura permanece leve via chamadas HTTP REST pontuais.

## 3. Rate Limit: Cache em Memória (TTL)

Acessar a API da HubSpot a cada requisição originada pelo polling exauriria o plano de acesso da conta em API rapidamente, resultando no erro estrutural "429 Too Many Requests".

Para resolver isso de forma simples, inserimos um `Cache em Memória (LRU) com TTL` ([src/lib/hubspot-cache.ts](src/lib/hubspot-cache.ts#L32)).
- Quando os dados de Hubspot são solicitados pelo frontend, o servidor intercepta a requisição.
- Tendo os dados do contato já cacheados no Node.js `Map` como [mais recentes que 60 segundos](src/lib/hubspot-cache.ts#L54), o servidor devolve a resposta em `~2ms` sem fazer nenhuma comunicação à API externa.
- Se o limite de tempo estourar (Time-To-Live), ele libera uma requisição fresca à HubSpot e já [atualiza o objeto no cache](src/lib/hubspot-cache.ts#L69).
- **Resultado:** Mesmo se houverem várias abas do navegador fazendo consultas simultâneas na rota [`/api/conversations/[id]`](src/app/api/conversations/[id]/route.ts#L39), a HubSpot é consumida invariavelmente apenas uma vez por minuto para cada perfil de contato.

## 4. Segurança de Credenciais

- As chaves de API nunca são expostas ao ambiente do navegador (client-side). Todo cálculo para prompts e consumos das APIs são realizados estritamente nas rotas bloqueadas de Backend (`/api/`).
- O Frontend verifica quais Inteligências Artificiais estão disponíveis globalmente via uma rota pretoriana independente ([`api/settings/ai/route.ts`](src/app/api/settings/ai/route.ts#L14)), e apenas carrega os seletores (dropdown) de nomes permitidos no código fonte do Browser.

## 5. Testes Unitários (Vitest)

Utilizamos o **Vitest** pela sua integração moderna, velocidade e suporte nativo pelo compilador Vite/ESM (evitando overhead de configurações).
- Foco da suíte reside na lógica de Core Business, e não na inespecificidade visual de componentes CSS.
- Utilizamos `vi.mock` mitigando efeitos colaterais e blindando os Testes do Banco de Dados real (Prisma) e da Rede Externa.
- Para comprovar o bloqueio contra requisições abusivas da Rate Limit, a infra domina o tempo virtual invocando [vi.setSystemTime() para simular o avanço de 61 segundos](src/lib/__tests__/hubspot-cache.test.ts#L52), atestando a caducidade do Cache Local sem recorrer a congelamentos forçados duradouros (como `sleep()` ou `setTimeout()`) nos processos assíncronos de pipeline de CI/CD.

## 6. Sugestão de Respostas com IA & Gerenciamento de Tokens

A funcionalidade de sugestão de respostas atua como o motor de inteligência do CRM, analisando o histórico da conversa para gerar respostas contextuais.

### Funcionamento e Contexto
Para garantir que a Inteligência Artificial compreenda a linha do tempo da negociação, as seguintes regras foram implementadas:
- **Consciência de Diálogo (Context Awareness):** As mensagens são mapeadas e convertidas para os papéis de `User` (Cliente) e `Assistant/Model` (Vendedor). Isso assegura que o modelo de linguagem não perca o contexto de quem disse o quê.
- **System Prompts:** Antes de enviar a requisição ao LLM (OpenAI, Gemini ou Claude), a classe provedora [injeta uma instrução de sistema (`System Prompt`)](src/lib/ai/OpenAiProvider.ts#L25). Esta instrução define a "persona" da IA, garantindo que as respostas mantenham o tom de voz profissional e orientado a vendas da empresa.

### Otimização e Controle de Tokens
APIs de LLM precificam requisições com base na contagem de Tokens (volume de texto trafegado). Para evitar custos operacionais fora de controle e otimizar a performance da rede, aplicamos dois limitadores:
1. **Fatiamento de Contexto (Window Slicing):** Enviar o histórico de conversas longas na íntegra é inviável financeiramente e eleva a latência. O componente frontend intervém e [aplica uma operação de `slice(-10)`](src/components/ChatArea.tsx#L124). Apenas as 10 interações mais recentes são enviadas à API, mantendo a "memória de curto prazo" intacta ao mesmo tempo em que reduz massivamente o tamanho do payload.
2. **Limite Fixo de Resposta (`max_tokens`):** As requisições HTTP enviadas aos provedores estipulam explicitamente `maxOutputTokens: 1000`. Essa configuração age como um limite definitivo no backend, garantindo respostas coesas para a interface de chat e prevenindo anomalias na geração excessiva de novos *tokens*.
