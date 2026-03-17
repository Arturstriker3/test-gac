# Architecture — Desafio GAC (Closure Table)

## Objetivo

Este documento define somente o necessário para passar no desafio de hierarquia organizacional.

## Escopo funcional obrigatório

- Nós de dois tipos: `USER` e `GROUP`
- Hierarquia com Closure Table em PostgreSQL
- Leituras principais sem `WITH RECURSIVE`
- Rotas obrigatórias:
  - `POST /users`
  - `POST /groups`
  - `POST /users/:id/groups`
  - `GET /users/:id/organizations`
  - `GET /nodes/:id/ancestors`
  - `GET /nodes/:id/descendants`

## Estrutura do projeto

- `src/modules/organization`
  - `domain`
    - entidades de dados (`node`, `closure`, `membership`)
    - interfaces de repositório
    - tipos e erros de domínio
  - `application/use-cases`
    - criação de usuário
    - criação de grupo
    - associação usuário → grupo
    - consultas de organizações, ancestrais e descendentes
  - `infrastructure`
    - persistência PostgreSQL
    - implementação de atualização da closure table
  - `presentation/rest`
    - controllers e DTOs HTTP
  - `organization.module.ts`
- `src/common`
  - banco, logger e observabilidade (ECS + OpenTelemetry)

## Modelo de dados (PostgreSQL)

- `nodes`
  - `id` (PK)
  - `type` (`USER` ou `GROUP`)
  - `name`
  - `email` (somente para `USER`, único quando não nulo)
  - `created_at`
- `node_closure`
  - `ancestor_id` (FK nodes.id)
  - `descendant_id` (FK nodes.id)
  - `depth` (`0` para self-link)
  - chave única: (`ancestor_id`, `descendant_id`)
- `user_group_links`
  - `user_id` (FK nodes.id, deve ser `USER`)
  - `group_id` (FK nodes.id, deve ser `GROUP`)
  - chave única: (`user_id`, `group_id`)

## Regras de negócio obrigatórias

- Todo nó criado insere self-link na closure table com `depth = 0`
- Ao criar relação `parentGroup -> childGroup`, atualizar closure com profundidade mínima por par
- Antes de criar relação entre grupos, bloquear ciclo:
  - se `childGroup` já alcança `parentGroup`, rejeitar com erro de domínio
- Usuário pode ser associado a múltiplos grupos
- `GET /users/:id/organizations` retorna grupos diretos e herdados
  - sem duplicidade
  - ordenado por `depth` crescente
- `GET /nodes/:id/ancestors` e `GET /nodes/:id/descendants`
  - retornam apenas `depth >= 1`

## Contrato HTTP

- `POST /users`
  - entrada: `{ name, email }`
  - saída `201`: `{ id, type: "USER", name, email }`
- `POST /groups`
  - entrada: `{ name, parentId? }`
  - saída `201`: `{ id, type: "GROUP", name }`
- `POST /users/:id/groups`
  - entrada: `{ groupId }`
  - saída `204` sem corpo
- `GET /users/:id/organizations`
  - saída `200`: `[{ id, name, depth }]`
- `GET /nodes/:id/ancestors`
  - saída `200`: `[{ id, name, depth }]`
- `GET /nodes/:id/descendants`
  - saída `200`: `[{ id, name, depth }]`

## Erros e validações

- Payload inválido: `400`
- Recurso inexistente: `404`
- Conflito de regra (`email` duplicado, vínculo duplicado, ciclo): `409`
- Tipo de nó inválido para operação: `422`
- Formato de erro JSON consistente em todas as rotas

## Consultas e performance

- Não usar `SELECT *` nas consultas públicas
- Índices obrigatórios:
  - `node_closure (ancestor_id, depth)`
  - `node_closure (descendant_id, depth)`
  - `nodes (type)`
  - `nodes (email)` único parcial para usuários
- Usar `ON CONFLICT` para idempotência de inserções relacionais quando aplicável

## Observabilidade

- Logs em JSON compatíveis com ECS
- Instrumentação OpenTelemetry com spans de:
  - criação de nós
  - atualização da closure table
  - consultas de organizations/ancestors/descendants
- Correlacionar `trace.id` e `span.id` nos logs

## Direção de dependências

- `presentation -> application -> domain`
- `infrastructure -> domain`
- `domain` não depende das outras camadas

## Boas práticas de implementação

- Usar TypeScript com tipagem forte em DTOs, entidades, repositórios e casos de uso
- Aplicar guard clauses para validações de entrada e pré-condições
- Manter funções pequenas com responsabilidade única por camada
- Centralizar regras de negócio em `application/use-cases`, sem lógica de domínio em controller
- Tratar erros de domínio com mapeamento explícito para códigos HTTP
- Validar payload com schema e normalizar formato de erro JSON
- Criar testes unitários para casos de uso e testes de integração para as rotas obrigatórias
- Garantir idempotência em inserções relacionais com constraints e `ON CONFLICT`
- Executar lint, typecheck e testes antes de subir versão candidata do desafio
