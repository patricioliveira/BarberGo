# 1. `README.md` (O Coração do Projeto)

```markdown
# 💈 BarberGo: Enterprise-Grade Barber Management Ecosystem

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Turborepo](https://img.shields.io/badge/Turborepo-v2-EF4444?style=for-the-badge&logo=turborepo)
![pnpm](https://img.shields.io/badge/pnpm-v10-F69220?style=for-the-badge&logo=pnpm)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=for-the-badge&logo=prisma)

## 📋 Visão Geral

O **BarberGo** é uma plataforma multitenant modular projetada para resolver a fragmentação tecnológica no setor de barbearias. O ecossistema abrange desde o marketplace de descoberta até soluções de marca própria (white-label) e gestão de back-office.

### 🏗️ Arquitetura de Software
O projeto utiliza um **Monorepo** com **Turborepo** para orquestrar o build e o cache, garantindo que o desenvolvimento seja rápido e as dependências sejam compartilhadas de forma eficiente entre os apps.

---

## 📂 Estrutura do Ecossistema

### Applications (`/apps`)
* **`hall` (Marketplace):** Agregador B2C onde clientes finais descobrem barbearias, comparam preços e realizam agendamentos.
* **`exclusive` (White-Label):** Motor de renderização dinâmica que transforma uma barbearia do banco de dados em um site exclusivo via subdomínio/slug.
* **`crm` (Dashboard):** Painel B2B para proprietários. Gestão de agenda, controle de fluxo de caixa, estoque e métricas de desempenho (SaaS).

### Core Packages (`/packages`)
* **`@barbergo/database`**: Camada de persistência centralizada com Prisma ORM. Contém o schema único, migrações e o cliente singleton.
* **`@barbergo/ui`**: Design System proprietário baseado em **Radix UI** e **Shadcn**. Componentes atômicos e moléculas de interface.
* **`@barbergo/shared`**: O "cérebro" compartilhado. Contém lógica de validação (Zod), utilitários de formatação, tipos globais e constantes de negócio.

---

## 🛠️ Stack Tecnológica & Requisitos

* **Runtime:** Node.js >= 20.x
* **Package Manager:** pnpm 10.x (obrigatório)
* **Database:** PostgreSQL 15+
* **Auth:** NextAuth.js (Google Provider)
* **Styling:** Tailwind CSS com arquitetura de temas variáveis.

---

## ⚙️ Guia de Configuração e Instalação

### 1. Inicialização do Ambiente
```bash
# Instalação das dependências com isolamento de workspace
pnpm install

```

### 2. Configuração de Variáveis (Hieraquização .env)

O sistema busca variáveis em múltiplos níveis. Configure conforme abaixo:

**Root (`/.env`):** Variáveis compartilhadas e segredos de App.

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

```

**Database Package (`/packages/database/.env`):** Estritamente para introspecção e migrações Prisma.

### 3. Sincronização de Banco de Dados

```bash
# Gerar o Prisma Client tipado
pnpm db:generate

# Aplicar migrações pendentes
pnpm db:migrate

# Inserir dados de teste (Seed)
pnpm db:seed

```

---

## 🚀 Workflow de Desenvolvimento

Para iniciar o ecossistema completo (Hall, Exclusive e CRM):

```bash
pnpm dev

```

### URLs Locais Padrão:

* **Marketplace:** `http://localhost:3000`
* **Exclusive Engine:** `http://localhost:3001`
* **Admin CRM:** `http://localhost:3002`

---

## 💎 Estratégia White-Label (App Exclusive)

Diferente de aplicações tradicionais, o app `exclusive` funciona como um **Tenant Resolver**:

1. O middleware identifica o `BARBERSHOP_SLUG` via variável de ambiente (Vercel) ou subdomínio.
2. O sistema injeta o tema (cores e fontes) e os dados específicos da barbearia no layout global.
3. **Deploy de Novo Cliente:** Basta criar um novo projeto na Vercel apontando para `apps/exclusive` com a env `BARBERSHOP_SLUG` correspondente ao ID no banco.

---

## 📊 Scripts Disponíveis

| Comando | Descrição |
| --- | --- |
| `pnpm build` | Compila todos os pacotes e apps otimizando o cache do Turbo. |
| `pnpm lint` | Executa análise estática de código em todo o monorepo. |
| `pnpm type-check` | Validação rigorosa de tipos TypeScript em todos os projetos. |
| `pnpm clean` | Remove `node_modules`, `.next` e artefatos de build. |

---

© 2025 BarberGo. Mantido por [Patrício Oliveira](https://www.google.com/search?q=https://github.com/patricioliveira).

```

---

# 2. `CONTRIBUTING.md` (Padrões de Engenharia)

```markdown
# 🛠️ Guia de Engenharia e Contribuição

Para manter a integridade do **BarberGo**, todos os colaboradores (incluindo o autor) devem seguir estes padrões técnicos rigorosos.

## 🌿 Fluxo de Branching

Adotamos uma variação do *GitHub Flow*:
1. **Main**: Protegida. Sempre reflete o estado de produção.
2. **Feature/Fix Branches**: Criadas a partir da `main`.
   - Formato: `tipo/escopo-descricao` (ex: `feat/crm-revenue-chart` ou `fix/shared-date-parser`).

## 💬 Convenção de Commits (Semantics)

Seguimos estritamente o **Conventional Commits**. Commits fora do padrão impedem o merge.

* `feat(...)`: Nova funcionalidade.
* `fix(...)`: Correção de bug.
* `refactor(...)`: Mudança que não altera comportamento nem corrige bug.
* `style(...)`: Mudanças de formatação, lint, etc.
* `chore(...)`: Atualização de builds, pacotes pnpm, etc.

**Exemplo:** `feat(ui): implement skeleton loader for booking card`

---

## 🏗️ Padrões de Desenvolvimento

### 1. Tipagem TypeScript
- **Proibido `any`**: O uso de `any` resultará em erro no `type-check`. Use `unknown` ou generics se necessário.
- **Interfaces vs Types**: Use `interface` para definições de objetos e props de componentes. Use `type` para uniões e utilitários.
- **Shared Types**: Se um tipo é usado em mais de um app, ele **deve** estar em `packages/shared/src/types`.

### 2. UI & Componentização (`@barbergo/ui`)
- **Single Source of Truth**: Não crie componentes de UI (botões, inputs, cards) dentro dos apps. Crie-os no pacote `ui`.
- **Composição**: Utilize o padrão de composição do Radix UI.
- **Tailwind**: Use o utilitário `cn()` de `@barbergo/shared` para gerenciar variantes de classes.

```tsx
// Exemplo Correto
import { cn } from "@barbergo/shared";

export const Card = ({ className, children }: Props) => (
  <div className={cn("rounded-xl border bg-card text-card-foreground shadow", className)}>
    {children}
  </div>
);

```

### 3. Gerenciamento de Dependências (pnpm 10)

* **Isolamento**: Nunca instale uma dependência na raiz se ela for usada apenas em um app.
* **Instalação**: `pnpm add <package> --filter <workspace-name>`.
* **Peer Dependencies**: Atenção redobrada às peer deps de bibliotecas de UI para evitar duplicação do React no bundle.

---

## 🚦 Pipeline de Qualidade (DoD - Definition of Done)

Antes de considerar uma tarefa concluída, ela deve:

1. Passar no `pnpm lint`.
2. Não gerar avisos no `pnpm type-check`.
3. Ter as variáveis de ambiente necessárias documentadas no `.env.example`.
4. Em caso de mudanças no banco, incluir a migração do Prisma gerada.

---

## 🐳 Docker (Opcional para Local)

Caso prefira rodar o banco via Docker:

```bash
docker-compose up -d

```

---

**Dúvidas Técnicas?**
Consulte a documentação do [Turborepo](https://turbo.build/repo/docs) ou abra uma Issue interna.
