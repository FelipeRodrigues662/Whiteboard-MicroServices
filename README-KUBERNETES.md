# Deploy no Kubernetes (Minikube)

Este guia explica como fazer o deploy da aplicação Whiteboard no Minikube.

## 📋 Pré-requisitos

- Minikube instalado e rodando
- kubectl configurado
- Docker instalado
- Acesso ao Docker Hub (para push das imagens)

## 🚀 Passos para Deploy

### 1. Build das Imagens

Execute o script de build:

```bash
chmod +x build-k8s.sh
./build-k8s.sh
```

### 2. Deploy com Minikube Tunnel (Recomendado)

Para usar `minikube tunnel` e acessar os serviços via LoadBalancer:

```bash
chmod +x deploy-with-tunnel.sh
./deploy-with-tunnel.sh
```

### 3. Deploy Manual

```bash
# Aplicar todos os recursos
kubectl apply -f k8s/

# Verificar se os pods estão rodando
kubectl get pods

# Verificar os serviços
kubectl get services
```

### 4. Acessar a Aplicação

#### Com Minikube Tunnel:
```bash
# Em um terminal separado
minikube service whiteboard-frontend
```

#### Sem Tunnel:
```bash
# Usar port-forward
kubectl port-forward service/whiteboard-frontend 3000:80
```

## 🔧 Configurações

### Variáveis de Ambiente

As variáveis de ambiente estão configuradas para usar os nomes dos serviços internos do Kubernetes:

- **Frontend**: `env.k8s` - URLs dos serviços internos
- **Authentication**: Usa `haproxy-mariadb` como host do banco
- **Session Service**: Usa `haproxy-mariadb` como host do banco
- **Coordinator**: Configurado com credenciais do RabbitMQ

### URLs dos Serviços

No Kubernetes, os serviços se comunicam usando os nomes internos:

- `authentication:4020`
- `session-service:4010`
- `coordinator:4000`
- `whiteboard-core:4040`

## 🗄️ Configuração do Banco de Dados

### Replicação MariaDB Galera

A configuração implementa o princípio de **1 líder para escrita, 2 réplicas para leitura**:

- **3 réplicas** do MariaDB Galera
- **HAProxy** como load balancer inteligente
- **Porta 3306**: Apenas escrita (líder)
- **Porta 3307**: Leitura (todas as réplicas)

### Estrutura de Replicação:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Galera Node 0 │    │   Galera Node 1 │    │   Galera Node 2 │
│   (Líder)       │    │   (Réplica)     │    │   (Réplica)     │
│   Escrita       │    │   Leitura       │    │   Leitura       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     HAProxy     │
                    │ 3306: Escrita   │
                    │ 3307: Leitura   │
                    └─────────────────┘
```

## 🐛 Troubleshooting

### Verificar logs dos pods:

```bash
kubectl logs <nome-do-pod>
```

### Verificar status dos serviços:

```bash
kubectl describe service <nome-do-servico>
```

### Verificar status do cluster Galera:

```bash
# Acessar um pod do MariaDB
kubectl exec -it mariadb-galera-0 -- mysql -u root -padmin

# Verificar status do cluster
SHOW STATUS LIKE 'wsrep%';
```

### Acessar um pod para debug:

```bash
kubectl exec -it <nome-do-pod> -- /bin/sh
```

## 📁 Arquivos Importantes

- `k8s/` - Manifests do Kubernetes
- `whiteboard/Dockerfile.k8s` - Dockerfile específico para K8s
- `whiteboard/env.k8s` - Variáveis de ambiente para K8s
- `build-k8s.sh` - Script de build automatizado
- `deploy-with-tunnel.sh` - Script de deploy com tunnel

## 🔄 Atualizações

Para atualizar a aplicação:

1. Faça as alterações no código
2. Execute `./build-k8s.sh`
3. Execute `kubectl rollout restart deployment/<nome-do-deployment>`

## 🌐 Minikube Tunnel

O `minikube tunnel` permite que os serviços LoadBalancer sejam acessíveis externamente:

```bash
# Iniciar tunnel
minikube tunnel

# Em outro terminal, acessar serviços
minikube service whiteboard-frontend
```

### URLs com Tunnel:
- Frontend: `http://<IP>:80`
- Authentication: `http://<IP>:4020`
- Session Service: `http://<IP>:4010`
- Coordinator: `http://<IP>:4000`
- Banco Escrita: `<IP>:3306`
- Banco Leitura: `<IP>:3307` 