# **BarberGo Monorepo**

Este é um monorepo (Turborepo) que contém duas aplicações Next.js para o sistema BarberGo:

- **Hall App** (`apps/hall`): Marketplace agregador que lista múltiplas barbearias.
- **Exclusive App** (`apps/exclusive`): Aplicação White-Label destinada a uma única barbearia específica.

## **Estrutura do Projeto**
```
   text
   ├── apps/
   │   ├── hall/           # App Marketplace (barbergo.vercel.app)
   │   └── exclusive/      # App White-Label (slug-barbearia.vercel.app)
   ├── packages/
   │   ├── shared/         # Utilitários, constantes e tipos compartilhados
   │   ├── ui/             # Biblioteca de componentes (Shadcn/UI)
   │   └── database/       # Schema Prisma e conexão com banco
   └── turbo.json          # Configuração do pipeline de build
```

### **Configuração Inicial**

1. Instalar dependências
   ```bash
   npm install
   ```

2. Configurar Variáveis de AmbienteEste projeto precisa de variáveis de ambiente em dois contextos diferentes: para a conexão do Prisma (migrações) e para a execução dos aplicativos.

   **A. Para o Banco de Dados (Prisma):**
   Crie um arquivo `.env` dentro de `packages/database/.env`:

   ```env
   DATABASE_URL="postgresql://..."

   ```

   **B. Para os Aplicativos (Hall e Exclusive):**
   Crie um arquivo `.env` na **raiz do projeto** `.env` (o TurboRepo carregará para os apps):

   ```env
   # Banco de Dados (Mesma URL)
   DATABASE_URL="postgresql://..."

   # Autenticação Google
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."

   # Segurança
   NEXTAUTH_SECRET="..."

   # Apenas para o app Exclusive (Simulação Local)
   BARBERSHOP_SLUG="nome-da-barbearia"
   BRAND_NAME="Nome da Barbearia"

3. Configurar Banco de Dados: Utilizamos scripts definidos no `package.json` para facilitar o uso do Prisma dentro do monorepo:

   ```bash
   # 1. Gerar o cliente Prisma (Tipagem)
   npm run db:generate -w @barbergo/database

   # 2. Enviar schema para o banco (Migração)
   npm run db:migrate -w @barbergo/database

   # 3. Popular o banco com dados iniciais (Seed)
   npm run db:seed -w @barbergo/database

   ```

### **Desenvolvimento**

Executar todo o ecossistema:
   ```bash
      npm run dev
   ```

* **Hall:** [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)
* **Exclusive:** [http://localhost:3001](https://www.google.com/search?q=http://localhost:3001)

Arquitetura de Negócio (Deploy): O sistema utiliza um **Banco de Dados Único** compartilhado entre todas as aplicações. A diferenciação é feita via código e configuração.

Hall App (Marketplace)
1. Conecte o repositório na Vercel.
2. Configure o Root Directory como `apps/hall`.
3. Adicione as variáveis (`DATABASE_URL`, `GOOGLE_...`, `NEXTAUTH_SECRET`).
4. Deploy.

Exclusive App (Cliente VIP): Para colocar no ar uma barbearia exclusiva (ex: "Barbearia do Zé"), você **não** precisa criar um novo banco de dados.

1. **No Banco de Dados:** Adicione a barbearia na tabela `Barbershop` com `isExclusive: true` e defina um `slug` único (ex: `barbearia-do-ze`).
2. **Na Vercel:** Crie um novo projeto apontando para o mesmo repositório.
3. Configure o Root Directory como `apps/exclusive`.
4. Nas variáveis de ambiente do projeto na Vercel, defina:
* `BARBERSHOP_SLUG`: `barbearia-do-ze` (Deve ser idêntico ao do banco)
* `BRAND_NAME`: "Barbearia do Zé"
* `DATABASE_URL`: (Mesma URL do banco principal)


5. Deploy.

O aplicativo irá automaticamente buscar apenas os dados referentes àquele slug.

### **Comandos Úteis**
   ```bash
   # Lint (Verificar código)
   npm run lint

   # Type check (Verificar Tipos TypeScript)
   npm run type-check

   # Limpar caches (se algo der errado)
   npm run clean

   ```