#!/bin/bash

echo "🚀 Iniciando deployment dos serviços no Kubernetes..."

echo "📦 Aplicando serviços de infraestrutura..."
kubectl apply -f haproxy-configmap.yaml
kubectl apply -f mariadb-galera.yaml
kubectl apply -f haproxy-mariadb.yaml
kubectl apply -f redis.yaml
kubectl apply -f rabbitmq.yaml

echo "⏳ Aguardando 30 segundos para os serviços de infraestrutura iniciarem..."
sleep 30
kubectl exec -it mariadb-galera-0 -- mysql -u root -padmin -e "CREATE DATABASE IF NOT EXISTS whiteboard_app_db;"
echo "🔐 Aplicando serviços de backend..."
kubectl apply -f authentication.yaml
sleep 10
echo "🔄 Aplicando serviço de sessão..."
kubectl apply -f session-service.yaml
sleep 10
echo "🎯 Aplicando coordenador e core..."
kubectl apply -f coordinator.yaml
kubectl apply -f whiteboard-core.yaml

echo "⏳ Aguardando 20 segundos para os serviços de backend iniciarem..."
sleep 20
kubectl exec -it mariadb-galera-0 -- mysql -u root -padmin -e "CREATE DATABASE IF NOT EXISTS whiteboard_app_db;"

echo "🌐 Aplicando frontend e ferramentas de administração..."
kubectl apply -f frontend.yaml
kubectl apply -f phpmyadmin.yaml

echo "✅ Deployment completo!"

# Verificar status dos pods
echo "📊 Verificando status dos pods..."
kubectl get pods