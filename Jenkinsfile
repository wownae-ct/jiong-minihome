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
        APP_NAME     = 'portfolio-web'
        ECR_REGISTRY = credentials('ecr-registry')
        ECR_REPO     = 'portfolio-web'
        REGION       = 'ap-northeast-2'
        INFRA_REPO   = 'git@github.com:wownae-ct/infra-repo.git'
        IMAGE_TAG    = "${BUILD_NUMBER}"
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

        stage('Build & Push (kaniko)') {
            steps {
                container('kaniko') {
                    sh """
                        /kaniko/executor \
                          --context=dir://${WORKSPACE} \
                          --dockerfile=${WORKSPACE}/Dockerfile \
                          --destination=${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG} \
                          --destination=${ECR_REGISTRY}/${ECR_REPO}:latest \
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
            }
        }
    }

    post {
        success {
            echo "✅ Build ${IMAGE_TAG} pushed to ECR and infra-repo updated."
        }
        failure {
            echo "❌ Build failed."
        }
        always {
            container('git') {
                sh 'chmod -R 777 ${WORKSPACE}/infra-repo || true'
            }
            deleteDir()
        }
    }
}
