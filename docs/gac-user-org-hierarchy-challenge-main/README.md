# Desafio — API de Unidades Organizacionais (Closure Table)

Construa uma **API CRUD de gestão de usuários** em **TypeScript full-typed** (ou outra stack equivalente) que modele **Unidades Organizacionais** como hierarquia usando **Closure Table** (no Postgres). A API deve **passar os testes deste repositório** (integração forte + carga).

> Você pode usar o **servidor de exemplo em memória** (Python) apenas para entender o contrato, mas a entrega esperada é a versão em TS/Postgres conforme o enunciado.

## O que precisa ter (essencial)

* Modelagem de **nós** (`USER` e `GROUP`) com **Closure Table** (sem usar `WITH RECURSIVE` nas leituras principais).
* **Rotas**:

  * `POST /users` – cria usuário.
  * `POST /groups` – cria grupo (opcional `parentId`).
  * `POST /users/:id/groups` – associa nó usuário → grupo (usuário pode ter N subgrupos).
  * `GET /users/:id/organizations` – retorna grupos do usuário (**diretos + herdados**) com `depth`.
  * `GET /nodes/:id/ancestors` – lista ancestrais do nó (`depth ≥ 1`).
  * `GET /nodes/:id/descendants` – lista descendentes do nó (`depth ≥ 1`).

## Focos de avaliação

* **Elegância de código** (SOLID, camadas limpas, tipagem forte).
* **Corretude da hierarquia** (sem ciclos, profundidades mínimas, sem duplicados).
* **Performance de leitura** via Closure Table.
* **Observabilidade**: logs JSON no **ECS** (Elastic Common Schema) + **OpenTelemetry** com spans personalizados.
* **Testes**: unitários/integrados no seu projeto.

## Como rodar os testes (deste repositório)

1. **Aponte o link da sua API**:

   * Defina `BASE_URL` para o endpoint público (ou localhost).
   * Ex.: `export BASE_URL="https://SEU_LINK_AQUI"` ou `export BASE_URL="http://localhost:3000"`.

2. **Instale as dependências de teste**:

```
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

3. **Teste de integração (estrito)**:

```
pytest -v
```

4. **Teste de carga (Locust, headless)** — ajuste usuários/duração se quiser:

```
locust -f locustfile.py --headless -u 30 -r 5 -t 2m --host "$BASE_URL"
```

> Os testes verificam: criação de nós, associações múltiplas, ancestralidade/descendência, **organizations** ordenado por `depth`, **proibição de ciclos**, **e-mail único**, e retornos de erro JSON.

## Rodando o servidor de exemplo (opcional)

Este repo inclui uma API **em memória** para referência rápida do contrato (não é a entrega final):

```
cd hack
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 3000
```

Em outro terminal:

```
export BASE_URL="http://localhost:3000"
pytest -v
```

## Especificação resumida do contrato esperado

* `POST /users`
  **201** `{ id, type:"USER", name, email }`
* `POST /groups`
  **201** `{ id, type:"GROUP", name }` (se `parentId` informado, cria aresta e atualiza closure)
* `POST /users/:id/groups`
  **204** (associa usuário ao grupo; sem corpo).
  Erros: `400/409/422` para ciclo, tipo inválido etc.
* `GET /users/:id/organizations`
  **200** `[{ id, name, depth>=1 }, ...]` — **sem duplicidade**, **ordenado por depth crescente**.
* `GET /nodes/:id/ancestors`
  **200** `[{ id, name, depth>=1 }]`
* `GET /nodes/:id/descendants`
  **200** `[{ id, name, depth>=1 }]`

## Dicas rápidas

* **Closure Table**: garanta inserção de `self-link (depth=0)`; ao criar aresta `A → B`, propague `(anc(A), desc(B))` com `depth = da + 1 + db`, mantendo **depth mínimo** por par.
* **Ciclos**: antes de criar `A → B`, verifique se `B` alcança `A`.
* **Observabilidade**: correlacione `trace.id`/`span.id` no log ECS.

## Entrega

* Repositório com código + **migrations** + instruções.

## Dev Container (opcional)

Há um devcontainer neste repositório pronto para executar um projeto node. Você pode usa-lo e expandir o docker-compose.yaml que ele referencia para implantar suas dependencias.