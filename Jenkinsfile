// CI/CD Pipeline for portfolio-web (K8s GitOps)
pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
spec:
  serviceAccountName: jenkins
  containers:
  - name: aws-cli
    image: amazon/aws-cli:latest
    command: [sleep]
    args: ["9999999"]
    volumeMounts:
    - name: docker-config
      mountPath: /root/.docker
  - name: kaniko
    image: gcr.io/kaniko-project/executor:debug
    command: [sleep]
    args: ["9999999"]
    volumeMounts:
    - name: docker-config
      mountPath: /kaniko/.docker
  - name: git
    image: alpine/git:latest
    command: [sleep]
    args: ["9999999"]
  - name: kubectl
    image: bitnami/kubectl:latest
    command: [sleep]
    args: ["9999999"]
    tty: true
  volumes:
  - name: docker-config
    emptyDir: {}
"""
        }
    }

    options {
        disableConcurrentBuilds(abortPrevious: true)
        buildDiscarder(logRotator(numToKeepStr: '10', daysToKeepStr: '30'))
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        APP_NAME             = 'portfolio-web'
        ECR_REGISTRY         = credentials('ecr-registry')
        ECR_REPO             = 'portfolio-web'
        REGION               = 'ap-northeast-2'
        INFRA_REPO           = 'git@github.com:wownae-ct/infra-repo.git'
        IMAGE_TAG            = "${BUILD_NUMBER}"
        MINIO_IMAGE_HOSTNAME = 'jiun2.ddns.net'
        MINIO_PUBLIC_URL     = 'http://jiun2.ddns.net/s3'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('ECR Login') {
            steps {
                container('aws-cli') {
                    withCredentials([[
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'aws-ecr-credentials',
                        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                    ]]) {
                        sh """
                            ECR_PASSWORD=\$(aws ecr get-login-password --region ${REGION})
                            mkdir -p /root/.docker
                            echo '{"auths":{"${ECR_REGISTRY}":{"auth":"'"\$(echo -n AWS:\${ECR_PASSWORD} | base64 -w 0)"'"}}}' > /root/.docker/config.json

                            # ECR cache 레포 없으면 자동 생성
                            aws ecr describe-repositories \
                              --repository-names ${ECR_REPO}/cache \
                              --region ${REGION} 2>/dev/null || \
                            aws ecr create-repository \
                              --repository-name ${ECR_REPO}/cache \
                              --region ${REGION}
                        """
                    }
                }
            }
        }
	
        stage('Update ECR Secret') {
            steps {
                container('aws-cli') {
                    withCredentials([[
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'aws-ecr-credentials',
                        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                    ]]) {
                        sh """
                            aws ecr get-login-password --region ${REGION} > ${WORKSPACE}/.ecr-password
                        """
                    }
                }
                container('kubectl') {
                    sh """
                        kubectl create secret docker-registry ecr-credentials \
                          --namespace=portfolio-web \
                          --docker-server=${ECR_REGISTRY} \
                          --docker-username=AWS \
                          --docker-password=\$(cat ${WORKSPACE}/.ecr-password) \
                          --dry-run=client -o yaml | kubectl apply -f -
                    """
                }
            }
        }

        stage('Build & Push (kaniko)') {
            steps {
                container('kaniko') {
                    sh """
                        /kaniko/executor \
                          --context=dir://${WORKSPACE} \
                          --dockerfile=${WORKSPACE}/Dockerfile \
                          --destination=${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG} \
                          --destination=${ECR_REGISTRY}/${ECR_REPO}:latest \
                          --build-arg MINIO_IMAGE_HOSTNAME=${MINIO_IMAGE_HOSTNAME} \
                          --build-arg MINIO_PUBLIC_URL=${MINIO_PUBLIC_URL} \
                          --cache=true \
                          --cache-repo=${ECR_REGISTRY}/${ECR_REPO}/cache
                    """
                }
            }
        }

        stage('Update Infra Repo') {
            steps {
                container('git') {
                    withCredentials([sshUserPrivateKey(
                        credentialsId: 'github-infra-ssh',
                        keyFileVariable: 'SSH_KEY'
                    )]) {
                        sh """
                            mkdir -p ~/.ssh
                            cp \${SSH_KEY} ~/.ssh/id_rsa
                            chmod 600 ~/.ssh/id_rsa
                            ssh-keyscan github.com >> ~/.ssh/known_hosts

                            git clone ${INFRA_REPO} infra-repo
                            cd infra-repo

                            sed -i 's|repository:.*|repository: ${ECR_REGISTRY}/${ECR_REPO}|' apps/portfolio-web/values.yaml
                            sed -i 's|tag:.*|tag: "${IMAGE_TAG}"|' apps/portfolio-web/values.yaml

                            git config user.email "jenkins@k8s.local"
                            git config user.name "Jenkins"
                            git add apps/portfolio-web/values.yaml
                            git commit -m "ci: update portfolio-web image tag to ${IMAGE_TAG}"
                            git push origin master
                        """
                    }
                }
                sh "touch ${WORKSPACE}/.infra-updated"
            }
        }

        stage('Health Check') {
            steps {
                container('kubectl') {
                    sh """
                        echo "Waiting for ArgoCD to sync new image tag..."
                        TIMEOUT=180
                        ELAPSED=0
                        while [ \$ELAPSED -lt \$TIMEOUT ]; do
                            CURRENT_IMAGE=\$(kubectl get deployment portfolio-web -n portfolio-web -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "")
                            CURRENT_TAG=\$(echo "\$CURRENT_IMAGE" | grep -o '[^:]*\$' || echo "")
                            if [ "\$CURRENT_TAG" = "${IMAGE_TAG}" ]; then
                                echo "New image tag detected: \$CURRENT_TAG"
                                break
                            fi
                            echo "Waiting... (current: \$CURRENT_TAG, expected: ${IMAGE_TAG}, \${ELAPSED}s/\${TIMEOUT}s)"
                            sleep 10
                            ELAPSED=\$((ELAPSED + 10))
                        done

                        if [ "\$CURRENT_TAG" != "${IMAGE_TAG}" ]; then
                            echo "ERROR: ArgoCD sync timeout. Image tag not updated within \${TIMEOUT}s"
                            echo "Current image: \$CURRENT_IMAGE"
                            echo "Expected tag: ${IMAGE_TAG}"
                            echo "Check: kubectl get deployment portfolio-web -n portfolio-web -o jsonpath='{.spec.template.spec.containers[0].image}'"
                            echo "Check: argocd app get portfolio-web"
                            exit 1
                        fi

                        echo "Checking rollout status..."
                        kubectl rollout status deployment/portfolio-web -n portfolio-web --timeout=120s
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Build ${IMAGE_TAG} deployed and health check passed."
        }
        failure {
            script {
                if (fileExists('.infra-updated')) {
                    echo "❌ Health check failed. Rolling back infra-repo..."
                    container('git') {
                        withCredentials([sshUserPrivateKey(
                            credentialsId: 'github-infra-ssh',
                            keyFileVariable: 'SSH_KEY'
                        )]) {
                            sh """
                                mkdir -p ~/.ssh
                                cp \${SSH_KEY} ~/.ssh/id_rsa
                                chmod 600 ~/.ssh/id_rsa
                                ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null

                                rm -rf infra-repo-rollback
                                git clone ${INFRA_REPO} infra-repo-rollback
                                cd infra-repo-rollback
                                git config user.email "jenkins@k8s.local"
                                git config user.name "Jenkins"
                                git revert HEAD --no-edit
                                git push origin master
                            """
                        }
                    }
                    echo "✅ Rollback commit pushed. ArgoCD will sync to previous version."
                } else {
                    echo "❌ Build failed (before infra-repo update). No rollback needed."
                }
            }
        }
        always {
            container('git') {
                sh """
                    chmod -R 777 ${WORKSPACE}/infra-repo || true
                    chmod -R 777 ${WORKSPACE}/infra-repo-rollback || true
                """
            }
            deleteDir()
        }
    }
}
