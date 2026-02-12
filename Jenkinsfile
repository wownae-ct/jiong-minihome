// CI/CD Pipeline for portfolio-web
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
                sh '''sed -i '/^#/d; /^[[:space:]]*$/d' .env.production'''
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
                sh '''
                    docker compose down --remove-orphans 2>/dev/null || true
                    docker ps -q --filter "publish=3000" | xargs -r docker stop
                    docker ps -aq --filter "publish=3000" | xargs -r docker rm
                    docker compose up -d
                '''
            }
        }

        stage('Health Check') {
            steps {
                sleep(time: 10, unit: 'SECONDS')
                sh '''
                    echo "=== Container Status ==="
                    docker inspect portfolio-web-app --format="Status={{.State.Status}} Running={{.State.Running}} Pid={{.State.Pid}} RestartCount={{.RestartCount}}" || true
                    echo "=== Port Listening ==="
                    docker exec portfolio-web-app sh -c "netstat -tlnp 2>/dev/null || ss -tlnp 2>/dev/null || cat /proc/net/tcp 2>/dev/null" || true
                    echo "=== Container Logs ==="
                    docker logs portfolio-web-app 2>&1 || true
                    echo "=== Connectivity Test ==="
                    docker exec portfolio-web-app wget -qO /dev/null http://127.0.0.1:3000
                '''
            }
        }
    }

    post {
        failure {
            echo 'Build failed. Checking docker logs...'
            sh 'docker compose logs --tail 50 || true'
        }
        always {
            sh 'docker image prune -af --filter "until=24h"'
            sh 'docker builder prune -af --filter "until=24h"'
        }
    }
}
