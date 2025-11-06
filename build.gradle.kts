import org.gradle.api.tasks.Exec

plugins {
    java
}

// プロジェクトの基本情報
group = "com.jobassistance"
version = "1.0.0"

// リポジトリ設定
repositories {
    mavenCentral()
}

// Node.jsタスク
tasks.register<Exec>("npmInstall") {
    description = "Install npm dependencies"
    group = "node"
    workingDir = projectDir
    commandLine("npm", "install")
}

tasks.register<Exec>("npmBuild") {
    description = "Build Next.js application"
    group = "node"
    workingDir = projectDir
    commandLine("npm", "run", "build")
    dependsOn("npmInstall")
}

tasks.register<Exec>("npmDev") {
    description = "Run Next.js development server"
    group = "node"
    workingDir = projectDir
    commandLine("npm", "run", "dev")
    dependsOn("npmInstall")
}

tasks.register<Exec>("npmTest") {
    description = "Run tests with Vitest"
    group = "node"
    workingDir = projectDir
    commandLine("npm", "run", "test")
    dependsOn("npmInstall")
}

// Pythonタスク
tasks.register<Exec>("pipInstall") {
    description = "Install Python dependencies"
    group = "python"
    workingDir = projectDir
    commandLine("pip", "install", "-r", "requirements.txt")
}

tasks.register<Exec>("pythonRunApi") {
    description = "Run Flask API server"
    group = "python"
    workingDir = projectDir
    commandLine("python", "-m", "src.api")
    dependsOn("pipInstall")
}

tasks.register<Exec>("pythonInitDb") {
    description = "Initialize database"
    group = "python"
    workingDir = projectDir
    commandLine("python", "-m", "src.database")
    dependsOn("pipInstall")
}

// 統合タスク
tasks.register("setup") {
    description = "Setup project (install all dependencies)"
    group = "setup"
    dependsOn("npmInstall", "pipInstall")
}

tasks.register("build") {
    description = "Build entire project"
    group = "build"
    dependsOn("npmBuild")
}

tasks.register("run") {
    description = "Run both frontend and backend"
    group = "application"
    dependsOn("pythonRunApi", "npmDev")
}

// デフォルトタスク
defaultTasks("setup")

