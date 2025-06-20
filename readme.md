# 🎨 Whiteboard - Microserviços com Kubernetes

Sistema de quadro branco colaborativo em tempo real construído com microserviços e deployado no Kubernetes.

## 📋 Pré-requisitos

- **Docker** instalado e rodando
- **Minikube** instalado
- **kubectl** configurado
- **Node.js** (versão 18+)
- **Yarn** ou **npm**

## 🚀 Passo a Passo de Execução

### 1. **Iniciar o Minikube**

```bash
# Iniciar o cluster
minikube start

# Verificar se está rodando
minikube status
```

### 2. **Build das Imagens Docker**

```bash
# Dar permissão de execução ao script
chmod +x build-k8s.sh

# Executar o build de todas as imagens
./build-k8s.sh
```

**O que o script faz:**
- Build das imagens para todos os serviços
- Push das imagens para o Docker Hub
- Configuração correta das variáveis de ambiente

### 3. **Deploy no Kubernetes**

```bash
# Aplicar todos os recursos do Kubernetes
./KubInit.sh

# Verificar se os pods estão rodando
kubectl get pods
```

### 4. **Iniciar Minikube Tunnel**

```bash
# Em um terminal separado (manter aberto)
minikube tunnel
```

### 5. **Acessar a Aplicação**

```bash
# Em outro terminal
minikube service whiteboard-frontend
```

## 🏗️ Arquitetura dos Microserviços

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Authentication│    │  Session Service│
│   (React)       │    │   (Node.js)     │    │   (Node.js)     │
│   Porta: 80     │    │   Porta: 4020   │    │   Porta: 4010   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Coordinator   │
                    │   (WebSocket)   │
                    │   Porta: 4000   │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Whiteboard Core│
                    │   (WebSocket)   │
                    │   Porta: 4040   │
                    └─────────────────┘
```

## 🗄️ Banco de Dados (MariaDB Galera)

### Configuração de Replicação
- **3 réplicas** do MariaDB Galera
- **1 líder** para escrita (porta 3306)
- **2 réplicas** para leitura (porta 3307)
- **HAProxy** como load balancer

### URLs de Acesso
```
Escrita (Líder): 127.0.0.1:3306
Leitura (Réplicas): 127.0.0.1:3307
HAProxy Stats: http://127.0.0.1:8404/stats
```

## 🌐 URLs dos Serviços

Com o `minikube tunnel` ativo, os serviços ficam disponíveis em:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://127.0.0.1:80 | Interface principal |
| Authentication | http://127.0.0.1:4020 | Login/Registro |
| Session Service | http://127.0.0.1:4010 | Gerenciamento de sessões |
| Coordinator | http://127.0.0.1:4000 | WebSocket para comunicação |
| Whiteboard Core | http://127.0.0.1:4040 | Core do whiteboard |
| phpMyAdmin | http://127.0.0.1:8080 | Administração do banco |

## 🛠️ Comandos Úteis

### Verificar Status
```bash
# Status dos pods
kubectl get pods

# Status dos serviços
kubectl get services

# Logs de um pod específico
kubectl logs <nome-do-pod>
```

### Reiniciar Serviços
```bash
# Reiniciar frontend
kubectl rollout restart deployment/whiteboard-frontend

# Reiniciar authentication
kubectl rollout restart deployment/authentication

# Reiniciar session-service
kubectl rollout restart deployment/session-service
```

### Acessar Pods
```bash
# Acessar MariaDB
kubectl exec -it mariadb-galera-0 -- mysql -u root -padmin

# Acessar HAProxy
kubectl exec -it <haproxy-pod> -- sh
```

### Monitoramento
```bash
# Ver logs em tempo real
kubectl logs -f <nome-do-pod>

# Descrever pod
kubectl describe pod <nome-do-pod>
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **Pods não iniciam**
   ```bash
   kubectl describe pod <nome-do-pod>
   kubectl logs <nome-do-pod>
   ```

2. **Erro de conexão com banco**
   ```bash
   # Verificar se o banco existe
   kubectl exec -it mariadb-galera-0 -- mysql -u root -padmin -e "SHOW DATABASES;"
   
   # Criar banco se necessário
   kubectl exec -it mariadb-galera-0 -- mysql -u root -padmin -e "CREATE DATABASE IF NOT EXISTS whiteboard_app_db;"
   ```

3. **Frontend não carrega**
   ```bash
   # Verificar se o tunnel está ativo
   minikube tunnel
   
   # Limpar cache do navegador (Ctrl+F5)
   ```

4. **Erro de LoadBalancer**
   ```bash
   # Verificar se o tunnel está rodando
   kubectl get services
   # EXTERNAL-IP deve ser 127.0.0.1
   ```

### Limpeza Completa
```bash
# Parar minikube
minikube stop

# Deletar cluster
minikube delete

# Iniciar novamente
minikube start
```

## 📁 Estrutura do Projeto

```
Whiteboard-MicroServices/
├── authentication/          # Serviço de autenticação
├── session-service/         # Serviço de sessões
├── coordinator/            # Coordenador WebSocket
├── whiteboard-core/        # Core do whiteboard
├── whiteboard/             # Frontend React
├── k8s/                    # Manifests Kubernetes
│   ├── mariadb-galera.yaml
│   ├── haproxy-mariadb.yaml
│   ├── authentication.yaml
│   ├── session-service.yaml
│   ├── coordinator.yaml
│   ├── whiteboard-core.yaml
│   └── frontend.yaml
├── build-k8s.sh            # Script de build
├── docker-compose.yml      # Para desenvolvimento local
└── README.md               # Este arquivo
```

## 🎯 Funcionalidades

- ✅ **Registro e Login** de usuários
- ✅ **Criação de salas** colaborativas
- ✅ **Whiteboard em tempo real** com múltiplos usuários
- ✅ **Persistência** de dados no banco
- ✅ **Escalabilidade** com microserviços
- ✅ **Alta disponibilidade** com replicação de banco

## 🔒 Segurança

- JWT para autenticação
- Senhas criptografadas
- CORS configurado
- Validação de dados

## 📊 Monitoramento

- HAProxy Stats: http://127.0.0.1:8404/stats
- phpMyAdmin: http://127.0.0.1:8080
- Logs dos pods via kubectl

## 🚀 Próximos Passos

1. Configurar ingress para produção
2. Implementar SSL/TLS
3. Adicionar métricas com Prometheus
4. Configurar backup automático do banco
5. Implementar CI/CD






