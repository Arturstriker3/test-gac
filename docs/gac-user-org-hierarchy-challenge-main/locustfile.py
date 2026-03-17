import os
import uuid
from locust import HttpUser, task, between

BASE_PATH = "/"
# Use: locust -f locustfile.py --headless -u 30 -r 5 -t 2m --env BASE_URL=https://sua-api

class OrgApiUser(HttpUser):
    wait_time = between(0.1, 0.5)

    def on_start(self):
        # base_url vem do ambiente do Locust; aqui só valida caminho
        pass

    @task(3)
    def create_user_and_associate(self):
        user = {"name": f"Load {uuid.uuid4()}", "email": f"load-{uuid.uuid4()}@example.com"}
        r = self.client.post("/users", json=user, name="POST /users")
        assert r.status_code == 201, r.text
        uid = r.json()["id"]

        g = self.client.post("/groups", json={"name": f"G-{uuid.uuid4()}"}, name="POST /groups")
        assert g.status_code == 201, g.text
        gid = g.json()["id"]

        a = self.client.post(f"/users/{uid}/groups", json={"groupId": gid}, name="POST /users/:id/groups")
        assert a.status_code in (200, 204), a.text

        orgs = self.client.get(f"/users/{uid}/organizations", name="GET /users/:id/organizations")
        assert orgs.status_code == 200
        data = orgs.json()
        assert any(o["id"] == gid for o in data)

    @task(1)
    def list_desc_anc(self):
        # cria um nó e lê as rotas de hierarquia
        g = self.client.post("/groups", json={"name": f"R-{uuid.uuid4()}"}, name="POST /groups")
        if g.status_code != 201:
            return
        gid = g.json()["id"]
        self.client.get(f"/nodes/{gid}/ancestors", name="GET /nodes/:id/ancestors")
        self.client.get(f"/nodes/{gid}/descendants", name="GET /nodes/:id/descendants")
