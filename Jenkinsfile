pipeline {
    agent { label 'dev' }

    parameters {
        string(
            name: 'IMAGE_NAMESPACE',
            defaultValue: 'YOUR_DOCKERHUB_USERNAME',
            description: 'Docker Hub username'
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

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Validate Configuration') {
            steps {
                sh '''
                    set -e

                    if [ -z "$IMAGE_NAMESPACE" ]; then
                        echo "ERROR: IMAGE_NAMESPACE is empty"
                        exit 1
                    fi

                    if [ -z "$MYSQL_DATABASE" ]; then
                        echo "ERROR: MYSQL_DATABASE is empty"
                        exit 1
                    fi

                    if [ -z "$MYSQL_USER" ]; then
                        echo "ERROR: MYSQL_USER is empty"
                        exit 1
                    fi

                    echo "Docker Registry : $DOCKER_REGISTRY"
                    echo "Docker Namespace: $IMAGE_NAMESPACE"
                    echo "Image Tag       : $IMAGE_TAG"
                    echo "MySQL Database  : $MYSQL_DATABASE"
                    echo "MySQL User      : $MYSQL_USER"
                '''
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

                        echo "Logging in to Docker Hub..."

                        echo "$DOCKER_PASSWORD" | docker login \
                            "$DOCKER_REGISTRY" \
                            --username "$DOCKER_USER" \
                            --password-stdin

                        echo "Pushing backend..."

                        docker tag \
                            "${IMAGE_NAMESPACE}/task-backend:${IMAGE_TAG}" \
                            "${DOCKER_REGISTRY}/${IMAGE_NAMESPACE}/task-backend:${IMAGE_TAG}"

                        docker push \
                            "${DOCKER_REGISTRY}/${IMAGE_NAMESPACE}/task-backend:${IMAGE_TAG}"

                        echo "Pushing frontend..."

                        docker tag \
                            "${IMAGE_NAMESPACE}/task-frontend:${IMAGE_TAG}" \
                            "${DOCKER_REGISTRY}/${IMAGE_NAMESPACE}/task-frontend:${IMAGE_TAG}"

                        docker push \
                            "${DOCKER_REGISTRY}/${IMAGE_NAMESPACE}/task-frontend:${IMAGE_TAG}"

                        docker logout "$DOCKER_REGISTRY"

                        echo "Docker images pushed successfully."
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
                        set -e

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

    post {
        success {
            echo 'CI/CD pipeline completed successfully.'
        }

        failure {
            echo 'CI/CD pipeline failed. Check the failed stage above.'
        }
    }
}