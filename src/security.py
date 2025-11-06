"""
セキュリティモジュール
OWASP Top 10準拠のセキュリティ対策を実装

- SQLインジェクション対策
- XSS（クロスサイトスクリプティング）対策
- CSRF対策
- 認証・認可
- データ保護（個人情報の暗号化）
"""
import re
import bleach
from functools import wraps
from flask import request, session, jsonify
from cryptography.fernet import Fernet
import os
import base64
import hashlib
import secrets
from datetime import datetime, timedelta

# ============================================================================
# XSS対策（入力サニタイゼーション）
# ============================================================================

# 許可するHTMLタグと属性（必要最小限）
ALLOWED_TAGS = []  # HTMLタグは許可しない（テキストのみ）
ALLOWED_ATTRIBUTES = {}

def sanitize_input(text):
    """
    入力文字列をサニタイズ（XSS対策）
    
    Args:
        text: 入力文字列
    
    Returns:
        str: サニタイズされた文字列
    """
    if not text:
        return ""
    
    if isinstance(text, str):
        # HTMLタグを削除
        cleaned = bleach.clean(text, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)
        # 危険な文字をエスケープ
        cleaned = cleaned.replace('<', '&lt;').replace('>', '&gt;')
        cleaned = cleaned.replace('"', '&quot;').replace("'", '&#x27;')
        cleaned = cleaned.replace('/', '&#x2F;')
        return cleaned
    
    return str(text)


def sanitize_dict(data):
    """
    辞書の値を再帰的にサニタイズ
    
    Args:
        data: 辞書またはリスト
    
    Returns:
        サニタイズされたデータ
    """
    if isinstance(data, dict):
        return {key: sanitize_dict(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [sanitize_dict(item) for item in data]
    elif isinstance(data, str):
        return sanitize_input(data)
    else:
        return data


# ============================================================================
# SQLインジェクション対策（入力検証）
# ============================================================================

def validate_sql_input(value, field_type='string', max_length=None):
    """
    SQLインジェクション対策のための入力検証
    
    Args:
        value: 検証する値
        field_type: フィールドタイプ（'string', 'integer', 'email', 'date'）
        max_length: 最大長
    
    Returns:
        検証された値（エラー時はNone）
    """
    if value is None:
        return None
    
    # 危険な文字列パターンをチェック
    dangerous_patterns = [
        r'--',  # SQLコメント
        r'/\*',  # SQLコメント開始
        r'\*/',  # SQLコメント終了
        r';',  # SQLステートメント区切り
        r'union\s+select',  # SQLインジェクション
        r'select\s+.*\s+from',  # SQLインジェクション
        r'insert\s+into',  # SQLインジェクション
        r'update\s+.*\s+set',  # SQLインジェクション
        r'delete\s+from',  # SQLインジェクション
        r'drop\s+table',  # SQLインジェクション
        r'exec\s*\(',  # SQLインジェクション
    ]
    
    value_str = str(value).lower()
    for pattern in dangerous_patterns:
        if re.search(pattern, value_str, re.IGNORECASE):
            return None
    
    # フィールドタイプ別の検証
    if field_type == 'integer':
        try:
            int_value = int(value)
            return int_value
        except (ValueError, TypeError):
            return None
    
    elif field_type == 'email':
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, str(value)):
            return None
    
    elif field_type == 'date':
        try:
            datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        except (ValueError, TypeError):
            return None
    
    # 最大長チェック
    if max_length and len(str(value)) > max_length:
        return None
    
    return value


# ============================================================================
# CSRF対策
# ============================================================================

def generate_csrf_token():
    """
    CSRFトークンを生成
    
    Returns:
        str: CSRFトークン
    """
    if 'csrf_token' not in session:
        session['csrf_token'] = secrets.token_hex(32)
    return session['csrf_token']


def validate_csrf_token(token):
    """
    CSRFトークンを検証
    
    Args:
        token: 検証するトークン
    
    Returns:
        bool: トークンが有効かどうか
    """
    if 'csrf_token' not in session:
        return False
    return secrets.compare_digest(session['csrf_token'], token)


def csrf_protect(f):
    """
    CSRF保護デコレータ
    
    Args:
        f: 保護する関数
    
    Returns:
        デコレートされた関数
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # GETリクエストはCSRFチェックをスキップ
        if request.method == 'GET':
            return f(*args, **kwargs)
        
        # CSRFトークンを検証
        token = request.headers.get('X-CSRF-Token')
        if not token:
            token = request.form.get('csrf_token')
        if not token and request.is_json:
            try:
                data = request.get_json() or {}
                token = data.get('csrf_token')
            except Exception:
                pass
        
        if not token or not validate_csrf_token(token):
            return jsonify({'success': False, 'error': 'Invalid CSRF token'}), 403
        
        return f(*args, **kwargs)
    return decorated_function


# ============================================================================
# データ保護（個人情報の暗号化）
# ============================================================================

def get_encryption_key():
    """
    暗号化キーを取得（環境変数から、なければ生成）
    
    Returns:
        bytes: 暗号化キー
    """
    key_str = os.getenv('ENCRYPTION_KEY')
    if not key_str:
        # 開発環境では固定キーを使用（本番環境では環境変数から取得）
        key_str = os.getenv('ENCRYPTION_KEY', 'dev-encryption-key-change-in-production-32-chars!!')
    
    # 32バイトのキーを生成（Fernetは32バイトのbase64エンコードされたキーを必要とする）
    key_bytes = key_str.encode('utf-8')
    if len(key_bytes) < 32:
        # キーが短い場合はハッシュ化して32バイトにする
        key_bytes = hashlib.sha256(key_bytes).digest()
    else:
        key_bytes = key_bytes[:32]
    
    # Base64エンコード
    return base64.urlsafe_b64encode(key_bytes)


def encrypt_sensitive_data(data):
    """
    機密情報を暗号化
    
    Args:
        data: 暗号化するデータ（文字列）
    
    Returns:
        str: 暗号化されたデータ（Base64エンコード）
    """
    if not data:
        return ""
    
    try:
        key = get_encryption_key()
        fernet = Fernet(key)
        encrypted = fernet.encrypt(data.encode('utf-8'))
        return encrypted.decode('utf-8')
    except Exception as e:
        print(f"Encryption error: {e}")
        return data  # エラー時は元のデータを返す


def decrypt_sensitive_data(encrypted_data):
    """
    機密情報を復号化
    
    Args:
        encrypted_data: 暗号化されたデータ（Base64エンコード）
    
    Returns:
        str: 復号化されたデータ
    """
    if not encrypted_data:
        return ""
    
    try:
        key = get_encryption_key()
        fernet = Fernet(key)
        decrypted = fernet.decrypt(encrypted_data.encode('utf-8'))
        return decrypted.decode('utf-8')
    except Exception as e:
        print(f"Decryption error: {e}")
        return encrypted_data  # エラー時は元のデータを返す


# ============================================================================
# レート制限（ブルートフォース攻撃対策）
# ============================================================================

# ログイン試行回数の記録（メモリ内、本番環境ではRedis等を使用）
login_attempts = {}


def check_rate_limit(identifier, max_attempts=5, window_seconds=300):
    """
    レート制限をチェック（ブルートフォース攻撃対策）
    
    Args:
        identifier: 識別子（IPアドレス、ユーザー名など）
        max_attempts: 最大試行回数
        window_seconds: 時間ウィンドウ（秒）
    
    Returns:
        bool: リクエストが許可されるかどうか
    """
    now = datetime.now()
    
    if identifier not in login_attempts:
        login_attempts[identifier] = []
    
    # 時間ウィンドウ外の試行を削除
    login_attempts[identifier] = [
        attempt_time for attempt_time in login_attempts[identifier]
        if (now - attempt_time).total_seconds() < window_seconds
    ]
    
    # 試行回数をチェック
    if len(login_attempts[identifier]) >= max_attempts:
        return False
    
    # 試行を記録
    login_attempts[identifier].append(now)
    return True


def reset_rate_limit(identifier):
    """
    レート制限をリセット
    
    Args:
        identifier: 識別子
    """
    if identifier in login_attempts:
        del login_attempts[identifier]


# ============================================================================
# セキュリティヘッダーの設定
# ============================================================================

def set_security_headers(response):
    """
    セキュリティヘッダーを設定
    
    Args:
        response: Flaskレスポンスオブジェクト
    
    Returns:
        response: セキュリティヘッダーが設定されたレスポンス
    """
    # XSS対策
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # HTTPS強制（本番環境）
    if os.getenv('FLASK_ENV') == 'production':
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    # コンテンツセキュリティポリシー
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self' ws: wss:; "
        "frame-ancestors 'none';"
    )
    
    # リファラーポリシー
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # パーミッションポリシー
    response.headers['Permissions-Policy'] = (
        "geolocation=(), "
        "microphone=(), "
        "camera=(), "
        "payment=()"
    )
    
    return response


# ============================================================================
# パスワード強度チェック
# ============================================================================

def validate_password_strength(password):
    """
    パスワードの強度を検証
    
    Args:
        password: パスワード
    
    Returns:
        tuple: (is_valid: bool, message: str)
    """
    if not password:
        return False, "パスワードは必須です"
    
    if len(password) < 8:
        return False, "パスワードは8文字以上である必要があります"
    
    if len(password) > 128:
        return False, "パスワードは128文字以下である必要があります"
    
    # 複雑さチェック
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password)
    
    complexity_score = sum([has_upper, has_lower, has_digit, has_special])
    
    if complexity_score < 3:
        return False, "パスワードには大文字、小文字、数字、特殊文字のうち3種類以上を含む必要があります"
    
    return True, "パスワードの強度は十分です"

