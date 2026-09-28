// Practice pipeline for the task app.
// Set DOCKER_REGISTRY on the Jenkins job (for example registry.example.com).
// Create these Jenkins credentials; the pipeline never stores secret values:
//   docker-registry       username/password for the registry
//   mysql-root-password   secret text
//   mysql-app-password    secret text
// Optional job environment: MYSQL_DATABASE, MYSQL_USER, IMAGE_NAMESPACE

pipeline {
    agent {label 'dev'}

    environment {
        IMAGE_NAMESPACE = "${env.IMAGE_NAMESPACE ?: 'task-app'}"
        IMAGE_TAG = "${env.BUILD_NUMBER ?: 'latest'}"
        MYSQL_DATABASE = "${env.MYSQL_DATABASE ?: 'taskdb'}"
        MYSQL_USER = "${env.MYSQL_USER ?: 'taskuser'}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                }
                dir('frontend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Test') {
            steps {
                dir('backend') {
                    sh 'npm test'
                }
                dir('frontend') {
                    sh 'npm test'
                }
            }
        }

        stage('Build') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t ${IMAGE_NAMESPACE}/task-backend:${IMAGE_TAG} ./backend'
                sh 'docker build -t ${IMAGE_NAMESPACE}/task-frontend:${IMAGE_TAG} ./frontend'
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-registry',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASSWORD'
                )]) {
                    sh '''
                        if [ -z "$DOCKER_REGISTRY" ]; then
                          echo "DOCKER_REGISTRY must be set to push images."
                          exit 1
                        fi
                        echo "$DOCKER_PASSWORD" | docker login "$DOCKER_REGISTRY" -u "$DOCKER_USER" --password-stdin
                        docker tag "${IMAGE_NAMESPACE}/task-backend:${IMAGE_TAG}" "${DOCKER_REGISTRY}/${IMAGE_NAMESPACE}/task-backend:${IMAGE_TAG}"
                        docker tag "${IMAGE_NAMESPACE}/task-frontend:${IMAGE_TAG}" "${DOCKER_REGISTRY}/${IMAGE_NAMESPACE}/task-frontend:${IMAGE_TAG}"
                        docker push "${DOCKER_REGISTRY}/${IMAGE_NAMESPACE}/task-backend:${IMAGE_TAG}"
                        docker push "${DOCKER_REGISTRY}/${IMAGE_NAMESPACE}/task-frontend:${IMAGE_TAG}"
                        docker logout "$DOCKER_REGISTRY"
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([
                    string(credentialsId: 'mysql-root-password', variable: 'MYSQL_ROOT_PASSWORD'),
                    string(credentialsId: 'mysql-app-password', variable: 'MYSQL_PASSWORD')
                ]) {
                    sh 'docker compose up -d --build'
                }
            }
        }
    }
}
