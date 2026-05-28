FROM node:20-bookworm-slim

ENV PORT=7860
ENV PATENT_DISCLOSURE_SKILL_DIR=/opt/patent-disclosure-skill
ENV PATH="/opt/venv/bin:${PATH}"

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    python3 \
    python3-venv \
  && rm -rf /var/lib/apt/lists/*

RUN git clone --depth=1 https://github.com/handsomestWei/patent-disclosure-skill.git /opt/patent-disclosure-skill \
  && python3 -m venv /opt/venv \
  && /opt/venv/bin/pip install --no-cache-dir -r /opt/patent-disclosure-skill/tools/requirements-cnipa.txt \
  && /opt/venv/bin/python -m playwright install --with-deps chromium

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build \
  && npm prune --omit=dev

ENV NODE_ENV=production

EXPOSE 7860

CMD ["npm", "start"]
