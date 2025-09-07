# BarberGo Monorepo

Este é um monorepo que contém duas aplicações Next.js para o sistema BarberGo:

- **Hall App** (`apps/hall`): Aplicação principal com múltiplas barbearias
- **Exclusive App** (`apps/exclusive`): Aplicação para barbearias exclusivas

## Estrutura do Projeto

```
├── apps/
│   ├── hall/           # App principal (barbergo.vercel.app)
│   └── exclusive/      # App para barbearias exclusivas (slug-barbearia.vercel.app)
├── packages/
│   ├── shared/         # Utilitários e tipos compartilhados
│   ├── ui/            # Componentes UI compartilhados
│   └── database/      # Schema e configuração do banco
└── turbo.json         # Configuração do Turborepo
```

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

#### Para Hall App (`apps/hall/.env.local`):
```env
DATABASE_URL="postgresql://..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
NEXT_AUTH_SECRET="..."
```

#### Para Exclusive App (`apps/exclusive/.env.local`):
```env
DATABASE_URL="postgresql://..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
NEXT_AUTH_SECRET="..."
BARBERSHOP_SLUG="nome-da-barbearia"
BRAND_NAME="Nome da Barbearia"
LOGO_URL="/logo.png"
```

### 3. Configurar banco de dados

```bash
# Gerar cliente Prisma
cd packages/database
npx prisma generate

# Executar migrações
npx prisma migrate dev

# Popular banco (opcional)
npm run db:seed
```

## Desenvolvimento

### Executar todas as aplicações:
```bash
npm run dev
```

### Executar aplicação específica:
```bash
# Hall app (porta 3000)
cd apps/hall
npm run dev

# Exclusive app (porta 3001)
cd apps/exclusive
npm run dev
```

## Deploy na Vercel

### Hall App (barbergo.vercel.app)
1. Conecte o repositório na Vercel
2. Configure o Root Directory como `apps/hall`
3. Configure as variáveis de ambiente
4. Deploy

### Exclusive App (slug-barbearia.vercel.app)
1. Crie um novo projeto na Vercel para cada barbearia
2. Configure o Root Directory como `apps/exclusive`
3. Configure as variáveis de ambiente específicas da barbearia:
   - `BARBERSHOP_SLUG`: slug da barbearia
   - `BRAND_NAME`: nome da barbearia
   - `DATABASE_URL`: banco específico da barbearia
4. Deploy

## Comandos Úteis

```bash
# Build todas as aplicações
npm run build

# Lint todas as aplicações
npm run lint

# Type check
npm run type-check

# Limpar builds
npm run clean
```

## Adicionando Nova Barbearia Exclusiva

1. Crie um novo banco de dados no Neon
2. Execute as migrações no novo banco
3. Adicione a barbearia no banco com `isExclusive: true`
4. Crie novo projeto na Vercel apontando para `apps/exclusive`
5. Configure as variáveis de ambiente específicas
6. Deploy