# Build the React frontend
FROM node:24-alpine AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# Production nginx image
FROM nginx:1.27-alpine
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=frontend-build /app/dist /app/dist
EXPOSE 80
