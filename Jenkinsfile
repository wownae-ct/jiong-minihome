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
                sh "sed -i '/^#/d; /^[[:space:]]*$/d' .env.production"
            }
        }

        stage('Build Image') {
            steps {
                sh 'docker compose build'
                sh "docker tag ${APP_NAME}:latest ${APP_NAME}:${BUILD_NUMBER}"
            }
        }

        stage('Deploy') {
            steps {
                sh """
                    docker stop ${CONTAINER_NAME} 2>/dev/null || true
                    docker rm ${CONTAINER_NAME} 2>/dev/null || true
                    docker compose up -d
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
            sh 'docker image prune -af --filter "until=24h"'
            sh 'docker builder prune -af --filter "until=24h"'
        }
    }
}
