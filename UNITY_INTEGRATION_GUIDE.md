# Unityシミュレーター統合ガイド

## 概要
このドキュメントでは、Unity WebGLビルドをReactアプリケーションに統合する手順を説明します。

## 実装済み機能

### 1. UnitySimulatorコンポーネント
- Unity WebGLビルドの埋め込み
- 訓練セッションの開始/終了
- 操作ログの記録
- バックエンドAPIへのデータ送信
- モックモードでの動作（Unityビルドがない場合）

### 2. ConstructionSimulatorManagementへの統合
- Unityシミュレーターの表示
- 訓練記録との連携
- セッション完了時の自動更新

## Unity WebGLビルドの配置

### 1. ビルドディレクトリの作成
```
public/
  unity-build/
    Build.loader.js
    Build.data
    Build.framework.js
    Build.wasm
    StreamingAssets/
```

### 2. Unityプロジェクトのビルド手順

#### 2.1 Unityプロジェクトの準備
1. Unity HubでUnity 2021.3 LTS以上をインストール
2. 新しいプロジェクトを作成（3Dテンプレート）
3. 必要なアセットとスクリプトを追加

#### 2.2 WebGLビルドの設定
1. **File > Build Settings**
2. プラットフォームで「WebGL」を選択
3. **Player Settings**を開く
4. 以下の設定を確認:
   - **Company Name**: JobAssistance
   - **Product Name**: ConstructionSimulator
   - **WebGL Template**: Default または Custom
   - **Compression Format**: Gzip または Brotli

#### 2.3 ビルドの実行
1. **Build**ボタンをクリック
2. 出力先を`public/unity-build/`に指定
3. ビルドが完了するまで待機

#### 2.4 ビルドファイルの配置
ビルドが完了すると、以下のファイルが生成されます:
- `Build.loader.js` - Unity Loaderスクリプト
- `Build.data` - アセットデータ
- `Build.framework.js` - Unityフレームワーク
- `Build.wasm` - WebAssemblyバイナリ
- `StreamingAssets/` - ストリーミングアセット（オプション）

これらのファイルを`public/unity-build/`に配置してください。

## Unityスクリプトの実装

### 1. UnityからReactへの通信

Unityスクリプトで、Reactアプリケーションにメッセージを送信する例:

```csharp
using UnityEngine;

public class TrainingManager : MonoBehaviour
{
    // セッション開始
    public void StartSession(string sessionId, int workerId, int? trainingMenuId)
    {
        // セッション開始をReactに通知
        Application.ExternalCall("handleUnityMessage", new {
            type = "session_start",
            data = new {
                sessionId = sessionId,
                workerId = workerId,
                trainingMenuId = trainingMenuId
            }
        });
    }

    // 操作ログを送信
    public void LogOperation(string operationType, string operationValue, Vector3 position, float velocity, bool isError = false, string errorDescription = null)
    {
        Application.ExternalCall("handleUnityMessage", new {
            type = "operation_log",
            data = new {
                operationType = operationType,
                operationValue = operationValue,
                position = new { x = position.x, y = position.y, z = position.z },
                velocity = velocity,
                errorEvent = isError,
                errorDescription = errorDescription
            }
        });
    }

    // セッション終了
    public void EndSession(object sessionData)
    {
        Application.ExternalCall("handleUnityMessage", new {
            type = "session_end",
            data = sessionData
        });
    }
}
```

### 2. ReactからUnityへの通信

ReactアプリケーションからUnityにメッセージを送信する例:

```typescript
// Unityにメッセージを送信
sendMessageToUnity('TrainingManager', 'StartSession', {
  sessionId: 'unity-session-12345',
  workerId: 1,
  trainingMenuId: 1
});
```

### 3. Unity Loaderの読み込み

Unity WebGLビルドを読み込むには、以下のいずれかの方法を使用します:

#### 方法1: Unity Loader（Unity 2020.1以前）
```html
<script src="/unity-build/Build.loader.js"></script>
<script>
  var unityInstance = UnityLoader.instantiate("unity-canvas", "/unity-build/Build.json");
</script>
```

#### 方法2: Unity Loader（Unity 2020.1以降）
```javascript
const config = {
  dataUrl: "/unity-build/Build.data",
  frameworkUrl: "/unity-build/Build.framework.js",
  codeUrl: "/unity-build/Build.wasm",
  streamingAssetsUrl: "StreamingAssets",
  companyName: "JobAssistance",
  productName: "ConstructionSimulator",
  productVersion: "1.0.0",
};

const unityInstance = await createUnityInstance(canvas, config, (progress) => {
  console.log("Loading progress: " + (progress * 100) + "%");
});
```

## バックエンドAPIとの連携

### 1. 訓練セッションの送信

Unityシミュレーターから訓練セッションデータを送信する例:

```typescript
const trainingSessionData: UnityTrainingSessionData = {
  session_id: 'unity-session-12345',
  worker_id: 1,
  training_menu_id: 1,
  session_start_time: '2024-01-15T10:00:00Z',
  session_end_time: '2024-01-15T11:30:00Z',
  duration_seconds: 5400,
  status: '完了',
  operation_logs: [
    {
      timestamp: '2024-01-15T10:00:00Z',
      operation_type: '操作開始',
      operation_value: 'バックホー起動',
      equipment_state: { engine_running: true, bucket_position: 0.5 },
      position_x: 0.0,
      position_y: 0.0,
      position_z: 0.0,
      velocity: 0.0,
      error_event: false
    }
  ],
  ai_evaluation: {
    overall_score: 85.5,
    safety_score: 90.0,
    efficiency_score: 82.5,
    accuracy_score: 88.0,
    feedback: '安全運転に優れている'
  },
  kpi_scores: {
    safety_score: 90.0,
    error_count: 0,
    procedure_compliance_rate: 95.0,
    work_time_seconds: 5400,
    achievement_rate: 100.0,
    accuracy_score: 88.0,
    efficiency_score: 82.5,
    overall_score: 85.5,
    notes: '良好な訓練結果'
  }
};

const result = await unityApi.submitTrainingSession(trainingSessionData);
```

### 2. WebSocket接続（リアルタイム通信）

リアルタイム通信が必要な場合、WebSocket接続を実装します:

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

// セッションに参加
socket.emit('join_session', {
  session_id: 'unity-session-12345',
  worker_id: 1,
  client_type: 'unity'
});

// ステータス更新を送信
socket.emit('unity_status_update', {
  session_id: 'unity-session-12345',
  status: 'running',
  kpi: { safety_score: 90.0 }
});

// 管理者からのコマンドを受信
socket.on('admin_command', (data) => {
  console.log('Admin command received:', data);
  // Unityにコマンドを送信
  sendMessageToUnity('TrainingManager', 'HandleCommand', data);
});
```

## テストとデバッグ

### 1. ローカルテスト
1. バックエンドAPIを起動
2. フロントエンドを起動（`npm run dev`）
3. Unityシミュレーター画面にアクセス
4. 訓練セッションを開始
5. 操作を実行
6. 訓練セッションを終了
7. バックエンドAPIのログを確認

### 2. デバッグログの確認
- Unityコンソール: ブラウザの開発者ツール > Console
- バックエンドログ: バックエンドAPIのログファイル
- ネットワーク: ブラウザの開発者ツール > Network

## トラブルシューティング

### 問題: Unityビルドが読み込まれない
**解決方法:**
1. `public/unity-build/`ディレクトリにビルドファイルが配置されているか確認
2. ファイル名が正しいか確認（Build.loader.js, Build.data, Build.framework.js, Build.wasm）
3. ブラウザのコンソールでエラーを確認
4. CORS設定を確認

### 問題: UnityからReactへの通信ができない
**解決方法:**
1. `Application.ExternalCall`が正しく実装されているか確認
2. React側の`handleUnityMessage`関数が正しく実装されているか確認
3. ブラウザのコンソールでエラーを確認

### 問題: ReactからUnityへの通信ができない
**解決方法:**
1. Unityインスタンスが正しく初期化されているか確認
2. `SendMessage`メソッドが正しく実装されているか確認
3. ゲームオブジェクト名とメソッド名が正しいか確認

## 次のステップ

1. Unityプロジェクトを作成
2. Unity WebGLビルドを実行
3. ビルドファイルを`public/unity-build/`に配置
4. バックエンドAPIと連携テスト
5. 本番環境にデプロイ

## 参考リンク

- Unity WebGL公式ドキュメント: https://docs.unity3d.com/Manual/webgl.html
- Unity WebGLビルドガイド: https://docs.unity3d.com/Manual/webgl-building.html
- Unity WebGL最適化: https://docs.unity3d.com/Manual/webgl-optimization.html

