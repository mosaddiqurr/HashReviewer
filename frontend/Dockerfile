FROM node:24-alpine AS builder
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
COPY assets/ /build/assets/
RUN npm run build

FROM nginx:stable-alpine
RUN addgroup -g 10001 -S hashreviewer && adduser -u 10001 -S -G hashreviewer hashreviewer
COPY frontend/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /build/frontend/dist /usr/share/nginx/html
USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD ["wget", "-q", "-O", "-", "http://127.0.0.1:8080/"]
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
