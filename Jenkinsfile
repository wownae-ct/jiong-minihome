// CI/CD Pipeline for portfolio-web
pipeline {
    agent any

    options {
        disableConcurrentBuilds(abortPrevious: true)
    }

    environment {
        APP_NAME = 'portfolio-web'
        CONTAINER_NAME = 'portfolio-web-app'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Prepare') {
            steps {
                sh 'cp /opt/env/.env.production .env.production'
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
                    docker stop ${CONTAINER_NAME} 2>/dev/null || true
                    docker rm ${CONTAINER_NAME} 2>/dev/null || true
                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        --restart unless-stopped \
                        -p 3000:3000 \
                        --env-file .env.production \
                        -v uploads_data:/app/public/uploads \
                        ${APP_NAME}:latest
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
    }

    post {
        failure {
            echo 'Build failed. Checking docker logs...'
            sh "docker logs ${CONTAINER_NAME} --tail 50 || true"
        }
        always {
            sh 'docker image prune -f'
        }
    }
}
