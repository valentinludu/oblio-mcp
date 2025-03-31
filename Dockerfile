FROM node:22.12-alpine AS builder

# Must be entire project because `prepare` script is run during `npm install` and requires all files.
COPY ./ /app

WORKDIR /app

RUN --mount=type=cache,target=/root/.npm npm install
# Make sure the build is completed
RUN npm run build

FROM node:22-alpine AS release

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/.env /app/.env

ENV NODE_ENV=production
ENV DEBUG=*

WORKDIR /app

# Use safer debugging approach
RUN find /app/dist -type f | sort || echo "No dist files found"
RUN find /app/node_modules/@modelcontextprotocol -type d | sort || echo "MCP SDK not found"

# Use the ESM entry point with debug flags
ENTRYPOINT ["node", "--trace-warnings", "--trace-uncaught", "--inspect=0.0.0.0:9229", "--env-file=.env", "dist/index.js"]