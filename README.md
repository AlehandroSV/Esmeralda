# Esmeralda CLI

> CLI for [Jade ORM](https://github.com/AlehandroSV/Jade)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![Português](https://img.shields.io/badge/Português-readme-blue)](#pt-br)
[![English](https://img.shields.io/badge/English-readme-green)](#en)

---

## EN

### About

Esmeralda is the official CLI for Jade ORM. It manages projects, migrations, schemas, and seeds in a simple and intuitive way.

### Installation

```bash
npm install -g @alehandrosv/esmeralda-cli
```

### Commands

#### init

Creates the basic structure of a Jade project.

```bash
esmeralda init -n my-app
```

Generates:
```
my-app/
├── jade.config.lua
├── schema/
│   └── init.lua
├── migrations/
├── seeds/
└── lib/
    └── app.lua
```

#### generate

Generates a migration from schema changes.

```bash
esmeralda generate -n create_users
esmeralda generate --preview  # Preview SQL only
```

#### migrate

Runs all pending migrations.

```bash
esmeralda migrate
esmeralda migrate --preview  # Preview only
```

#### migrate create

Creates an empty migration.

```bash
esmeralda migrate create add_email_to_users
```

#### migrate rollback

Rolls back migrations.

```bash
esmeralda migrate rollback              # Rollback last
esmeralda migrate rollback --steps 3    # Rollback last 3
```

#### db pull

Introspects the database and generates entity files.

```bash
esmeralda db pull                # All tables
esmeralda db pull -t users       # Specific table
```

#### db push

Pushes schema directly to database (without migrations).

```bash
esmeralda db push --force
```

#### seed

Runs seed files.

```bash
esmeralda seed                   # All seeds
esmeralda seed user              # Specific seed
```

### Project Structure

```
esmerald/
├── src/
│   ├── index.ts              -- Entry point
│   ├── cli/                  -- CLI commands
│   │   ├── init.ts
│   │   ├── generate.ts
│   │   ├── migrate.ts
│   │   ├── migrate-create.ts
│   │   ├── migrate-rollback.ts
│   │   ├── db-pull.ts
│   │   ├── db-push.ts
│   │   └── seed.ts
│   ├── core/                 -- Core logic
│   │   ├── schema-parser.ts
│   │   ├── diff-engine.ts
│   │   ├── migration-generator.ts
│   │   └── lua-bridge.ts
│   └── utils/                -- Utilities
│       ├── logger.ts
│       └── errors.ts
├── src/bin/esmeralda.ts       -- npm bin entry point
├── test/                     -- 9 tests
├── package.json
└── tsconfig.json
```

### Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Development
npm run dev
```

### Roadmap

- [x] npm publication
- [ ] Standalone build (.exe via pkg)
- [ ] `esmeralda db diff` command
- [ ] `esmeralda db seed` command
- [ ] MySQL/SQLite support

### License

MIT

---

## PT-BR

### Sobre

Esmeralda é a CLI oficial do Jade ORM. Gerencia projetos, migrations, schemas e seeds de forma simples e intuitiva.

### Instalação

```bash
npm install -g @alehandrosv/esmeralda-cli
```

### Comandos

#### init

Cria a estrutura básica de um projeto Jade.

```bash
esmeralda init -n my-app
```

Gera:
```
my-app/
├── jade.config.lua
├── schema/
│   └── init.lua
├── migrations/
├── seeds/
└── lib/
    └── app.lua
```

#### generate

Gera uma migration a partir das alterações no schema.

```bash
esmeralda generate -n create_users
esmeralda generate --preview  # Apenas mostra o SQL
```

#### migrate

Roda todas as migrations pendentes.

```bash
esmeralda migrate
esmeralda migrate --preview  # Apenas mostra o que seria executado
```

#### migrate create

Cria uma migration vazia.

```bash
esmeralda migrate create add_email_to_users
```

#### migrate rollback

Desfaz migrations.

```bash
esmeralda migrate rollback              # Desfaz última
esmeralda migrate rollback --steps 3    # Desfaz últimas 3
```

#### db pull

Introspeciona o banco de dados e gera arquivos de entidade.

```bash
esmeralda db pull                # Todas as tabelas
esmeralda db pull -t users       # Tabela específica
```

#### db push

Empurra o schema diretamente para o banco (sem migrations).

```bash
esmeralda db push --force
```

#### seed

Rodar arquivos de seed.

```bash
esmeralda seed                   # Todos os seeds
esmeralda seed user              # Seed específico
```

### Estrutura do Projeto

```
esmerald/
├── src/
│   ├── index.ts              -- Entry point
│   ├── cli/                  -- Comandos da CLI
│   │   ├── init.ts
│   │   ├── generate.ts
│   │   ├── migrate.ts
│   │   ├── migrate-create.ts
│   │   ├── migrate-rollback.ts
│   │   ├── db-pull.ts
│   │   ├── db-push.ts
│   │   └── seed.ts
│   ├── core/                 -- Lógica principal
│   │   ├── schema-parser.ts
│   │   ├── diff-engine.ts
│   │   ├── migration-generator.ts
│   │   └── lua-bridge.ts
│   └── utils/                -- Utilitários
│       ├── logger.ts
│       └── errors.ts
├── src/bin/esmeralda.ts       -- Entry point para npm
├── test/                     -- 9 testes
├── package.json
└── tsconfig.json
```

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar testes
npm test

# Build
npm run build

# Desenvolvimento
npm run dev
```

### Roadmap

- [x] Publicação no npm
- [ ] Build standalone (.exe via pkg)
- [ ] Comando `esmeralda db diff`
- [ ] Comando `esmeralda db seed`
- [ ] Suporte a MySQL/SQLite

### Licença

MIT
