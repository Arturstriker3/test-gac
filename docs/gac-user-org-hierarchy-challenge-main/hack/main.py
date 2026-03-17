from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from typing import Dict, Tuple, Optional, List
from uuid import uuid4

app = FastAPI(title="In-Memory Org API")

class CreateUser(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr

class CreateGroup(BaseModel):
    name: str = Field(min_length=1)
    parentId: Optional[str] = None

class Associate(BaseModel):
    groupId: str

nodes: Dict[str, Dict] = {}
edges: set[Tuple[str, str]] = set()
closure: Dict[Tuple[str, str], int] = {}
user_email_index: Dict[str, str] = {}

def error(msg: str, status: int = 400):
    raise HTTPException(status_code=status, detail=msg)

def ensure_self_link(node_id: str):
    if (node_id, node_id) not in closure:
        closure[(node_id, node_id)] = 0

def ancestors_of(node_id: str) -> List[Tuple[str, int]]:
    out = []
    for (a, d), depth in closure.items():
        if d == node_id and depth >= 1:
            out.append((a, depth))
    best: Dict[str, int] = {}
    for a, depth in out:
        best[a] = min(best.get(a, depth), depth)
    return sorted(best.items(), key=lambda x: x[1])

def descendants_of(node_id: str) -> List[Tuple[str, int]]:
    out = []
    for (a, d), depth in closure.items():
        if a == node_id and depth >= 1:
            out.append((d, depth))
    best: Dict[str, int] = {}
    for d, depth in out:
        best[d] = min(best.get(d, depth), depth)
    return sorted(best.items(), key=lambda x: x[1])

def add_node(node_type: str, name: str, email: Optional[str] = None) -> Dict:
    nid = str(uuid4())
    node = {"id": nid, "type": node_type, "name": name}
    if node_type == "USER":
        if email in user_email_index:
            error("email already exists", 409)
        node["email"] = email
        user_email_index[email] = nid
    nodes[nid] = node
    ensure_self_link(nid)
    return node

def add_edge(parent_id: str, child_id: str):
    if parent_id not in nodes or child_id not in nodes:
        error("parent or child not found", 404)
    if parent_id == child_id:
        error("cyclic relationship is not allowed", 409)
    if (child_id, parent_id) in closure:
        error("cyclic relationship is not allowed", 409)

    edges.add((parent_id, child_id))
    ensure_self_link(parent_id)
    ensure_self_link(child_id)

    ancestors = [(parent_id, 0)]
    for (a, d), depth in list(closure.items()):
        if d == parent_id:
            ancestors.append((a, depth))
    descendants = [(child_id, 0)]
    for (a, d), depth in list(closure.items()):
        if a == child_id:
            descendants.append((d, depth))

    for a, da in ancestors:
        for d, dd in descendants:
            new_depth = da + 1 + dd
            key = (a, d)
            if key not in closure or new_depth < closure[key]:
                closure[key] = new_depth

@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"message": str(exc.detail)})

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"message": "ok"}

@app.post("/users", status_code=201)
def create_user(body: CreateUser):
    user = add_node("USER", body.name, body.email)
    return user

@app.post("/groups", status_code=201)
def create_group(body: CreateGroup):
    group = add_node("GROUP", body.name)
    if body.parentId:
        add_edge(body.parentId, group["id"])
    return group

@app.post("/users/{node_id}/groups", status_code=204)
def associate_node_with_group(node_id: str, body: Associate):
    if body.groupId not in nodes:
        error("group not found", 404)
    if node_id not in nodes:
        error("node not found", 404)
    if nodes[body.groupId]["type"] != "GROUP":
        error("groupId must be a GROUP", 422)
    add_edge(body.groupId, node_id)
    return Response(status_code=204)

@app.get("/users/{user_id}/organizations")
def user_organizations(user_id: str):
    if user_id not in nodes or nodes[user_id]["type"] != "USER":
        error("user not found", 404)
    result = []
    for a, depth in ancestors_of(user_id):
        if nodes[a]["type"] == "GROUP":
            result.append({"id": a, "name": nodes[a]["name"], "depth": depth})
    result.sort(key=lambda x: x["depth"])
    return result

@app.get("/nodes/{node_id}/ancestors")
def node_ancestors(node_id: str):
    if node_id not in nodes:
        error("node not found", 404)
    items = [{"id": a, "name": nodes[a]["name"], "depth": depth} for a, depth in ancestors_of(node_id)]
    return items

@app.get("/nodes/{node_id}/descendants")
def node_descendants(node_id: str):
    if node_id not in nodes:
        error("node not found", 404)
    items = [{"id": d, "name": nodes[d]["name"], "depth": depth} for d, depth in descendants_of(node_id)]
    return items

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=False)
