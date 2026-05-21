# ==========================================
# Stage 1: Build Phase
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./

# Install all dependencies (including devDependencies for build step)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Compile and build the project
RUN npm run build

# ==========================================
# Stage 2: Production Runtime Phase
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files to install production dependencies
COPY package*.json ./

# Install only production dependencies (excluding devDependencies)
RUN npm ci --omit=dev

# Copy the built assets from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 3000

# Start the application server
CMD ["npm", "run", "start"]
