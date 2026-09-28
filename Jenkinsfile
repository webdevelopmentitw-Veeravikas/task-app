pipeline {
    agent { label 'dev' }

    parameters {
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
        // Docker Hub
        DOCKER_REGISTRY = 'docker.io'
        IMAGE_NAMESPACE = 'veeravikas'

        // Jenkins build number
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {

        // =========================================================
        // 1. CHECKOUT
        // =========================================================

        stage('Checkout') {
            steps {
                echo 'Checking out source code...'

                checkout scm
            }
        }

        // =========================================================
        // 2. INSTALL DEPENDENCIES
        // =========================================================

        stage('Install Dependencies') {
            steps {

                echo 'Installing backend dependencies...'

                dir('backend') {
                    sh 'npm ci'
                }

                echo 'Installing frontend dependencies...'

                dir('frontend') {
                    sh 'npm ci'
                }
            }
        }

        // =========================================================
        // 3. TEST
        // =========================================================

        stage('Test') {
            steps {

                echo 'Running backend tests...'

                dir('backend') {
                    sh 'npm test'
                }

                echo 'Running frontend tests...'

                dir('frontend') {
                    sh 'npm test'
                }
            }
        }

        // =========================================================
        // 4. FRONTEND BUILD
        // =========================================================

        stage('Build Frontend') {
            steps {

                echo 'Building frontend application...'

                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        // =========================================================
        // 5. VALIDATE CONFIGURATION
        // =========================================================

        stage('Validate Configuration') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "Pipeline Configuration"
                    echo "======================================"

                    echo "Docker Registry : $DOCKER_REGISTRY"
                    echo "Docker Namespace: $IMAGE_NAMESPACE"
                    echo "Image Tag       : $IMAGE_TAG"
                    echo "MySQL Database  : $MYSQL_DATABASE"
                    echo "MySQL User      : $MYSQL_USER"

                    echo "======================================"

                    if [ -z "$IMAGE_NAMESPACE" ]; then
                        echo "ERROR: IMAGE_NAMESPACE is empty"
                        exit 1
                    fi

                    if [ -z "$IMAGE_TAG" ]; then
                        echo "ERROR: IMAGE_TAG is empty"
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

                    echo "Configuration validation successful."
                '''
            }
        }

        // =========================================================
        // 6. DOCKER BUILD
        // =========================================================

        stage('Docker Build') {
            steps {

                echo 'Building backend Docker image...'

                sh '''
                    docker build \
                        -t "${IMAGE_NAMESPACE}/task-backend:${IMAGE_TAG}" \
                        ./backend
                '''

                echo 'Building frontend Docker image...'

                sh '''
                    docker build \
                        -t "${IMAGE_NAMESPACE}/task-frontend:${IMAGE_TAG}" \
                        ./frontend
                '''

                echo 'Docker images created successfully.'

                sh '''
                    docker images | grep "${IMAGE_NAMESPACE}/task-"
                '''
            }
        }

        // =========================================================
        // 7. DOCKER HUB LOGIN + PUSH
        // =========================================================

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

                        echo "======================================"
                        echo "Docker Hub Login"
                        echo "======================================"

                        echo "$DOCKER_PASSWORD" | docker login \
                            "$DOCKER_REGISTRY" \
                            --username "$DOCKER_USER" \
                            --password-stdin

                        echo "Docker login successful."

                        echo "======================================"
                        echo "Tagging Backend"
                        echo "======================================"

                        docker tag \
                            "${IMAGE_NAMESPACE}/task-backend:${IMAGE_TAG}" \
                            "${DOCKER_REGISTRY}/${IMAGE_NAMESPACE}/task-backend:${IMAGE_TAG}"

                        echo "======================================"
                        echo "Tagging Frontend"
                        echo "======================================"

                        docker tag \
                            "${IMAGE_NAMESPACE}/task-frontend:${IMAGE_TAG}" \
                            "${DOCKER_REGISTRY}/${IMAGE_NAMESPACE}/task-frontend:${IMAGE_TAG}"

                        echo "======================================"
                        echo "Pushing Backend"
                        echo "======================================"

                        docker push \
                            "${DOCKER_REGISTRY}/${IMAGE_NAMESPACE}/task-backend:${IMAGE_TAG}"

                        echo "======================================"
                        echo "Pushing Frontend"
                        echo "======================================"

                        docker push \
                            "${DOCKER_REGISTRY}/${IMAGE_NAMESPACE}/task-frontend:${IMAGE_TAG}"

                        echo "======================================"
                        echo "Docker Push Completed"
                        echo "======================================"

                        docker logout "$DOCKER_REGISTRY"
                    '''
                }
            }
        }

        // =========================================================
        // 8. DEPLOY
        // =========================================================

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

                        echo "======================================"
                        echo "Deploying Application"
                        echo "======================================"

                        export MYSQL_DATABASE="$MYSQL_DATABASE"
                        export MYSQL_USER="$MYSQL_USER"
                        export MYSQL_ROOT_PASSWORD="$MYSQL_ROOT_PASSWORD"
                        export MYSQL_PASSWORD="$MYSQL_PASSWORD"

                        docker compose up -d --build

                        echo "======================================"
                        echo "Deployment Completed"
                        echo "======================================"

                        docker compose ps
                    '''
                }
            }
        }
    }

    // =============================================================
    // POST ACTIONS
    // =============================================================

    post {

        success {
            echo '''
            ======================================
            CI/CD PIPELINE SUCCESS
            ======================================
            '''
        }

        failure {
            echo '''
            ======================================
            CI/CD PIPELINE FAILED
            ======================================
            Check the failed stage in the Jenkins console output.
            '''
        }

        always {
            echo "Pipeline completed: ${currentBuild.currentResult}"
        }
    }
}