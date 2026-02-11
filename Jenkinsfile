pipeline {
    agent any

    environment {
        APP_NAME = 'portfolio-web'
        DEPLOY_DIR = '/home/deploy/portfolio-web'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                sh "docker build -t ${APP_NAME}:${BUILD_NUMBER} -t ${APP_NAME}:latest ."
            }
        }

        stage('Deploy') {
            steps {
                sh """
                    cp docker-compose.yml ${DEPLOY_DIR}/docker-compose.yml
                    cd ${DEPLOY_DIR}
                    docker compose up -d --no-build
                """
            }
        }

        stage('Health Check') {
            steps {
                retry(3) {
                    sleep(time: 5, unit: 'SECONDS')
                    sh 'curl -sf http://localhost:3000 > /dev/null'
                }
            }
        }

        stage('Cleanup') {
            steps {
                sh 'docker image prune -f'
            }
        }
    }

    post {
        failure {
            sh "cd ${DEPLOY_DIR} && docker compose logs --tail=50 app"
        }
    }
}
