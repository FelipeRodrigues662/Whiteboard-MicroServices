#!/bin/bash

echo "🚀 Build das imagens para Kubernetes..."

# Build do frontend para Kubernetes
echo "📦 Build do frontend..."
cd whiteboard
docker build -f Dockerfile -t feliperodrigues662/whiteboard:latest .
cd ..

# Build dos outros serviços (se necessário)
echo "📦 Build do authentication..."
cd authentication
docker build -t feliperodrigues662/authentication:latest .
cd ..

echo "📦 Build do session-service..."
cd session-service
docker build -t feliperodrigues662/session-service:latest .
cd ..

echo "📦 Build do coordinator..."
cd coordinator
docker build -t feliperodrigues662/coordinator:latest .
cd ..

echo "📦 Build do whiteboard-core..."
cd whiteboard-core
docker build -t feliperodrigues662/whiteboard-core:latest .
cd ..

echo "📤 Push das imagens..."
docker push feliperodrigues662/whiteboard:latest
docker push feliperodrigues662/authentication:latest
docker push feliperodrigues662/session-service:latest
docker push feliperodrigues662/coordinator:latest
docker push feliperodrigues662/whiteboard-core:latest

echo "✅ Build concluído! Agora você pode executar:".;
echo "kubectl apply -f k8s/"
echo "minikube service whiteboard-frontend" 