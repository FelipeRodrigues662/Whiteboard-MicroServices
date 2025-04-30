pipeline {
    agent any

    environment {
        // Exemplo de ambiente que o Jira espera
        DEPLOYMENT_ENVIRONMENT = 'development'  // ou 'production', 'staging', etc
    }

    stages {
        stage('build') {
            steps {
                script {
                    echo "Building branch ${env.BRANCH_NAME}"

                    // Envia informações de build para o Jira
                    jiraSendBuildInfo site: 'JiraSiteName', buildNumber: env.BUILD_NUMBER, branch: env.BRANCH_NAME

                    // Envia informações de deployment para o Jira
                    jiraSendDeploymentInfo site: 'JiraSiteName',
                                            environmentId: env.DEPLOYMENT_ENVIRONMENT,
                                            environmentName: env.DEPLOYMENT_ENVIRONMENT,
                                            environmentType: 'development', // ou 'production', 'staging'
                                            state: 'successful' // ou 'failed'
                }
            }
        }
    }
}
