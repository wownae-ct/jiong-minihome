pipeline {
    agent any

    options {
        disableConcurrentBuilds(abortPrevious: true)
    }

    environment {
        APP_NAME = 'portfolio-web'
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
                sh 'docker compose up -d --no-build'
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
            sh 'docker compose logs --tail=50 || true'
        }
        always {
            sh 'docker image prune -f'
        }
    }
}
