# Teste Técnico GAC — API de Hierarquia Organizacional

API backend para gerenciamento de hierarquia organizacional com nós de `USER` e `GROUP`, usando Closure Table em PostgreSQL.

## Objetivo do desafio

Implementar as rotas obrigatórias para:

- Criar usuário
- Criar grupo (raiz ou filho)
- Associar usuário a grupo
- Consultar organizações de um usuário
- Consultar ancestrais de um nó
- Consultar descendentes de um nó

## Stack

- Bun + TypeScript
- NestJS + Fastify
- PostgreSQL 18 (Closure Table)
- OpenTelemetry
- Loki + Promtail + Grafana

## Rotas obrigatórias

- `POST /users`
- `POST /groups`
- `POST /users/:id/groups`
- `GET /users/:id/organizations`
- `GET /nodes/:id/ancestors`
- `GET /nodes/:id/descendants`
- `GET /health`

## Pré-requisito

- Docker + Docker Compose

## Rodando stack completa (API + banco + telemetria)

```bash
docker compose -f docker-compose.yml up -d --build
```

URLs padrão:

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- Health: `http://localhost:3000/health`
- Grafana: `http://localhost:3001`
- Loki: `http://localhost:3100`

## Limite de recursos no compose principal

No `docker-compose.yml`, os serviços principais estão com limite:

- `api`: `1 CPU` e `2GB RAM`
- `postgres`: `1 CPU` e `2GB RAM`

## Testes

### Testes técnicos do desafio (strict)

```bash
docker compose -f docker-compose.challenge-tests.yml run --rm challenge-tests
```

### Teste de carga com Locust

```bash
docker compose -f docker-compose.challenge-load.yml run --rm challenge-load
```

## Observabilidade e dashboard

A stack de observabilidade já vem pronta no compose principal:

- Logs ECS em JSON
- Spans OpenTelemetry
- Dashboard Grafana provisionado automaticamente

Métricas de negócio e performance disponíveis no dashboard:

- Latência p50, p95, p99
- Taxa de erro e erros por minuto
- RPS e volume por minuto
- Tempo médio de resposta
- Performance por endpoint (quantidade e tempo médio)
- Requisições lentas
- Uso de CPU e memória
- Event loop lag
- Usuários e grupos criados por minuto
- Sucesso vs erro nas operações

## Estrutura do projeto

```text
src/
  common/
    config/
    database/
    observability/
    validation/
  modules/
    organization/
      application/
      domain/
      infrastructure/
      presentation/
```

## Documentos auxiliares

- Arquitetura detalhada: `ARCHITECTURE.md`
- Artefatos oficiais do desafio: `docs/gac-user-org-hierarchy-challenge-main`
