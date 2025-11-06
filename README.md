# job_assistance

外国人向け就労支援システム  
外国人就労者の属性管理と進捗管理機能を提供する、現代的で斬新なデザインのWebアプリケーションです。

## 特長

- 🌍 **多言語対応** - 日本語、英語、中国語、ベトナム語に対応
- 👥 **就労者属性管理** - 国籍、在留資格、日本語レベルなど詳細な属性管理
- 📊 **進捗管理** - 面談、研修、就労支援の進捗を詳細に記録・管理
- 🇯🇵 **日本語能力管理** - JLPT、JFT-Basic、BJTなどの試験結果と4技能スコア管理
- 🎓 **日本語学習記録** - 学習内容、学習時間、単語数、文法項目の詳細管理
- 🔧 **技能訓練管理** - 建設、製造、介護、農業、外食などの技能訓練プログラム管理
- 📈 **技能訓練記録** - 訓練内容、進捗率、指導者フィードバック、自己評価の管理
- ✈️ **来日前支援** - ビザ申請、契約書確認、事前研修などの来日前支援管理
- 📄 **ドキュメント管理** - 履歴書、在留資格証明書、パスポートなどの書類管理
- 🔔 **通知・リマインダー** - 重要な予定や期限の通知機能
- 🎓 **研修・トレーニング管理** - 研修プログラムの管理と受講状況の追跡
- 📅 **カレンダー機能** - イベント、面談、研修などのスケジュール管理
- ⭐ **評価・フィードバック** - 就労者への定期的な評価とフィードバック
- 💬 **メッセージング** - スタッフと就労者間のコミュニケーション
- 🎨 **現代的UI** - グラスモーフィズム、グラデーション、アニメーションを活用した斬新なデザイン
- 🔄 **RESTful API** - FlaskベースのRESTful API
- 🗄️ **PostgreSQL対応** - 本番環境対応のデータベース
- 🐳 **Docker統合** - コンテナ化による簡単な環境構築
- 🛠️ **Gradle統合** - フロントエンド・バックエンドを統合管理

## 技術スタック

### フロントエンド
- **Next.js 16** - Reactフレームワーク
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - ユーティリティファーストのCSS
- **React i18next** - 多言語対応
- **Vitest** - テストフレームワーク
- **Vite** - 高速ビルドツール

### バックエンド
- **Python 3.8+** - プログラミング言語
- **Flask** - Webフレームワーク
- **SQLAlchemy** - ORM
- **PostgreSQL** - データベース

### ビルドツール
- **Gradle** - 統合ビルドツール

## セットアップ

### 前提条件

#### Dockerを使用する場合（推奨）
- **Docker** 20.10以上
- **Docker Compose** 2.0以上

#### ローカル環境を使用する場合
- **Node.js** 18以上
- **Python** 3.8以上
- **PostgreSQL** 12以上
- **Gradle** 8.5以上（またはGradle Wrapperを使用）

### 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定してください：

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=job_assistance
DB_USER=postgres
DB_PASSWORD=postgres

# Flask Configuration
PORT=5000
FLASK_DEBUG=False
```

## Dockerを使用したセットアップ（推奨）

### クイックスタート

```powershell
# 全サービスを起動（本番環境）
docker-compose up -d

# 開発環境で起動
docker-compose -f docker-compose.dev.yml up -d

# ログを確認
docker-compose logs -f

# サービスを停止
docker-compose down

# データベースを含めて完全にクリーンアップ
docker-compose down -v
```

### Makeコマンドを使用（オプション）

```powershell
# ヘルプを表示
make help

# ビルド
make build

# 本番環境で起動
make prod

# 開発環境で起動
make dev

# ログを確認
make logs

# サービスを停止
make down

# クリーンアップ
make clean

# データベース初期化
make db-init

# データベースに接続
make db-shell
```

### Docker Composeサービス

- **db** (PostgreSQL): `localhost:5432`
- **backend** (Flask API): `http://localhost:5000`
- **frontend** (Next.js): `http://localhost:3000`

### 開発環境と本番環境

- **本番環境**: `docker-compose.yml` - 最適化された本番ビルド
- **開発環境**: `docker-compose.dev.yml` - ホットリロード対応、詳細ログ

### Gradleを使用したセットアップ（推奨）

```powershell
# 全依存関係のインストール
gradlew setup

# または手動で
.\gradlew.bat setup
```

### 手動セットアップ

#### フロントエンド依存関係のインストール

```powershell
npm install
```

#### バックエンド依存関係のインストール

```powershell
pip install -r requirements.txt
```

## 使用方法

### クイックスタート（推奨）

**Windows:**
```powershell
.\start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

これで、データベースの初期化、バックエンドAPI、フロントエンドが自動的に起動します。

### Dockerを使用した実行

```powershell
# 全サービスを起動（本番環境）
docker-compose up -d

# 開発環境で起動
docker-compose -f docker-compose.dev.yml up -d

# ログを確認
docker-compose logs -f

# サービスを停止
docker-compose down
```

### Gradleを使用した実行

```powershell
# フロントエンドとバックエンドを同時に起動
gradlew run

# または個別に起動
# フロントエンド（Next.js）
gradlew npmDev

# バックエンド（Flask API）
gradlew pythonRunApi
```

### 手動実行

#### 1. データベースの初期化

```powershell
python -m src.init_db
```

#### 2. バックエンドAPI起動

```powershell
python -m src.api
```

バックエンドAPIは `http://localhost:5000` で起動します。

#### 3. フロントエンド起動（別のターミナル）

```powershell
npm run dev
```

フロントエンドは `http://localhost:3000` で起動します。

## アクセスURL

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:5000
- **API ヘルスチェック**: http://localhost:5000/api/health

### データベースの初期化

```powershell
# Gradleを使用
gradlew pythonInitDb

# または直接実行
python -m src.database
```

## Gradleタスク一覧

| タスク | 説明 |
|--------|------|
| `setup` | 全依存関係のインストール（npm + pip） |
| `build` | プロジェクトのビルド |
| `run` | フロントエンドとバックエンドを同時起動 |
| `npmInstall` | npm依存関係のインストール |
| `npmBuild` | Next.jsアプリケーションのビルド |
| `npmDev` | Next.js開発サーバーの起動 |
| `npmTest` | Vitestテストの実行 |
| `pipInstall` | Python依存関係のインストール |
| `pythonRunApi` | Flask APIサーバーの起動 |
| `pythonInitDb` | データベースの初期化 |

## プロジェクト構成

```
job_assistance/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx            # メインページ
│   └── globals.css         # グローバルスタイル
├── components/             # Reactコンポーネント
│   ├── WorkerList.tsx      # 就労者一覧
│   ├── WorkerForm.tsx      # 就労者フォーム
│   ├── ProgressManagement.tsx # 進捗管理
│   └── LanguageSelector.tsx # 言語選択
├── lib/                    # ユーティリティ
│   ├── api.ts             # APIクライアント
│   ├── i18n.tsx           # i18nプロバイダー
│   └── i18n-config.ts      # i18n設定
├── locales/               # 多言語翻訳ファイル
│   ├── ja/                # 日本語
│   ├── en/                # 英語
│   ├── zh/                # 中国語
│   └── vi/                # ベトナム語
├── src/                    # Pythonソースコード
│   ├── api.py             # Flask REST API
│   ├── database.py        # データベースモデル
│   └── ...
├── build.gradle.kts        # Gradleビルド設定
├── settings.gradle.kts     # Gradle設定
├── package.json            # npm依存関係
├── requirements.txt        # Python依存関係
└── README.md              # このファイル
```

## APIエンドポイント

### 就労者管理

- `GET /api/workers` - 就労者一覧取得
- `POST /api/workers` - 就労者登録
- `GET /api/workers/:id` - 就労者詳細取得
- `PUT /api/workers/:id` - 就労者更新
- `DELETE /api/workers/:id` - 就労者削除

### 進捗管理

- `GET /api/workers/:id/progress` - 進捗一覧取得
- `POST /api/workers/:id/progress` - 進捗登録
- `GET /api/workers/:id/progress/:progress_id` - 進捗詳細取得
- `PUT /api/workers/:id/progress/:progress_id` - 進捗更新
- `DELETE /api/workers/:id/progress/:progress_id` - 進捗削除

### ドキュメント管理

- `GET /api/workers/:id/documents` - ドキュメント一覧取得
- `POST /api/workers/:id/documents` - ドキュメント登録

### 通知管理

- `GET /api/notifications` - 全員向け通知一覧取得
- `POST /api/notifications` - 全員向け通知登録
- `GET /api/workers/:id/notifications` - 就労者向け通知一覧取得
- `POST /api/workers/:id/notifications` - 就労者向け通知登録

### 研修管理

- `GET /api/trainings` - 研修一覧取得
- `POST /api/trainings` - 研修登録

### カレンダー管理

- `GET /api/calendar` - 全員向けイベント一覧取得
- `POST /api/calendar` - 全員向けイベント登録
- `GET /api/workers/:id/calendar` - 就労者向けイベント一覧取得
- `POST /api/workers/:id/calendar` - 就労者向けイベント登録

### 日本語能力管理（来日外国人支援専用）

- `GET /api/workers/:id/japanese-proficiency` - 日本語能力試験結果一覧取得
- `POST /api/workers/:id/japanese-proficiency` - 日本語能力試験結果登録

### 技能訓練管理（来日外国人支援専用）

- `GET /api/workers/:id/skill-training` - 技能訓練一覧取得
- `POST /api/workers/:id/skill-training` - 技能訓練登録

### 日本語学習記録

- `GET /api/workers/:id/japanese-learning` - 日本語学習記録一覧取得
- `POST /api/workers/:id/japanese-learning` - 日本語学習記録登録

### 来日前支援

- `GET /api/workers/:id/pre-departure-support` - 来日前支援一覧取得
- `POST /api/workers/:id/pre-departure-support` - 来日前支援登録

詳細な機能一覧は `FEATURES.md` を参照してください。

## 開発

### テスト実行

```powershell
# Vitestでフロントエンドテスト
gradlew npmTest

# または
npm run test
```

### ビルド

```powershell
# プロダクションビルド
gradlew build

# または
npm run build
```

## ライセンス

MIT License

#   j o b _ a s s i s t a n c e  
 