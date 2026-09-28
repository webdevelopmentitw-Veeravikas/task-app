pipeline {
    agent { label 'dev' }

    parameters {
        string(
            name: 'IMAGE_NAMESPACE',
            defaultValue: 'task-app',
            description: 'Docker Hub username or organization'
        )

        string(
            name: 'MYSQL_DATABASE',
            defaultValue: 'taskdb',
            description: 'MySQL database name'
        )

        string(
            name: 'MYSQL_USER',
            defaultValue: 'taskuser',
            description: 'MySQL application username'
        )
    }

    environment {
        DOCKER_REGISTRY = 'docker.io'
        IMAGE_TAG = "${BUILD_NUMBER}"
        DOCKER_CREDENTIALS_ID = 'docker-registry'
    }

    stages {

        stage('Show Configuration') {
            steps {
                sh '''
                    echo "Docker Registry: $DOCKER_REGISTRY"
                    echo "Image Namespace: $IMAGE_NAMESPACE"
                    echo "Image Tag: $IMAGE_TAG"
                    echo "Database: $MYSQL_DATABASE"
                    echo "MySQL User: $MYSQL_USER"
                '''
            }
        }

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
                sh '''
                    docker build \
                        -t "${IMAGE_NAMESPACE}/task-backend:${IMAGE_TAG}" \
                        ./backend

                    docker build \
                        -t "${IMAGE_NAMESPACE}/task-frontend:${IMAGE_TAG}" \
                        ./frontend
                '''
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'docker-registry',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {
                    sh '''
                        set -e

                        echo "$DOCKER_PASSWORD" | docker login \
                            "$DOCKER_REGISTRY" \
                            -u "$DOCKER_USER" \
                            --password-stdin

                        docker tag \
                            "${IMAGE_NAMESPACE}/task-backend:${IMAGE_TAG}" \
                            "${DOCKER_REGISTRY}/${IMAGE_NAMESPACE}/task-backend:${IMAGE_TAG}"

                        docker tag \
                            "${IMAGE_NAMESPACE}/task-frontend:${IMAGE_TAG}" \
                            "${DOCKER_REGISTRY}/${IMAGE_NAMESPACE}/task-frontend:${IMAGE_TAG}"

                        docker push \
                            "${DOCKER_REGISTRY}/${IMAGE_NAMESPACE}/task-backend:${IMAGE_TAG}"

                        docker push \
                            "${DOCKER_REGISTRY}/${IMAGE_NAMESPACE}/task-frontend:${IMAGE_TAG}"

                        docker logout "$DOCKER_REGISTRY"
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'mysql-root-password',
                        variable: 'MYSQL_ROOT_PASSWORD'
                    ),
                    string(
                        credentialsId: 'mysql-app-password',
                        variable: 'MYSQL_PASSWORD'
                    )
                ]) {
                    sh '''
                        export MYSQL_DATABASE="$MYSQL_DATABASE"
                        export MYSQL_USER="$MYSQL_USER"
                        export MYSQL_ROOT_PASSWORD="$MYSQL_ROOT_PASSWORD"
                        export MYSQL_PASSWORD="$MYSQL_PASSWORD"

                        docker compose up -d --build
                    '''
                }
            }
        }
    }
}