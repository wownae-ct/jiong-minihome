// CI/CD Pipeline for portfolio-web
pipeline {
    agent any

    options {
        disableConcurrentBuilds(abortPrevious: true)
        buildDiscarder(logRotator(numToKeepStr: '10', daysToKeepStr: '30'))
        timeout(time: 15, unit: 'MINUTES')
    }

    environment {
        APP_NAME = 'portfolio-web'
        DOCKER_BUILDKIT = '1'
        KEEP_IMAGES = '3'
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
                script {
                    def currentContainer = sh(
                        script: "docker ps -q --filter name=portfolio-web-app",
                        returnStdout: true
                    ).trim()

                    if (currentContainer) {
                        // 새 컨테이너를 임시 포트(3001)에서 사전 검증
                        sh """
                            docker run -d \
                                --name portfolio-web-new \
                                --env-file .env.production \
                                -p 3001:3000 \
                                ${APP_NAME}:${BUILD_NUMBER}
                        """

                        retry(5) {
                            sleep(time: 5, unit: 'SECONDS')
                            sh 'docker exec portfolio-web-new wget -qO /dev/null http://127.0.0.1:3000'
                        }

                        // 검증 통과 → 교체
                        sh '''
                            docker stop portfolio-web-new && docker rm portfolio-web-new
                            docker compose down --remove-orphans 2>/dev/null || true
                            docker ps -q --filter "publish=3000" | xargs -r docker stop
                            docker ps -aq --filter "publish=3000" | xargs -r docker rm
                            docker compose up -d
                        '''
                    } else {
                        // 첫 배포 또는 기존 컨테이너 없음
                        sh '''
                            docker compose down --remove-orphans 2>/dev/null || true
                            docker ps -q --filter "publish=3000" | xargs -r docker stop
                            docker ps -aq --filter "publish=3000" | xargs -r docker rm
                            docker compose up -d
                        '''
                    }
                }
            }
        }

        stage('Health Check') {
            steps {
                retry(5) {
                    sleep(time: 5, unit: 'SECONDS')
                    sh 'docker exec portfolio-web-app wget -qO /dev/null http://127.0.0.1:3000'
                }
            }
        }
    }

    post {
        failure {
            echo 'Build failed. Checking docker logs...'
            sh 'docker compose logs --tail 50 || true'

            // 자동 롤백: 실행 중인 컨테이너가 없으면 이전 빌드로 복구
            script {
                try {
                    def running = sh(
                        script: "docker ps -q --filter name=portfolio-web-app",
                        returnStdout: true
                    ).trim()

                    if (!running) {
                        def prevBuild = "${BUILD_NUMBER.toInteger() - 1}"
                        def prevImage = sh(
                            script: "docker images -q ${APP_NAME}:${prevBuild}",
                            returnStdout: true
                        ).trim()

                        if (prevImage) {
                            echo "Attempting rollback to ${APP_NAME}:${prevBuild}"
                            sh "docker tag ${APP_NAME}:${prevBuild} ${APP_NAME}:latest"
                            sh 'docker compose up -d'
                        }
                    }
                } catch (Exception e) {
                    echo "Rollback attempt failed: ${e.message}"
                }
            }
        }

        always {
            // 사전 검증 실패 시 남은 임시 컨테이너 정리
            sh 'docker rm -f portfolio-web-new 2>/dev/null || true'

            // 디스크 사용량 리포트
            sh 'echo "=== Docker Disk Usage ===" && docker system df'
            sh 'echo "=== Host Disk Usage ===" && df -h / | tail -1'

            // 최근 N개 빌드 이미지만 보존, 나머지 삭제
            sh """
                KEEP=${KEEP_IMAGES}
                IMAGES=\$(docker images --format "{{.Tag}}" "${APP_NAME}" \
                    | grep -E "^[0-9]+\$" \
                    | sort -n -r)

                COUNT=0
                for TAG in \$IMAGES; do
                    COUNT=\$((COUNT + 1))
                    if [ "\$COUNT" -gt "\$KEEP" ]; then
                        echo "Removing ${APP_NAME}:\${TAG}"
                        docker rmi "${APP_NAME}:\${TAG}" 2>/dev/null || true
                    else
                        echo "Keeping ${APP_NAME}:\${TAG} (slot \${COUNT}/\${KEEP})"
                    fi
                done
            """

            // 댕글링 이미지 제거
            sh 'docker image prune -f 2>/dev/null || true'

            // BuildKit 캐시 2GB 상한
            sh 'docker builder prune --force --keep-storage 2gb 2>/dev/null || true'

            // Jenkins 워크스페이스 정리 (Workspace Cleanup 플러그인 필요)
            script {
                try {
                    cleanWs(
                        cleanWhenNotBuilt: false,
                        deleteDirs: true,
                        disableDeferredWipeout: true,
                        notFailBuild: true
                    )
                } catch (Exception e) {
                    echo "cleanWs not available: ${e.message}"
                }
            }
        }
    }
}
