pipeline {
    agent any

    environment {
        DEPLOYMENT_ENVIRONMENT = 'development'
    }

    options {
        skipDefaultCheckout(true)
    }

    stages {
        stage('Check PRD Approval') {
            when {
                expression { 
                    return env.BRANCH_NAME == 'main' && (env.CHANGE_ID != null && env.CHANGE_STATUS == 'approved')
                }
            }
            steps {
                echo "Merge aprovado na branch 'main'. PRD aprovada e pipeline iniciada."
            }
        }

        stage('Build & Deploy') {
            when {
                expression { 
                    return env.BRANCH_NAME == 'main' && (env.CHANGE_ID != null && env.CHANGE_STATUS == 'approved')
                }
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
