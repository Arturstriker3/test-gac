import uuid
from faker import Faker
from jsonschema import validate
import pytest
from .schemas import (
    user_schema, group_schema, list_of_orgs_schema, node_list_schema, error_schema
)

fake = Faker()

def _mk_user():
    return {"name": fake.name(), "email": f"int-{uuid.uuid4()}@example.com"}

def _mk_group(name=None):
    return {"name": name or f"grp-{uuid.uuid4()}"}

def test_full_hierarchy_flow(base_url, http):
    # Cria nós
    u_res = http.post(f"{base_url}/users", json=_mk_user())
    assert u_res.status_code == 201, u_res.text
    user = u_res.json()
    validate(user, user_schema)
    user_id = user["id"]

    g_empresa = http.post(f"{base_url}/groups", json=_mk_group("Empresa"))
    assert g_empresa.status_code == 201, g_empresa.text
    empresa = g_empresa.json()
    validate(empresa, group_schema)

    g_tec = http.post(f"{base_url}/groups", json={"name": "Tecnologia", "parentId": empresa["id"]})
    assert g_tec.status_code == 201, g_tec.text
    tec = g_tec.json()
    validate(tec, group_schema)

    g_eng = http.post(f"{base_url}/groups", json={"name": "Engenharia", "parentId": tec["id"]})
    assert g_eng.status_code == 201, g_eng.text
    eng = g_eng.json()
    validate(eng, group_schema)

    # Associa usuário a Engenharia
    a1 = http.post(f"{base_url}/users/{user_id}/groups", json={"groupId": eng["id"]})
    assert a1.status_code in (204, 200), a1.text

    # Organizações do usuário (diretas+herdadas)
    orgs_res = http.get(f"{base_url}/users/{user_id}/organizations")
    assert orgs_res.status_code == 200, orgs_res.text
    orgs = orgs_res.json()
    validate(orgs, list_of_orgs_schema)

    # Deve conter Engenharia (depth=1), Tecnologia (2), Empresa (3) ou mais
    ids = [o["id"] for o in orgs]
    depths = [o["depth"] for o in orgs]
    assert eng["id"] in ids and tec["id"] in ids and empresa["id"] in ids
    # ordenação crescente por depth é desejável
    assert depths == sorted(depths), "organizations deveria estar ordenado por depth crescente"
    # ids únicos
    assert len(ids) == len(set(ids)), "organizations não deve ter duplicados"

    # ancestrais de Engenharia
    anc_res = http.get(f"{base_url}/nodes/{eng['id']}/ancestors")
    assert anc_res.status_code == 200, anc_res.text
    ancestors = anc_res.json()
    validate(ancestors, node_list_schema)
    anc_ids = [n["id"] for n in ancestors]
    assert empresa["id"] in anc_ids and tec["id"] in anc_ids
    assert all(n["depth"] >= 1 for n in ancestors)

    # descendentes de Empresa
    desc_res = http.get(f"{base_url}/nodes/{empresa['id']}/descendants")
    assert desc_res.status_code == 200, desc_res.text
    descendants = desc_res.json()
    validate(descendants, node_list_schema)
    desc_ids = {n["id"] for n in descendants}
    assert eng["id"] in desc_ids and tec["id"] in desc_ids

def test_multiple_group_membership_and_min_depth(base_url, http):
    # monta dois ramos paralelos
    u = http.post(f"{base_url}/users", json=_mk_user()).json()
    validate(u, user_schema)

    root = http.post(f"{base_url}/groups", json=_mk_group("Root")).json()
    a = http.post(f"{base_url}/groups", json={"name": "A", "parentId": root["id"]}).json()
    b = http.post(f"{base_url}/groups", json={"name": "B", "parentId": root["id"]}).json()

    # associa em A e B
    r1 = http.post(f"{base_url}/users/{u['id']}/groups", json={"groupId": a["id"]})
    r2 = http.post(f"{base_url}/users/{u['id']}/groups", json={"groupId": b["id"]})
    assert r1.status_code in (204, 200) and r2.status_code in (204, 200)

    # valida organizations contém ambos e depth mínimo por ancestral
    orgs = http.get(f"{base_url}/users/{u['id']}/organizations").json()
    validate(orgs, list_of_orgs_schema)
    by_id = {}
    for o in orgs:
        by_id.setdefault(o["id"], []).append(o["depth"])
    # depth mínimo por ancestral = 1 para A e B
    assert min(by_id[a["id"]]) == 1 and min(by_id[b["id"]]) == 1

def test_prevent_cycles_and_duplicate_email(base_url, http):
    # cria dois grupos e tenta ciclo
    g1 = http.post(f"{base_url}/groups", json=_mk_group("G1")).json()
    g2 = http.post(f"{base_url}/groups", json={"name": "G2", "parentId": g1["id"]}).json()

    # tentar criar aresta inversa G1 filho de G2 -> deve falhar
    bad = http.post(f"{base_url}/users/{g1['id']}/groups", json={"groupId": g2["id"]})
    # implementação pode responder 400/409/422; validar corpo de erro se JSON
    assert bad.status_code in (400, 409, 422), bad.text
    try:
        validate(bad.json(), error_schema)
    except Exception:
        pass  # aceita erro não JSON

    # email duplicado deve falhar
    email = f"dup-{uuid.uuid4()}@example.com"
    r1 = http.post(f"{base_url}/users", json={"name": "X", "email": email})
    r2 = http.post(f"{base_url}/users", json={"name": "Y", "email": email})
    assert r1.status_code == 201, r1.text
    assert r2.status_code in (400, 409, 422), r2.text
