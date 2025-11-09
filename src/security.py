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
import logging
from datetime import datetime, timedelta

# ロガーの設定
logger = logging.getLogger(__name__)

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
    
    # 危険な文字列パターンをチェック（SQLインジェクション対策）
    # 注意: 通常のユーザー名やメールアドレスが誤って拒否されないように、パターンを慎重に選択
    dangerous_patterns = [
        r'--\s',  # SQLコメント（スペースが続く場合のみ）
        r'/\*',  # SQLコメント開始
        r'\*/',  # SQLコメント終了
        r';\s*(select|insert|update|delete|drop|exec|create|alter)',  # SQLステートメント区切り + SQLキーワード
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
        return False, "Password is required"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if len(password) > 128:
        return False, "Password must be no more than 128 characters long"
    
    # 複雑さチェック（緩和：2種類以上でOK）
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password)
    
    complexity_score = sum([has_upper, has_lower, has_digit, has_special])
    
    if complexity_score < 2:
        return False, "Password must contain at least 2 of the following: uppercase letters, lowercase letters, numbers, special characters"
    
    return True, "Password strength is sufficient"


# ============================================================================
# 多要素認証（MFA/TOTP）
# ============================================================================

def generate_mfa_secret():
    """
    MFA用のシークレットキーを生成（Base32エンコード）
    
    Returns:
        str: Base32エンコードされたシークレットキー
    """
    import pyotp
    return pyotp.random_base32()


def generate_mfa_qr_code(secret, username, issuer_name="外国人就労支援システム"):
    """
    MFA用のQRコードを生成（Google Authenticator等で読み取れる形式）
    
    Args:
        secret: Base32エンコードされたシークレットキー
        username: ユーザー名
        issuer_name: 発行者名（アプリ名）
    
    Returns:
        str: QRコードのBase64エンコードされた画像データ（data URI形式）
    """
    import pyotp
    import qrcode
    import io
    import base64
    
    # TOTP URIを生成
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=username,
        issuer_name=issuer_name
    )
    
    # QRコードを生成
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(totp_uri)
    qr.make(fit=True)
    
    # 画像を生成
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Base64エンコード
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"


def verify_mfa_code(secret, code):
    """
    MFAコードを検証（TOTP）
    
    Args:
        secret: Base32エンコードされたシークレットキー
        code: ユーザーが入力した6桁のコード
    
    Returns:
        bool: コードが有効かどうか
    """
    import pyotp
    
    if not secret or not code:
        return False
    
    # 開発環境用の万能MFAコード（本番環境では無効）
    # 環境変数FLASK_ENVが'production'でない場合のみ有効
    if os.getenv('FLASK_ENV', 'development') != 'production':
        # 万能MFAコード: "000000" または "123456" または "999999"
        universal_codes = ['000000', '123456', '999999']
        if str(code).strip() in universal_codes:
            logger.warning(f'Universal MFA code used: {code} (development mode only)')
            return True
    
    try:
        # コードを整数に変換
        code_int = int(code)
        
        # TOTPオブジェクトを作成
        totp = pyotp.TOTP(secret)
        
        # 現在のコードと前後の時間窓（±1）を許容して検証
        return totp.verify(code_int, valid_window=1)
    except (ValueError, TypeError):
        return False


def generate_backup_codes(count=10):
    """
    バックアップコードを生成（MFAデバイスが利用できない場合の代替手段）
    
    Args:
        count: 生成するコードの数（デフォルト: 10）
    
    Returns:
        list: バックアップコードのリスト
    """
    codes = []
    for _ in range(count):
        # 8桁のランダムな数字コードを生成
        code = secrets.token_hex(4).upper()  # 8文字の16進数文字列
        codes.append(code)
    return codes


def verify_backup_code(backup_codes_json, code):
    """
    バックアップコードを検証
    
    Args:
        backup_codes_json: JSON形式のバックアップコードリスト（暗号化されている可能性あり）
        code: ユーザーが入力したバックアップコード
    
    Returns:
        tuple: (is_valid: bool, remaining_codes: list) - コードが有効かどうかと残りのコードリスト
    """
    import json
    
    if not backup_codes_json or not code:
        return False, []
    
    try:
        # JSONをパース（暗号化されている場合は復号化が必要）
        # ここでは暗号化されていない前提で実装（必要に応じて復号化処理を追加）
        codes = json.loads(backup_codes_json)
        
        if not isinstance(codes, list):
            return False, []
        
        # コードを検証（大文字小文字を区別しない）
        code_upper = code.upper().strip()
        if code_upper in codes:
            # 使用されたコードを削除
            codes.remove(code_upper)
            return True, codes
        else:
            return False, codes
    except (json.JSONDecodeError, ValueError, AttributeError):
        return False, []

