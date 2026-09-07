# Refinamento — App Web de Agendamento (Salão)

Documento de refinamento para construção **faseada** de um aplicativo web de agenda para salão, com autenticação, cadastro, agenda e módulo de gerenciamento (backoffice). Inclui as fases de **publicação** após a construção.

**Produto:** aplicação web única, responsiva, com superfície de operação (agenda no celular/tablet) e superfície de gestão (desktop).  
**Formato de entrega:** PWA (instalável) + uso no navegador. Lojas de aplicativo só nas fases de publicação, se fizerem sentido.

**Receita no app:** não há pagamento, caixa, maquininha nem formas de pagamento. O valor de cada atendimento é o **preço do serviço** cadastrado no backoffice. Relatórios somam esses valores (atendimentos concluídos).

---

## 1. Objetivo

Permitir que o salão:

1. Cadastre a conta do negócio e usuários.
2. Faça login com papéis distintos.
3. Gerencie a agenda de atendimentos.
4. No backoffice: cadastre/edite **serviços** (nome, duração, preço) e acompanhe operação e totais **conforme os serviços realizados**.

O MVP deve ser usável no dia a dia da recepção, sem depender de app nativo e **sem fluxo de cobrança**.

---

## 2. Premissas

- Um salão (tenant) por conta no MVP. Multi-salão fica fora da construção inicial.
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

- Nome do salão, telefone, endereço (opcional na Fase 1).
- E-mail e senha do dono (primeiro usuário = papel Dono).
- Confirmação de e-mail (se o provedor de auth permitir no free tier).

**Cadastros na operação (após login, fora do backoffice de serviços)**

- **Profissionais:** nome, serviços que realiza (escolha entre serviços já cadastrados), horário de trabalho (início/fim).
- **Clientes:** nome, telefone, observações (alergia, preferência).
- **Usuários do sistema:** convite/criação por e-mail + papel (dono, recepção, profissional), vinculado a um profissional quando couber.

**Cadastro de serviços:** ver 4.4 (somente backoffice).

Fora desta fase: importação em massa, múltiplas unidades, logo/branding avançado.

### 4.2 Login

- E-mail + senha.
- Recuperação de senha.
- Sessão persistente (PWA / navegador).
- Logout.
- Bloqueio de rotas por autenticação e por papel.
- Mensagens claras de erro (credencial inválida, e-mail não confirmado).

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

Fora desta fase: pagamento, formas de pagamento, desconto, NF-e, TEF, gaveta, DRE, contas a pagar, estoque, metas, comissões detalhadas.

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

### Fase 1 — Conta, login e cadastro (MVP de acesso)

**Objetivo:** o salão existe no sistema e alguém entra com segurança.

- Cadastro do salão + dono.
- Login, logout, recuperação de senha.
- Sessão e guards de rota.
- Cadastro de profissionais, clientes e usuários (CRUD básico).
- **Ainda sem** CRUD completo de serviços na operação; onboarding pode criar 1 serviço via backoffice mínimo ou seed.

**Critério de pronto:** dono cria salão, cadastra 2 profissionais, 3 clientes e um usuário de recepção que consegue logar com permissão limitada.

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
- Confirmar e-mails (recuperação de senha, confirmação) com remetente do ambiente de produção.
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

1. Dono acessa `/cadastro`.
2. Informa salão + e-mail + senha.
3. Sistema cria tenant, usuário dono e sessão.
4. Onboarding: ir ao backoffice e cadastrar pelo menos 1 serviço (pular permitido, mas a agenda fica vazia de opções).
5. Redireciona para a agenda.

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
| Auth + banco | **Supabase** (Postgres, Auth, Storage) | Free tier, RLS por tenant |
| Hospedagem front | **Vercel** ou **Cloudflare Pages** | HTTPS e CI grátis |
| PWA | `vite-plugin-pwa` ou equivalente Next | Instalação no celular |
| Relatórios | Consultas SQL + CSV no browser | Sem BI pago |

**Não usar no início:** app nativo separado, VPS 24h, Kubernetes, gateway de pagamento, Stripe/Mercado Pago.

Custos esperados no piloto: **R$ 0** (subdomínio do host) até **~R$ 50–80/ano** (domínio). Google Play só na Fase P5, se necessário.

---

## 9. Modelo de dados (mínimo)

Entidades:

- `salons` — tenant
- `profiles` — usuário (auth id, papel, salon_id, professional_id opcional)
- `professionals`
- `services` — nome, duração, preço, ativo; gerido só no backoffice
- `professional_services` — N:N
- `clients`
- `appointments` — salon, client, professional, service, início, fim, status, **`service_price_snapshot`**, **`service_duration_snapshot`**

**Não existe** tabela `payments`.

Regras:

- Todo registro leva `salon_id`.
- RLS: usuário só lê/escreve o próprio salão.
- `appointments.ends_at` = `starts_at` + duração (snapshot).
- Índice em `(professional_id, starts_at)` para detectar overlap.
- Totais = `SUM(service_price_snapshot)` onde `status = concluido`.

---

## 10. Telas (mapa)

| Rota | Módulo | Papéis |
|---|---|---|
| `/cadastro` | Cadastro do negócio | Público |
| `/login` | Login | Público |
| `/recuperar-senha` | Login | Público |
| `/agenda` | Agenda | Todos autenticados |
| `/clientes` | Cadastro operacional | Dono, recepção |
| `/profissionais` | Cadastro operacional | Dono |
| `/usuarios` | Cadastro / gestão | Dono |
| `/gerenciamento` | Hub backoffice | Dono (e visão limitada se houver) |
| `/gerenciamento/servicos` | CRUD de serviços | **Somente dono** |
| `/gerenciamento/totais` | Totais por serviço/período | Dono |

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

- [ ] Cadastro de salão e login funcionam em staging (HTTPS).
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

1. Auth + tabela `salons` / `profiles` + RLS  
2. CRUD profissionais, clientes, usuários  
3. CRUD de **serviços no backoffice** + vínculo profissional–serviço  
4. Agenda (criar/listar/conflito) com preço somente leitura  
5. Status do atendimento (sem pagamento)  
6. Totais por snapshot de serviço + permissões por papel  
7. PWA + polish mobile da agenda  
8. CSV do relatório de concluídos  

Cada item acima deve fechar com tela utilizável, não só API.

---

## 17. Próximo passo

Validar este refinamento com o salão piloto (status, se o profissional vê a agenda inteira, lista oficial de serviços e preços). Em seguida:

1. Iniciar **Fase 0** no repositório (scaffolding, tema, pipeline de staging).  
2. Só após aceite das Fases 1–3, executar **P0–P4** de publicação.  
3. Tratar **P5 (lojas)** como opcional, depois do piloto estável.
