# Refinamento — App Web de Agendamento (Salão)

Documento de refinamento para construção **faseada** de um aplicativo web de agenda para salão, com autenticação, cadastro, agenda e módulo de gerenciamento (backoffice). Inclui as fases de **publicação** após a construção.

**Produto:** aplicação web única, responsiva, com superfície de operação (agenda no celular/tablet) e superfície de gestão (desktop).  
**Formato de entrega:** PWA (instalável) + uso no navegador. Lojas de aplicativo só nas fases de publicação, se fizerem sentido.

**Receita no app:** não há pagamento, caixa, maquininha nem formas de pagamento. O valor de cada atendimento é o **preço do serviço** cadastrado no backoffice. Relatórios somam esses valores (atendimentos concluídos).

> **Mudanças desde a versão anterior:**
> - App é para **um único salão fixo** — não existe tela de cadastro/criação de salão.
> - Dados de login (usuários/senhas) são **persistidos no banco** (PostgreSQL), gerenciados pela camada de backend.
> - A API usa **autenticação JWT** (JSON Web Token): login retorna `access_token` e `refresh_token`; rotas protegidas exigem `Authorization: Bearer <token>`.
> - Backend dedicado (Node.js + Express) com endpoints REST, separado do front.

---

## 1. Objetivo

Permitir que o salão:

1. ~~Cadastre a conta do negócio e usuários.~~ **O salão é fixo e pré-configurado** — não há tela de criação de salão. Usuários são criados pelo dono via backoffice.
2. Faça login com papéis distintos, com **credenciais persistidas no banco** e sessão gerenciada por **JWT**.
3. Gerencie a agenda de atendimentos.
4. No backoffice: cadastre/edite **serviços** (nome, duração, preço) e acompanhe operação e totais **conforme os serviços realizados**.

O MVP deve ser usável no dia a dia da recepção, sem depender de app nativo e **sem fluxo de cobrança**.

---

## 2. Premissas

- **Salão único e fixo**: não existe tenant dinâmico; o salão é pré-cadastrado via seed/migration. Não há tela pública de criação de salão.
- Novos usuários (recepção, profissionais) são criados pelo **dono** dentro do app (backoffice de usuários).
- **Credenciais (e-mail + hash de senha) são armazenadas no banco** gerenciadas pelo backend próprio. Não há dependência de provedor externo de auth no core.
- **JWT** é o mecanismo de autenticação da API: `POST /auth/login` retorna `{ access_token, refresh_token, expiresIn }`. O front envia `Authorization: Bearer <access_token>` em cada requisição protegida. Refresh token também é persistido no banco e invalidado no logout.
- Horário de funcionamento e fuso: America/Sao_Paulo.
- Duração dos serviços em minutos (ex.: 30, 45, 60).
- Conflito de horário: um profissional não pode ter dois atendimentos sobrepostos.
- Cliente do salão **não** agenda sozinho no MVP (agenda é operacional, feita pela recepção/profissional). Portal do cliente é fase posterior.
- **Não há módulo de pagamento.** Dinheiro, Pix, cartão, desconto na hora, estorno e NF-e ficam fora do sistema.
- O valor exibido/somado é sempre o do **serviço vinculado** ao agendamento (preço de tabela no momento do agendamento — ver regra de snapshot na seção 10).
- **Serviços** (CRUD) existem **somente no backoffice**, não na agenda operacional.
- PWA para operação; gerenciamento pensado para tela grande.

---

## 3. Personas e papéis

| Papel | Quem é | Acesso |
|---|---|---|
| **Dono** | Proprietário | Tudo: agenda, clientes, profissionais, usuários, backoffice (serviços e totais) |
| **Recepção** | Balcão | Agenda geral, clientes; consulta preço do serviço na hora de agendar (somente leitura) |
| **Profissional** | Cabeleireiro(a), manicure, etc. | Agenda própria, marcar status do atendimento |
| **Cliente final** | Quem vai ao salão | Fora do MVP (sem login) |

A recepção **não** cadastra nem altera catálogo de serviços. Isso é backoffice (dono).

---

## 4. Escopo por módulo

### 4.1 Cadastro

**Cadastro do negócio (primeiro acesso)**

> ~~Criação de salão via tela pública~~. **Removido.** O salão é pré-configurado (seed de banco). Não existe rota `/cadastro` de salão para o usuário final.

**Cadastros na operação (após login, somente pelo dono)**

- **Profissionais:** nome, serviços que realiza (escolha entre serviços já cadastrados), horário de trabalho (início/fim).
- **Clientes:** nome, telefone, observações (alergia, preferência).
- **Usuários do sistema:** convite/criação por e-mail + papel (dono, recepção, profissional), vinculado a um profissional quando couber.

**Cadastro de serviços:** ver 4.4 (somente backoffice).

Fora desta fase: importação em massa, múltiplas unidades, logo/branding avançado.

### 4.2 Login

- E-mail + senha (credenciais salvas no banco com hash bcrypt).
- API endpoint `POST /api/auth/login` → retorna `access_token` (JWT, exp 15 min) + `refresh_token` (exp 7 dias, persistido na tabela `refresh_tokens`).
- Endpoint `POST /api/auth/refresh` → valida refresh token no banco e emite novo access token.
- Endpoint `POST /api/auth/logout` → revoga refresh token no banco.
- Recuperação de senha por código de 6 dígitos enviado ao celular por WhatsApp (fallback SMS): `POST /api/auth/forgot-password` (código válido por 10 min, só o hash é salvo em `password_reset_codes`) → `POST /api/auth/verify-reset-code` (devolve token de uso único, exp 15 min) → `POST /api/auth/reset-password`.
- Sessão persistente no cliente: `access_token` em memória; `refresh_token` em `httpOnly cookie` ou `localStorage` (decisão de implementação, documentar escolha).
- Bloqueio de rotas por autenticação e por papel (`role` embutido no payload JWT).
- Mensagens claras de erro (credencial inválida, token expirado, token revogado).

Fora desta fase: login social, SSO, 2FA.

### 4.3 Agenda

Visão principal do dia a dia.

- Grade por **dia** (padrão) e por **profissional**.
- Criar agendamento: cliente, serviço (catálogo), profissional, data/hora, observação.
- Exibir **valor do serviço** no card/detalhe (informativo, não editável na agenda).
- Editar, remarcar, cancelar.
- Status: `agendado` → `confirmado` → `em_atendimento` → `concluido` | `cancelado` | `nao_compareceu`.
- Validação de conflito de horário e de horário de trabalho do profissional.
- Filtro por profissional e por data (hoje, próximo dia, calendário).
- Lista do dia otimizada para celular (cards); grade em tablet/desktop.
- Ao concluir: **não** abre cobrança. Só atualiza status.

Fora desta fase: encaixe automático inteligente, lista de espera, recorrência, WhatsApp automático, comissão no ato do agendamento, alteração de preço na agenda.

### 4.4 Módulo de gerenciamento (backoffice)

Uso principal em **desktop**. Aviso em tela estreita: “use um computador para gerenciar serviços e relatórios”.

**Serviços (CRUD exclusivo do backoffice)**

- Nome, duração (minutos), preço (R$), ativo/inativo.
- Ordenação e busca.
- Desativar em vez de apagar se já houver agendamentos.
- Profissionais passam a escolher apenas serviços ativos.

**Operação**

- Dashboard: atendimentos do dia, ocupação por profissional, cancelamentos / não compareceu.
- CRUD de profissionais e clientes pode ficar nas rotas de cadastro; o hub `/gerenciamento` concentra serviços + visão gerencial.
- Fechamento do dia (visão operacional: quantidade por status).

**Totais por serviço (não é caixa)**

- Lista de atendimentos **concluídos** no período, com valor = preço do serviço (snapshot).
- Totais: soma dos valores dos serviços concluídos (hoje, semana, mês).
- Quebra por profissional e por serviço.
- Exportar CSV (desejável no MVP se simples).

**Despesas e balanço do mês**

- Lançamento de despesas pelo dono em `/gerenciamento/despesas`, com descrição, categoria, valor e observações.
- Dois tipos: **fixa** (repete todo mês no dia de vencimento, com vigência de início e fim opcional) e **isolada** (vale só na data informada).
- Despesa fixa com vencimento no dia 29–31 cai no último dia dos meses mais curtos.
- Desativar em vez de apagar: despesa inativa fica no histórico e sai do balanço.
- Balanço do período em `/gerenciamento/totais`: receita (concluídos) − despesas = resultado, com margem, quebra por categoria e CSV.
- Fechamento do mês = balanço com o período “mês”; o painel mostra o resultado do mês corrente.

Fora desta fase: pagamento, formas de pagamento, desconto, NF-e, TEF, gaveta, DRE, estoque, metas, comissões detalhadas, baixa de contas a pagar (a despesa é previsão/registro, não há status de pago).

---

## 5. Entrega faseada — construção

### Fase 0 — Fundação (1 sprint curto)

**Objetivo:** projeto rodando, deploy de desenvolvimento e identidade mínima.

- Stack definida (ver seção 7).
- Repositório, lint, ambiente local.
- Deploy contínuo em ambiente de **preview/staging** (Vercel ou Cloudflare Pages).
- Layout base: cores, tipografia, navegação operação vs. gestão.
- Manifest PWA (ícone, nome, tema). Service worker só para cache de shell, sem offline complexo.
- Modelo de dados inicial (tabelas/policies) **sem** tabela de pagamentos.

**Critério de pronto:** abrir a URL de staging e ver tela de login/cadastro.

### Fase 1 — Login e cadastro (MVP de acesso)

**Objetivo:** usuários entram no sistema com segurança; salão já existe (seed).

- ~~Cadastro do salão~~ — **removido**; salão pré-configurado via migration/seed.
- Seed de banco: registro do salão e usuário dono inicial (e-mail + hash de senha).
- Login com JWT (`POST /api/auth/login`), refresh (`POST /api/auth/refresh`), logout (`POST /api/auth/logout`).
- Credenciais e refresh tokens **persistidos no banco**.
- Recuperação de senha por código no celular (WhatsApp, com fallback SMS).
- Sessão e guards de rota no front.
- Cadastro de profissionais, clientes e usuários (CRUD básico, pelo dono).

**Critério de pronto:** dono (seed) faz login, cadastra 2 profissionais, 3 clientes e um usuário de recepção que consegue logar com permissão limitada; logout invalida o refresh token no banco.

### Fase 2 — Agenda operacional (MVP do salão)

**Objetivo:** a recepção vive no sistema no horário de funcionamento.

- Agenda do dia por profissional.
- Criar / editar / cancelar / remarcar (serviço escolhido do catálogo).
- Valor do serviço visível, não editável.
- Status do atendimento (sem passo de pagamento).
- Regras de conflito e horário de trabalho.
- Visão mobile (lista) e desktop (colunas por profissional).
- PWA instalável no Android (já testável em staging).

**Critério de pronto:** simular um dia real (manhã/tarde, 2 profissionais, conflito recusado, cancelamento, conclusão) no celular e no computador, **sem** qualquer tela de cobrar.

### Fase 3 — Backoffice (serviços + totais)

**Objetivo:** o dono gerencia o catálogo e vê o volume financeiro **implícito** nos serviços concluídos.

- CRUD de serviços apenas em `/gerenciamento/servicos` (ou equivalente).
- Dashboard do dia (quantidade + soma dos valores dos concluídos).
- Listagem e totais por período, por serviço e por profissional.
- Layout desktop; permissões: profissional não vê totais globais; recepção não edita serviços; dono vê tudo.
- CSV opcional.

**Critério de pronto:** cadastrar/alterar serviços no backoffice; agenda só lista serviços ativos; fechar um dia com 5 concluídos e o total igual à soma dos preços dos serviços (snapshot).

### Fase 4 — Refino de uso real (pós-MVP de produto)

Priorizar com o salão piloto, **depois** da publicação inicial (seção 6), nesta ordem sugerida:

1. Confirmação por WhatsApp (link ou mensagem manual + status `confirmado`).
2. Relatório de comissão simples (% sobre o valor do serviço).
3. Portal do cliente para agendar (com regras de horário).
4. Offline parcial da agenda do dia.

**Não entra:** pagamento no app, salvo decisão explícita futura (novo refinamento).

---

## 6. Entrega faseada — publicação (pós-construção)

Estas fases começam quando as Fases 0–3 estão aceitas em staging. Publicar **não** é um único “botão”: é ambiente, domínio, PWA e, só se necessário, lojas.

### Fase P0 — Preparar produção

**Objetivo:** um ambiente estável, separado do desenvolvimento.

- Projeto/host de **produção** (Vercel/Cloudflare) apontando para a branch `main`.
- Projeto **Supabase de produção** (não reutilizar o de desenvolvimento).
- Variáveis de ambiente de produção (URL, chaves anon, nunca expor service role no front).
- Migrations aplicadas; RLS conferida.
- Backup automático do banco (rotina nativa do Supabase ou dump agendado).
- Lista de smoke tests (cadastro, login, agenda, backoffice de serviços).

**Critério de pronto:** checklist de go-live preenchido; ninguém aponta o app do salão para o banco de staging.

### Fase P1 — Publicar a web app (URL pública)

**Objetivo:** o salão usa o sistema pelo navegador em HTTPS.

- Deploy de produção a partir de `main`.
- URL temporária (`*.vercel.app` / `*.pages.dev`) para o piloto interno.
- HTTPS obrigatório (já incluso no host).
- Confirmar envio do código de recuperação de senha (WhatsApp/SMS) com as credenciais do ambiente de produção.
- Criar a conta real do salão piloto (não dados de teste).

**Critério de pronto:** dono e recepção entram pela URL de produção e operam um dia real (ou ensaio assistido).

### Fase P2 — Domínio próprio

**Objetivo:** endereço profissional e estável.

- Registrar domínio (Cloudflare/Namecheap ou similar).
- DNS (A/CNAME) no host do front; SSL automático.
- URL canônica (ex.: `https://app.estudiodaester.com.br`).
- Redirecionar www ↔ apex se houver site institucional separado.
- Atualizar `site` / redirect URLs no Supabase Auth para o domínio novo.

**Critério de pronto:** login, cadastro e recuperação de senha funcionam **só** no domínio definitivo (sem mixed content, sem redirect quebrado).

### Fase P3 — PWA em produção

**Objetivo:** ícone na tela inicial dos celulares/tablets da recepção.

- Manifest com nome, ícones (192/512), `start_url` no domínio de produção, `display: standalone`.
- Service worker limitado (shell); não cachear API/auth de forma agressiva.
- Teste: instalar no Android (Chrome) a partir da URL de produção.
- Instrução curta para a equipe (3 passos: abrir o site → Instalar app → abrir pelo ícone).
- iOS: Safari → Adicionar à Tela de Início (limitações de PWA documentadas para o time).

**Critério de pronto:** pelo menos um dispositivo do salão abre a agenda em modo app, autenticado, no domínio certo.

### Fase P4 — Homologação com o salão piloto

**Objetivo:** validar operação real antes de “oficializar”.

- Treino de 30–60 min (agenda + backoffice de serviços).
- Acompanhar 3–5 dias de uso.
- Corrigir bugs bloqueantes em hotfix na `main`.
- Congelar catálogo de serviços combinado com o dono (preços oficiais).

**Critério de pronto:** piloto consegue o dia sem planilha paralela **ou** lista explícita do que ainda fica fora do app (ex.: cobrança no caixa físico).

### Fase P5 — Lojas (opcional)

**Objetivo:** só se o piloto pedir “está na Play Store” ou distribuição controlada. **Não** é obrigatório para o MVP.

**Google Play (barato)**

- Taxa de desenvolvedor (~US$ 25, única).
- Empacotar o PWA com TWA (Trusted Web Activity) ou Capacitor apontando para a URL de produção.
- Ficha da loja: nome, ícone, screenshots da agenda (não vender “pagamento no app”).
- Política de privacidade (página simples no mesmo domínio).
- Teste interno → produção.

**Apple App Store (só se houver demanda iPhone forte)**

- Apple Developer (~US$ 99/ano).
- Build iOS (Mac, Codemagic ou EAS).
- Expectativa: revisão mais rígida; PWA “embrulhado” pode ser recusado se for só um WebView.

**Critério de pronto:** se executada, o app da loja abre a **mesma** web app de produção; backoffice continua melhor no navegador desktop.

### Fase P6 — Operação contínua (pós-go-live)

**Objetivo:** não abandonar o sistema depois de publicar.

- Pipeline: `preview` por PR → `staging` → `produção`.
- Monitoramento básico: erros de front (opcional Sentry free), logs do host, uso do free tier Supabase.
- Rotina de backup e teste de restore (trimestral).
- Canal de suporte interno (WhatsApp do piloto) → issues no repositório.
- Versionamento: tag (`v1.0.0`) a cada release de produção.

**Critério de pronto:** documentado quem publica, como reverte um deploy e onde está o banco de produção.

**Ordem sugerida de publicação:** P0 → P1 → P2 → P3 → P4 → (P5 se necessário) → P6 permanente.

---

## 7. Fluxos principais

### 7.1 Primeiro acesso

> **Não há criação de salão pelo usuário.** O salão e o dono inicial são provisionados via seed de banco na primeira implantação.

1. Dono acessa `/login`.
2. Informa e-mail + senha (credenciais do seed).
3. Backend valida, gera `access_token` JWT e `refresh_token`; persiste refresh token no banco.
4. Front armazena tokens; redireciona para a agenda.
5. Onboarding: ir ao backoffice e cadastrar pelo menos 1 serviço (pular permitido, mas a agenda fica vazia de opções).

### 7.2 Dia de operação

1. Recepção faz login → agenda de hoje.
2. Escolhe horário livre → cliente + serviço (com valor exibido) + profissional.
3. Sistema valida conflito e duração.
4. Ao chegar: status `confirmado` / `em_atendimento`.
5. Ao terminar: `concluido` — **sem** modal de pagamento.
6. Agenda atualiza o slot como ocupado/concluído.

### 7.3 Backoffice de serviços e totais

1. Dono abre `/gerenciamento`.
2. Cadastra ou ajusta serviços (preço e duração).
3. Filtra período na visão de totais.
4. Vê soma dos valores dos atendimentos **concluídos** (preço do serviço de cada um).
5. Não há correção de “pagamento”; correção de valor = alterar o **serviço** no catálogo (afetando novos agendamentos) ou remarcar/trocar o serviço do atendimento, se ainda permitido pelas regras.

---

## 8. Tecnologia e hospedagem (baixo custo)

| Camada | Escolha | Motivo |
|---|---|---|
| Frontend | **Next.js** (App Router) ou **Vite + React** | Um código, PWA, deploy grátis |
| Estilo | Tailwind CSS + componentes próprios | Rápido, barato de manter |
| **Backend API** | **Node.js + Express** (TypeScript) | REST, JWT, middleware de auth |
| **Auth** | **JWT próprio** (jsonwebtoken + bcrypt) | Sem dependência de provedor externo; credenciais no banco |
| Banco | **PostgreSQL** (Supabase ou instância própria) | Free tier, dados relacionais |
| Hospedagem front | **Vercel** ou **Cloudflare Pages** | HTTPS e CI grátis |
| Hospedagem API | **Railway** ou **Render** (free tier) | Deploy simples de Node |
| PWA | `vite-plugin-pwa` ou equivalente Next | Instalação no celular |
| Relatórios | Consultas SQL + CSV no browser | Sem BI pago |

**Autenticação JWT — fluxo resumido:**
```
POST /api/auth/login    → { access_token (15min), refresh_token (7d) }
POST /api/auth/refresh  → { access_token (novo), refresh_token (rotacionado) }
POST /api/auth/logout   → revoga refresh_token no banco
GET  /api/*             → requer Authorization: Bearer <access_token>
```

**Não usar no início:** app nativo separado, VPS 24h, Kubernetes, gateway de pagamento, Stripe/Mercado Pago.

Custos esperados no piloto: **R$ 0** (subdomínio do host) até **~R$ 50–80/ano** (domínio). Google Play só na Fase P5, se necessário.

---

## 9. Modelo de dados (mínimo)

Entidades:

- `salons` — salão fixo (único registro; pré-cadastrado via seed)
- `users` — usuário com credenciais: `id`, `salon_id`, `name`, `email`, `password_hash` (bcrypt), `role` (dono/recepcao/profissional), `active`, `created_at`
- `refresh_tokens` — `id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`  *(persiste sessões JWT)*
- `password_reset_tokens` — `id`, `user_id`, `token_hash`, `expires_at`, `used_at`
- `professionals` — vinculado a um `user_id` quando couber
- `services` — nome, duração, preço, ativo; gerido só no backoffice
- `professional_services` — N:N
- `clients`
- `appointments` — salon, client, professional, service, início, fim, status, **`service_price_snapshot`**, **`service_duration_snapshot`**
- `expenses` — salon, descrição, categoria, `kind` (`fixa`/`isolada`), valor, `due_date` (isolada), `day_of_month` + `starts_on`/`ends_on` (fixa), ativo

**Não existe** tabela `payments`.

Regras:

- Todo registro leva `salon_id` (mesmo sendo único, mantém a coluna para integridade referencial).
- Autenticação: backend verifica `users.password_hash` com bcrypt; emite JWT com `{ sub: user_id, role, salon_id }`.
- Refresh token é armazenado como `SHA-256(token)` na coluna `token_hash` (não o valor bruto).
- Logout/revogação: `refresh_tokens.revoked_at = NOW()`.
- `appointments.ends_at` = `starts_at` + duração (snapshot).
- Índice em `(professional_id, starts_at)` para detectar overlap.
- Totais = `SUM(service_price_snapshot)` onde `status = concluido`.
- Despesa fixa não gera uma linha por mês no banco: a recorrência é expandida no período consultado (dia limitado ao último dia do mês).
- Balanço do período = totais dos concluídos − despesas ativas materializadas no período.

---

## 10. Telas (mapa)

| Rota | Módulo | Papéis |
|---|---|---|
| ~~`/cadastro`~~ | ~~Cadastro do negócio~~ | **Removido** (salão fixo) |
| `/login` | Login | Público |
| `/recuperar-senha` | Login | Público |
| `/agenda` | Agenda | Todos autenticados |
| `/clientes` | Cadastro operacional | Dono, recepção |
| `/profissionais` | Cadastro operacional | Dono |
| `/usuarios` | Cadastro / gestão | Dono |
| `/gerenciamento` | Hub backoffice | Dono (e visão limitada se houver) |
| `/gerenciamento/servicos` | CRUD de serviços | **Somente dono** |
| `/gerenciamento/despesas` | Despesas fixas e isoladas | **Somente dono** |
| `/gerenciamento/totais` | Totais por serviço/período + balanço | Dono |

**Não existem** rotas de caixa, checkout ou formas de pagamento.

Mobile: menu inferior (Agenda, Clientes, Mais).  
Desktop: sidebar (Agenda | Cadastros | Gerenciamento). Gerenciamento de serviços só no desktop (ou layout degradado com aviso).

---

## 11. Regras de negócio críticas

1. Agendamento só em horário de trabalho do profissional.
2. Sem sobreposição no mesmo profissional (inclusive ao remarcar).
3. Só é possível agendar **serviços ativos** do catálogo do backoffice.
4. O valor do atendimento é o preço do serviço; **não** pode ser editado na agenda.
5. Ao criar o agendamento, gravar snapshot de preço e duração. Mudança posterior no catálogo **não** reescreve agendamentos já criados (evita distorcer o histórico).
6. Cancelado e não compareceu **não** entram na soma de totais.
7. Concluído entra na soma com o `service_price_snapshot`.
8. Profissional não lista agenda nem totais de colegas (salvo se o dono marcar “agenda compartilhada” — default: não).
9. Exclusão de cliente/profissional/serviço: preferir desativar (`ativo = false`) para não quebrar histórico.
10. Recepção e profissional não criam nem editam serviços.

---

## 12. Fora de escopo (explícito)

- Pagamento, cobrança, caixa, Pix, cartão, desconto no atendimento
- Gateway (Stripe, Mercado Pago, etc.)
- App iOS/Android nas lojas **na construção** (só Fase P5, opcional)
- Agendamento pelo cliente final
- WhatsApp/SMS automático
- Nota fiscal e TEF
- Estoque e produtos
- Folha / comissão avançada
- Multi-unidade e franquia
- Offline completo
- Tema white-label por salão
- Cadastro de serviços na tela da agenda / recepção

---

## 13. Critérios de aceite do MVP de produto (Fases 0–3)

- [ ] ~~Cadastro de salão~~ Seed de salão e dono executado; login funciona em staging (HTTPS).
- [ ] Dono cadastra profissionais e clientes na operação.
- [ ] Dono cadastra e edita serviços **apenas** no backoffice.
- [ ] Recepção não acessa CRUD de serviços.
- [ ] Recepção cria e altera agenda sem conflito inválido; vê o valor do serviço (somente leitura).
- [ ] Status do atendimento reflete o fluxo real, **sem** passo de pagamento.
- [ ] Totais do dono = soma dos preços snapshot dos concluídos no período.
- [ ] Profissional não acessa totais globais nem o CRUD de serviços.
- [ ] Agenda usável em celular; gerenciamento usável em desktop.
- [ ] PWA instalável no Android (staging).
- [ ] Dados isolados por salão (sem vazamento entre contas).
- [ ] Login retorna JWT válido; refresh token persiste no banco; logout revoga o token.
- [ ] Rotas da API retornam 401 sem token e 403 para papel insuficiente.
- [ ] Nenhuma tela ou API de pagamento no app.

---

## 14. Critérios de aceite da publicação (Fases P0–P4)

- [ ] Ambientes de staging e produção separados (front + banco).
- [ ] App acessível em HTTPS na URL de produção.
- [ ] Domínio próprio com Auth (redirect/e-mail) apontando para produção (P2).
- [ ] PWA instalada em pelo menos um dispositivo do salão (P3).
- [ ] Piloto operou dias reais ou ensaio assistido sem cobrança no sistema (P4).
- [ ] Backup de produção configurado e responsável pelo deploy definido (P6).

---

## 15. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| JWT roubado (XSS) | `access_token` em memória (não em `localStorage`); `httpOnly cookie` para refresh token |
| Refresh token comprometido | Rotação a cada uso + revogação imediata no logout; expiração de 7 dias |
| Seed de senha fraca | Validação de complexidade no backend; forçar troca na primeira sessão (futuro) |
| Internet ruim no salão | PWA com shell cache; agenda do dia em memória; não prometer operação offline total |
| iPhone sem notificação boa | Status manual + WhatsApp fora do app no início |
| Dono usa só o celular no backoffice | Lista de serviços usável em tablet; totais compactos; CRUD rico no desktop |
| Conflito de horário mal calculado | Testes unitários de overlap + bloqueio na UI e no banco |
| Preço do serviço muda no meio do mês | Snapshot no agendamento; totais usam snapshot |
| Time espera “caixa no app” | Deixar explícito: valores são do catálogo; dinheiro é fora do sistema |
| Publicar no banco de teste | Fase P0 obrigatória: projeto Supabase de produção |
| Free tier do Supabase | Poucas imagens; sem upload pesado no MVP |

---

## 16. Ordem de construção sugerida (checklist técnico)

1. **Backend auth**: tabelas `salons`, `users`, `refresh_tokens`, `password_reset_tokens` + seed do salão fixo e dono inicial.
   - `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`
   - Middleware JWT (`verifyToken`) e middleware de papel (`requireRole`)
   - **Testes de persistência do login** (ver seção 18)
2. CRUD profissionais, clientes, usuários (rotas protegidas por JWT)
3. CRUD de **serviços no backoffice** + vínculo profissional–serviço
4. Agenda (criar/listar/conflito) com preço somente leitura
5. Status do atendimento (sem pagamento)
6. Totais por snapshot de serviço + permissões por papel
7. PWA + polish mobile da agenda
8. CSV do relatório de concluídos

Cada item acima deve fechar com tela utilizável, não só API.

---

## 18. Testes (backend)

### 18.1 Testes de persistência do login

Cobrem o fluxo completo de auth com banco real (banco de teste / in-memory).

| # | Cenário | Resultado esperado |
|---|---|---|
| 1 | `POST /api/auth/login` com credenciais válidas | HTTP 200, `access_token` JWT, `refresh_token` gravado no banco |
| 2 | `POST /api/auth/login` com senha errada | HTTP 401, sem token gerado |
| 3 | `POST /api/auth/login` com e-mail inexistente | HTTP 401 |
| 4 | `POST /api/auth/refresh` com refresh token válido | HTTP 200, novo `access_token`, token antigo revogado (rotação) |
| 5 | `POST /api/auth/refresh` com token revogado | HTTP 401 |
| 6 | `POST /api/auth/refresh` com token expirado | HTTP 401 |
| 7 | `POST /api/auth/logout` | HTTP 204, `revoked_at` preenchido no banco |
| 8 | Rota protegida sem token | HTTP 401 |
| 9 | Rota protegida com papel insuficiente | HTTP 403 |
| 10 | `access_token` expirado (forçar via exp curto) | HTTP 401 na rota protegida |

### 18.2 Testes unitários

| Módulo | O que testar |
|---|---|
| `hashPassword` / `comparePassword` | bcrypt: hash gerado é diferente do texto; compare retorna true/false corretamente |
| `generateAccessToken` | Payload JWT contém `sub`, `role`, `salon_id`; expiração correta |
| `verifyAccessToken` | Token válido retorna payload; token alterado lança erro; token expirado lança `TokenExpiredError` |
| `generateRefreshToken` | Retorna string; comprimento mínimo; hash SHA-256 diferente do valor original |
| Middleware `verifyToken` | Request sem header → 401; token válido → `req.user` preenchido |
| Middleware `requireRole` | Papel correto → next(); papel errado → 403 |
| Overlap de agendamentos | Dois slots sem sobreposição → false; slots sobrepostos → true; borda exata → false |
| Snapshot de serviço | Ao criar agendamento, `service_price_snapshot` = preço atual do serviço |
| Totais | `SUM(service_price_snapshot)` só conta `status = concluido` |

---

## 17. Próximo passo

Validar este refinamento com o salão piloto (status, se o profissional vê a agenda inteira, lista oficial de serviços e preços). Em seguida:

1. Iniciar **Fase 0** no repositório (scaffolding backend Node/Express + front, tema, pipeline de staging).
2. Executar seed do salão fixo e testes de persistência do login (seção 18).
3. Só após aceite das Fases 1–3, executar **P0–P4** de publicação.
4. Tratar **P5 (lojas)** como opcional, depois do piloto estável.
