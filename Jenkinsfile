pipeline {
    agent any

    environment {
        DEPLOYMENT_ENVIRONMENT = 'development'  
    }

    options {
        skipDefaultCheckout(true)
    }

    triggers {
        githubPush() 
    }

    stages {
        stage('Check Branch') {
            when {
                expression { return env.BRANCH_NAME == 'main' } 
            }
            steps {
                echo "Merge detectado em branch ${env.BRANCH_NAME}, iniciando pipeline..."
            }
        }

        stage('Build & Deploy') {
            when {
                expression { return env.BRANCH_NAME == 'main' }
            }
            steps {
                script {
                    echo "Building branch ${env.BRANCH_NAME}"

                    jiraSendBuildInfo site: 'JiraSiteName', buildNumber: env.BUILD_NUMBER, branch: env.BRANCH_NAME

                    jiraSendDeploymentInfo site: 'JiraSiteName',
                                            environmentId: env.DEPLOYMENT_ENVIRONMENT,
                                            environmentName: env.DEPLOYMENT_ENVIRONMENT,
                                            environmentType: 'development',
                                            state: 'successful'
                }
            }
        }
    }
}
