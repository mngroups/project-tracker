FROM node:24.22.1-bookworm AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
# pnpm applies patchedDependencies during install, so the patches must be in
# the context before it runs.
COPY patches ./patches

# The GitLab npm token (read_package_registry access) comes in as a build
# secret and is deleted in the same layer, so it never ends up in the image:
#   docker build --secret id=gitlab_npm_token,env=GITLAB_NPM_TOKEN \
#     --build-arg GITLAB_PACKAGE_GROUP_ID=... .
ARG GITLAB_PACKAGE_GROUP_ID
RUN --mount=type=secret,id=gitlab_npm_token \
    test -n "$GITLAB_PACKAGE_GROUP_ID" && \
    printf '@mono:registry=https://gitlab.com/api/v4/groups/%s/-/packages/npm/\n//gitlab.com/api/v4/groups/%s/-/packages/npm/:_authToken=%s\n//gitlab.com/api/v4/projects/89199789/packages/npm/:_authToken=%s\n//gitlab.com/api/v4/projects/89199810/packages/npm/:_authToken=%s\n//gitlab.com/api/v4/projects/89199850/packages/npm/:_authToken=%s\n//gitlab.com/api/v4/projects/89199831/packages/npm/:_authToken=%s\n' \
      "$GITLAB_PACKAGE_GROUP_ID" "$GITLAB_PACKAGE_GROUP_ID" \
      "$(tr -d '\n' < /run/secrets/gitlab_npm_token)" \
      "$(tr -d '\n' < /run/secrets/gitlab_npm_token)" \
      "$(tr -d '\n' < /run/secrets/gitlab_npm_token)" \
      "$(tr -d '\n' < /run/secrets/gitlab_npm_token)" \
      "$(tr -d '\n' < /run/secrets/gitlab_npm_token)" > .npmrc && \
    pnpm install --frozen-lockfile && \
    rm -f .npmrc

# Client flags are inlined at build time (see docs/guides/feature-flags.md).
ARG NEXT_PUBLIC_FEATURE_FLAGS={}
ARG NEXT_DEPLOYMENT_ID
ENV NEXT_PUBLIC_FEATURE_FLAGS=$NEXT_PUBLIC_FEATURE_FLAGS \
    NEXT_DEPLOYMENT_ID=$NEXT_DEPLOYMENT_ID

COPY . .

# CI type-checks in its own job; pass true there to skip repeating it here.
ARG NEXT_SKIP_BUILD_CHECKS=false
RUN NEXT_SKIP_BUILD_CHECKS=$NEXT_SKIP_BUILD_CHECKS pnpm build

FROM node:24.22.1-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Runtime config (API_BASE_URL, FEATURE_* server flags) comes from the container env.
EXPOSE 3000
USER node
CMD ["node", "server.js"]
