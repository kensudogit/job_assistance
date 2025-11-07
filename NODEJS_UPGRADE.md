# Node.js バージョンアップ手順（Windows）

現在のNode.jsバージョン: **v22.11.0**  
必要なバージョン: **v22.12以上**（Vite 7.2.0の要件）

## 方法1: Node.js公式サイトから直接インストール（最も簡単）

### 手順

1. **Node.js公式サイトにアクセス**
   - URL: https://nodejs.org/
   - または直接ダウンロード: https://nodejs.org/en/download/

2. **最新のLTSバージョンをダウンロード**
   - 推奨: **LTS（Long Term Support）バージョン**
   - または最新版（Current）をダウンロード
   - Windows Installer (.msi) を選択

3. **インストーラーを実行**
   - ダウンロードした `.msi` ファイルを実行
   - インストールウィザードに従って進める
   - 既存のNode.jsを上書きするか確認されたら「はい」を選択

4. **インストール完了後、バージョンを確認**
   ```bash
   node --version
   npm --version
   ```

5. **PowerShell/コマンドプロンプトを再起動**
   - 新しいバージョンが反映されるように、ターミナルを再起動してください

---

## 方法2: nvm-windowsを使用（複数バージョン管理に便利）

### インストール手順

1. **nvm-windowsをダウンロード**
   - GitHub: https://github.com/coreybutler/nvm-windows/releases
   - 最新の `nvm-setup.exe` をダウンロード

2. **インストーラーを実行**
   - ダウンロードした `nvm-setup.exe` を実行
   - インストールウィザードに従って進める

3. **PowerShell/コマンドプロンプトを再起動**

4. **nvm-windowsが正しくインストールされたか確認**
   ```bash
   nvm version
   ```

### Node.jsのインストールと切り替え

1. **利用可能なNode.jsバージョンを確認**
   ```bash
   nvm list available
   ```

2. **最新のLTSバージョンをインストール**
   ```bash
   nvm install lts
   ```
   または特定のバージョンをインストール:
   ```bash
   nvm install 22.12.0
   ```

3. **インストールしたバージョンを使用**
   ```bash
   nvm use 22.12.0
   ```

4. **バージョンを確認**
   ```bash
   node --version
   ```

5. **デフォルトバージョンを設定（オプション）**
   ```bash
   nvm alias default 22.12.0
   ```

---

## 方法3: Chocolateyを使用（パッケージマネージャー）

### 前提条件
- Chocolateyがインストールされている必要があります
- インストール方法: https://chocolatey.org/install

### 手順

1. **管理者権限でPowerShellを開く**

2. **Node.jsをアップグレード**
   ```bash
   choco upgrade nodejs
   ```

3. **バージョンを確認**
   ```bash
   node --version
   ```

---

## アップグレード後の確認事項

1. **Node.jsのバージョン確認**
   ```bash
   node --version
   ```
   - v22.12.0以上であることを確認

2. **npmのバージョン確認**
   ```bash
   npm --version
   ```

3. **プロジェクトの依存関係を再インストール（推奨）**
   ```bash
   cd C:\devlop\job_assistance
   rm -rf node_modules
   npm install
   ```

4. **開発サーバーを起動して動作確認**
   ```bash
   npm run dev
   ```

---

## トラブルシューティング

### 問題: バージョンが更新されない

**解決方法:**
1. PowerShell/コマンドプロンプトを完全に閉じて再起動
2. 環境変数 `PATH` を確認
3. 古いNode.jsのパスが残っていないか確認

### 問題: npmコマンドが動作しない

**解決方法:**
```bash
npm install -g npm@latest
```

### 問題: 権限エラーが発生する

**解決方法:**
- 管理者権限でPowerShell/コマンドプロンプトを実行
- または、nvm-windowsを使用してユーザー権限でインストール

---

## 推奨事項

- **方法1（公式サイトから直接インストール）**が最も簡単で確実です
- 複数のNode.jsバージョンを管理したい場合は**方法2（nvm-windows）**が便利です
- 既にChocolateyを使用している場合は**方法3**が効率的です

---

## 参考リンク

- Node.js公式サイト: https://nodejs.org/
- nvm-windows: https://github.com/coreybutler/nvm-windows
- Chocolatey: https://chocolatey.org/

