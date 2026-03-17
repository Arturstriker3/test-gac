FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

RUN apt-get update && \
    apt-get install -y --no-install-recommends wget gnupg lsb-release && \
    echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    netcat-openbsd redis-tools postgresql-client-17 \
    python3 python3-pip python3-venv python3-fastapi python3-uvicorn \
    && rm -rf /var/lib/apt/lists/*

ENTRYPOINT [ "sleep", "infinity" ]