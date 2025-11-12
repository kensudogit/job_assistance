"""
Flask REST API for 外国人就労支援システム
"""

from flask import Flask, request, jsonify, send_file, Response, session
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage
from flask_cors import CORS
from flask_restful import Api, Resource
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from functools import wraps
from datetime import datetime, date
import csv
import io
import json
from .security import (
    sanitize_input, sanitize_dict, validate_sql_input,
    generate_csrf_token, validate_csrf_token, csrf_protect,
    encrypt_sensitive_data, decrypt_sensitive_data,
    check_rate_limit, reset_rate_limit,
    set_security_headers, validate_password_strength,
    generate_mfa_secret, generate_mfa_qr_code, verify_mfa_code,
    generate_backup_codes, verify_backup_code
)
from .database import (
    Database, User, Worker, WorkerProgress, Document, Notification,
    Training, TrainingEnrollment, Evaluation, Message,
    CalendarEvent, Report, JapaneseProficiency, SkillTraining,
    SkillTrainingRecord, JapaneseLearningRecord, PreDepartureSupport,
    TrainingMenu, TrainingMenuAssignment, TrainingSession, KPIScore,
    OperationLog, Milestone, CareerPath, ConstructionSimulatorTraining,
    ConstructionSimulatorSession, IntegratedGrowth, SpecificSkillTransition,
    DigitalEvidence, CareerGoal
)
from sqlalchemy.orm import joinedload
from sqlalchemy import or_
import os
import logging
from logging.handlers import RotatingFileHandler
import base64
try:
    import msgpack
    MSGPACK_AVAILABLE = True
except ImportError:
    MSGPACK_AVAILABLE = False
    app.logger.warning('msgpack not available. Using JSON compression instead.')

# ============================================================================
# Flaskアプリケーション初期化
# ============================================================================

app = Flask(__name__)
# セッション管理用のシークレットキー（本番環境では変更が必要）
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
# セッション設定（セキュリティ強化）
app.config['SESSION_COOKIE_SECURE'] = os.getenv('FLASK_ENV') == 'production'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
# フロントエンドとの通信を許可（認証用にcredentialsを有効化）
CORS(app, supports_credentials=True, origins=os.getenv('CORS_ORIGINS', '*').split(','))
api = Api(app)

# ============================================================================
# ログ設定
# ============================================================================

# ログレベルの設定（環境変数から取得、デフォルトはINFO）
log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
app.logger.setLevel(getattr(logging, log_level, logging.INFO))

# ログフォーマットの設定
log_format = logging.Formatter(
    '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# コンソール出力用のハンドラ
console_handler = logging.StreamHandler()
console_handler.setLevel(getattr(logging, log_level, logging.INFO))
console_handler.setFormatter(log_format)
app.logger.addHandler(console_handler)

# ファイル出力用のハンドラ（ログローテーション対応）
log_file = os.getenv('LOG_FILE', 'app.log')
if log_file:
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5  # 5ファイルまで保持
    )
    file_handler.setLevel(getattr(logging, log_level, logging.INFO))
    file_handler.setFormatter(log_format)
    app.logger.addHandler(file_handler)

# SQLAlchemyのログレベル設定（SQLクエリをログに出力する場合）
if os.getenv('LOG_SQL', 'false').lower() == 'true':
    logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

app.logger.info('Flaskアプリケーションが起動しました')

# レート制限（ブルートフォース攻撃対策）
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# WebSocket初期化（リアルタイム通信用）
socketio = SocketIO(app, cors_allowed_origins=os.getenv('CORS_ORIGINS', '*').split(','), async_mode='eventlet')

# セキュリティヘッダーをすべてのレスポンスに追加
@app.after_request
def after_request_handler(response):
    """すべてのレスポンスにセキュリティヘッダーを追加"""
    return set_security_headers(response)

# データベース初期化
db = Database()
db.init_database()


# 認証デコレータ（一時的に無効化）
def require_auth(f):
    """認証が必要なエンドポイント用デコレータ（一時的に無効化）"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 認証チェックをスキップ（一時的に無効化）
        # user_id = session.get('user_id')
        # if not user_id:
        #     return {'success': False, 'error': 'Authentication required'}, 401
        return f(*args, **kwargs)
    return decorated_function


def require_role(allowed_roles):
    """役割ベースアクセス制御用デコレータ（一時的に無効化）"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # 認証チェックをスキップ（一時的に無効化）
            # user_id = session.get('user_id')
            # if not user_id:
            #     return {'success': False, 'error': 'Authentication required'}, 401
            # 
            # session_db = db.get_session()
            # try:
            #     user = session_db.query(User).filter(User.id == user_id).first()
            #     if not user or user.role not in allowed_roles:
            #         return {'success': False, 'error': 'Insufficient permissions'}, 403
            # finally:
            #     session_db.close()
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def serialize_date(obj):
    """日付をシリアライズ"""
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    return obj


def serialize_worker(worker):
    """就労者をシリアライズ（個人情報の復号化含む）"""
    # 個人情報の復号化（表示時のみ）
    decrypted_phone = decrypt_sensitive_data(worker.phone) if worker.phone else None
    decrypted_address = decrypt_sensitive_data(worker.address) if worker.address else None
    
    return {
        'id': worker.id,
        'name': worker.name,
        'name_kana': worker.name_kana,
        'email': worker.email,
        'phone': decrypted_phone,  # 復号化
        'address': decrypted_address,  # 復号化
        'birth_date': serialize_date(worker.birth_date),
        'nationality': worker.nationality,
        'native_language': worker.native_language,
        'visa_status': worker.visa_status,
        'visa_expiry_date': serialize_date(worker.visa_expiry_date),
        'japanese_level': worker.japanese_level,
        'english_level': worker.english_level,
        'skills': worker.skills,
        'experience_years': worker.experience_years,
        'education': worker.education,
        'current_status': worker.current_status,
        'notes': worker.notes,
        'created_at': serialize_date(worker.created_at),
        'updated_at': serialize_date(worker.updated_at),
    }


def serialize_progress(progress):
    """
    進捗をシリアライズ
    WorkerProgressオブジェクトを辞書形式に変換
    
    Args:
        progress: WorkerProgressオブジェクト
    
    Returns:
        dict: シリアライズされた進捗データ
    """
    return {
        'id': progress.id,
        'worker_id': progress.worker_id,
        'progress_date': serialize_date(progress.progress_date),
        'progress_type': progress.progress_type,
        'title': progress.title,
        'description': progress.description,
        'status': progress.status,
        'support_content': progress.support_content,
        'next_action': progress.next_action,
        'next_action_date': serialize_date(progress.next_action_date),
        'support_staff': progress.support_staff,
        'created_at': serialize_date(progress.created_at),
        'updated_at': serialize_date(progress.updated_at),
    }


class WorkerListResource(Resource):
    """
    就労者一覧API
    就労者の一覧を取得するエンドポイント
    """
    
    def get(self):
        """
        GET /api/workers
        すべての就労者一覧を取得
        """
        session = db.get_session()
        try:
            workers = session.query(Worker).order_by(Worker.created_at.desc()).all()
            return {
                'success': True,
                'data': [serialize_worker(worker) for worker in workers]
            }, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self):
        """
        POST /api/workers
        新しい就労者を登録
        """
        session_db = db.get_session()
        try:
            # 入力データのサニタイゼーション（XSS対策）
            data = request.get_json()
            if not data:
                return {'success': False, 'error': 'Invalid request'}, 400
            
            data = sanitize_dict(data)  # XSS対策
            
            # SQLインジェクション対策（入力検証）
            name = validate_sql_input(data.get('name'), field_type='string', max_length=100)
            email = validate_sql_input(data.get('email'), field_type='email', max_length=100)
            
            # 必須フィールドのチェック
            if not name or not email:
                return {'success': False, 'error': 'Name and email are required'}, 400
            
            # 日付の変換
            birth_date = None
            if data.get('birth_date'):
                birth_date = datetime.fromisoformat(data['birth_date'].replace('Z', '+00:00')).date()
            
            visa_expiry_date = None
            if data.get('visa_expiry_date'):
                visa_expiry_date = datetime.fromisoformat(data['visa_expiry_date'].replace('Z', '+00:00')).date()
            
            # 個人情報の暗号化（機密情報）
            encrypted_phone = encrypt_sensitive_data(data.get('phone', '')) if data.get('phone') else None
            encrypted_address = encrypt_sensitive_data(data.get('address', '')) if data.get('address') else None
            
            worker = Worker(
                name=name,  # 既にサニタイズ済み
                name_kana=sanitize_input(data.get('name_kana', '')),
                email=email,  # 既に検証済み
                phone=encrypted_phone,  # 暗号化
                address=encrypted_address,  # 暗号化
                birth_date=birth_date,
                nationality=sanitize_input(data.get('nationality', '')),
                native_language=sanitize_input(data.get('native_language', '')),
                visa_status=sanitize_input(data.get('visa_status', '')),
                visa_expiry_date=visa_expiry_date,
                japanese_level=sanitize_input(data.get('japanese_level', '')),
                english_level=sanitize_input(data.get('english_level', '')),
                skills=sanitize_input(data.get('skills', '')),
                experience_years=validate_sql_input(data.get('experience_years', 0), field_type='integer') or 0,
                education=sanitize_input(data.get('education', '')),
                current_status=sanitize_input(data.get('current_status', '登録中')),
                notes=sanitize_input(data.get('notes', '')),
            )
            
            session_db.add(worker)
            session_db.commit()
            
            return {
                'success': True,
                'data': serialize_worker(worker)
            }, 201
        except Exception as e:
            session_db.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session_db.close()


class WorkerResource(Resource):
    """
    就労者個別API
    個別の就労者情報の取得、更新、削除を提供
    """
    
    def get(self, worker_id):
        """
        GET /api/workers/<worker_id>
        指定されたIDの就労者情報を取得（進捗記録を含む）
        """
        session = db.get_session()
        try:
            worker = session.query(Worker).options(
                joinedload(Worker.progress_records)
            ).filter(Worker.id == worker_id).first()
            
            if not worker:
                return {'success': False, 'error': 'Worker not found'}, 404
            
            result = serialize_worker(worker)
            result['progress_records'] = [serialize_progress(p) for p in worker.progress_records]
            
            return {
                'success': True,
                'data': result
            }, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def put(self, worker_id):
        """
        PUT /api/workers/<worker_id>
        指定されたIDの就労者情報を更新
        """
        session = db.get_session()
        try:
            worker = session.query(Worker).filter(Worker.id == worker_id).first()
            
            if not worker:
                return {'success': False, 'error': 'Worker not found'}, 404
            
            data = request.get_json()
            
            # フィールドの更新
            if 'name' in data:
                worker.name = data['name']
            if 'name_kana' in data:
                worker.name_kana = data.get('name_kana')
            if 'email' in data:
                worker.email = data['email']
            if 'phone' in data:
                worker.phone = data.get('phone')
            if 'address' in data:
                worker.address = data.get('address')
            if 'birth_date' in data:
                worker.birth_date = datetime.fromisoformat(data['birth_date'].replace('Z', '+00:00')).date() if data['birth_date'] else None
            if 'nationality' in data:
                worker.nationality = data.get('nationality')
            if 'native_language' in data:
                worker.native_language = data.get('native_language')
            if 'visa_status' in data:
                worker.visa_status = data.get('visa_status')
            if 'visa_expiry_date' in data:
                worker.visa_expiry_date = datetime.fromisoformat(data['visa_expiry_date'].replace('Z', '+00:00')).date() if data['visa_expiry_date'] else None
            if 'japanese_level' in data:
                worker.japanese_level = data.get('japanese_level')
            if 'english_level' in data:
                worker.english_level = data.get('english_level')
            if 'skills' in data:
                worker.skills = data.get('skills')
            if 'experience_years' in data:
                worker.experience_years = data.get('experience_years', 0)
            if 'education' in data:
                worker.education = data.get('education')
            if 'current_status' in data:
                worker.current_status = data.get('current_status')
            if 'notes' in data:
                worker.notes = data.get('notes')
            
            worker.updated_at = datetime.now()
            session.commit()
            
            return {
                'success': True,
                'data': serialize_worker(worker)
            }, 200
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def delete(self, worker_id):
        """就労者を削除"""
        session = db.get_session()
        try:
            worker = session.query(Worker).filter(Worker.id == worker_id).first()
            
            if not worker:
                return {'success': False, 'error': 'Worker not found'}, 404
            
            session.delete(worker)
            session.commit()
            
            return {'success': True, 'message': 'Worker deleted'}, 200
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()


class WorkerProgressListResource(Resource):
    """就労者進捗一覧API"""
    
    def get(self, worker_id):
        """就労者の進捗一覧を取得"""
        session = db.get_session()
        try:
            # worker_idが0の場合は空のデータを返す
            if worker_id == 0:
                return {
                    'success': True,
                    'data': []
                }, 200
            
            progress_records = session.query(WorkerProgress).filter(
                WorkerProgress.worker_id == worker_id
            ).order_by(WorkerProgress.progress_date.desc()).all()
            
            return {
                'success': True,
                'data': [serialize_progress(p) for p in progress_records]
            }, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id):
        """進捗を登録"""
        session = db.get_session()
        try:
            # 就労者の存在確認
            worker = session.query(Worker).filter(Worker.id == worker_id).first()
            if not worker:
                return {'success': False, 'error': 'Worker not found'}, 404
            
            data = request.get_json()
            
            # 必須フィールドのチェック
            if not data.get('progress_date') or not data.get('progress_type'):
                return {'success': False, 'error': 'progress_date and progress_type are required'}, 400
            
            # 日付の変換
            progress_date = datetime.fromisoformat(data['progress_date'].replace('Z', '+00:00')).date()
            next_action_date = None
            if data.get('next_action_date'):
                next_action_date = datetime.fromisoformat(data['next_action_date'].replace('Z', '+00:00')).date()
            
            progress = WorkerProgress(
                worker_id=worker_id,
                progress_date=progress_date,
                progress_type=data['progress_type'],
                title=data.get('title'),
                description=data.get('description'),
                status=data.get('status', '実施中'),
                support_content=data.get('support_content'),
                next_action=data.get('next_action'),
                next_action_date=next_action_date,
                support_staff=data.get('support_staff'),
            )
            
            session.add(progress)
            session.commit()
            
            return {
                'success': True,
                'data': serialize_progress(progress)
            }, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()


class WorkerProgressResource(Resource):
    """就労者進捗個別API"""
    
    def get(self, worker_id, progress_id):
        """進捗を取得"""
        session = db.get_session()
        try:
            progress = session.query(WorkerProgress).filter(
                WorkerProgress.id == progress_id,
                WorkerProgress.worker_id == worker_id
            ).first()
            
            if not progress:
                return {'success': False, 'error': 'Progress not found'}, 404
            
            return {
                'success': True,
                'data': serialize_progress(progress)
            }, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def put(self, worker_id, progress_id):
        """進捗を更新"""
        session = db.get_session()
        try:
            progress = session.query(WorkerProgress).filter(
                WorkerProgress.id == progress_id,
                WorkerProgress.worker_id == worker_id
            ).first()
            
            if not progress:
                return {'success': False, 'error': 'Progress not found'}, 404
            
            data = request.get_json()
            
            # フィールドの更新
            if 'progress_date' in data:
                progress.progress_date = datetime.fromisoformat(data['progress_date'].replace('Z', '+00:00')).date()
            if 'progress_type' in data:
                progress.progress_type = data['progress_type']
            if 'title' in data:
                progress.title = data.get('title')
            if 'description' in data:
                progress.description = data.get('description')
            if 'status' in data:
                progress.status = data.get('status')
            if 'support_content' in data:
                progress.support_content = data.get('support_content')
            if 'next_action' in data:
                progress.next_action = data.get('next_action')
            if 'next_action_date' in data:
                progress.next_action_date = datetime.fromisoformat(data['next_action_date'].replace('Z', '+00:00')).date() if data['next_action_date'] else None
            if 'support_staff' in data:
                progress.support_staff = data.get('support_staff')
            
            progress.updated_at = datetime.now()
            session.commit()
            
            return {
                'success': True,
                'data': serialize_progress(progress)
            }, 200
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def delete(self, worker_id, progress_id):
        """進捗を削除"""
        session = db.get_session()
        try:
            progress = session.query(WorkerProgress).filter(
                WorkerProgress.id == progress_id,
                WorkerProgress.worker_id == worker_id
            ).first()
            
            if not progress:
                return {'success': False, 'error': 'Progress not found'}, 404
            
            session.delete(progress)
            session.commit()
            
            return {'success': True, 'message': 'Progress deleted'}, 200
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()


# ドキュメント管理API
class DocumentListResource(Resource):
    def get(self, worker_id):
        session = db.get_session()
        try:
            documents = session.query(Document).filter(
                Document.worker_id == worker_id
            ).order_by(Document.created_at.desc()).all()
            return {'success': True, 'data': [self._serialize(d) for d in documents]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id):
        session = db.get_session()
        try:
            data = request.get_json()
            document = Document(
                worker_id=worker_id,
                document_type=data.get('document_type'),
                title=data.get('title'),
                file_path=data.get('file_path'),
                file_name=data.get('file_name'),
                file_size=data.get('file_size'),
                mime_type=data.get('mime_type'),
                description=data.get('description'),
                expiry_date=datetime.fromisoformat(data['expiry_date'].replace('Z', '+00:00')).date() if data.get('expiry_date') else None,
                is_required=data.get('is_required', False),
                is_verified=data.get('is_verified', False),
                uploaded_by=data.get('uploaded_by'),
            )
            session.add(document)
            session.commit()
            return {'success': True, 'data': self._serialize(document)}, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, doc):
        return {
            'id': doc.id,
            'worker_id': doc.worker_id,
            'document_type': doc.document_type,
            'title': doc.title,
            'file_path': doc.file_path,
            'file_name': doc.file_name,
            'file_size': doc.file_size,
            'mime_type': doc.mime_type,
            'description': doc.description,
            'expiry_date': serialize_date(doc.expiry_date),
            'is_required': doc.is_required,
            'is_verified': doc.is_verified,
            'uploaded_by': doc.uploaded_by,
            'created_at': serialize_date(doc.created_at),
            'updated_at': serialize_date(doc.updated_at),
        }


# 通知管理API
class NotificationListResource(Resource):
    def get(self, worker_id=None):
        session = db.get_session()
        try:
            query = session.query(Notification)
            if worker_id:
                query = query.filter(Notification.worker_id == worker_id)
            else:
                query = query.filter(Notification.worker_id.is_(None))
            
            notifications = query.order_by(Notification.created_at.desc()).all()
            return {'success': True, 'data': [self._serialize(n) for n in notifications]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()


class NotificationWorkerResource(Resource):
    def get(self, worker_id):
        session = db.get_session()
        try:
            notifications = session.query(Notification).filter(
                Notification.worker_id == worker_id
            ).order_by(Notification.created_at.desc()).all()
            return {'success': True, 'data': [self._serialize(n) for n in notifications]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id):
        session = db.get_session()
        try:
            data = request.get_json()
            notification = Notification(
                worker_id=worker_id if worker_id else None,
                title=data.get('title'),
                message=data.get('message'),
                notification_type=data.get('notification_type'),
                priority=data.get('priority', 'normal'),
                scheduled_date=datetime.fromisoformat(data['scheduled_date'].replace('Z', '+00:00')) if data.get('scheduled_date') else None,
                related_type=data.get('related_type'),
                related_id=data.get('related_id'),
            )
            session.add(notification)
            session.commit()
            return {'success': True, 'data': self._serialize(notification)}, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()


class NotificationListResourceAll(Resource):
    def get(self):
        session = db.get_session()
        try:
            notifications = session.query(Notification).filter(
                Notification.worker_id.is_(None)
            ).order_by(Notification.created_at.desc()).all()
            return {'success': True, 'data': [NotificationWorkerResource()._serialize(n) for n in notifications]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self):
        session = db.get_session()
        try:
            data = request.get_json()
            notification = Notification(
                worker_id=None,
                title=data.get('title'),
                message=data.get('message'),
                notification_type=data.get('notification_type'),
                priority=data.get('priority', 'normal'),
                scheduled_date=datetime.fromisoformat(data['scheduled_date'].replace('Z', '+00:00')) if data.get('scheduled_date') else None,
                related_type=data.get('related_type'),
                related_id=data.get('related_id'),
            )
            session.add(notification)
            session.commit()
            return {'success': True, 'data': NotificationWorkerResource()._serialize(notification)}, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()


# 研修管理API
class TrainingListResource(Resource):
    def get(self):
        session = db.get_session()
        try:
            trainings = session.query(Training).order_by(Training.start_date.desc()).all()
            return {'success': True, 'data': [self._serialize(t) for t in trainings]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self):
        session = db.get_session()
        try:
            data = request.get_json()
            training = Training(
                title=data.get('title'),
                description=data.get('description'),
                training_type=data.get('training_type'),
                category=data.get('category'),
                duration_hours=data.get('duration_hours'),
                start_date=datetime.fromisoformat(data['start_date'].replace('Z', '+00:00')).date() if data.get('start_date') else None,
                end_date=datetime.fromisoformat(data['end_date'].replace('Z', '+00:00')).date() if data.get('end_date') else None,
                location=data.get('location'),
                instructor=data.get('instructor'),
                max_participants=data.get('max_participants'),
                status=data.get('status', '予定'),
                materials=data.get('materials'),
            )
            session.add(training)
            session.commit()
            return {'success': True, 'data': self._serialize(training)}, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, t):
        return {
            'id': t.id,
            'title': t.title,
            'description': t.description,
            'training_type': t.training_type,
            'category': t.category,
            'duration_hours': t.duration_hours,
            'start_date': serialize_date(t.start_date),
            'end_date': serialize_date(t.end_date),
            'location': t.location,
            'instructor': t.instructor,
            'max_participants': t.max_participants,
            'current_participants': t.current_participants,
            'status': t.status,
            'materials': t.materials,
            'created_at': serialize_date(t.created_at),
            'updated_at': serialize_date(t.updated_at),
        }


# カレンダー管理API
class CalendarEventListResource(Resource):
    def get(self, worker_id=None):
        session = db.get_session()
        try:
            query = session.query(CalendarEvent)
            if worker_id:
                query = query.filter(
                    or_(
                        CalendarEvent.worker_id == worker_id,
                        CalendarEvent.worker_id.is_(None)
                    )
                )
            else:
                query = query.filter(CalendarEvent.worker_id.is_(None))
            
            events = query.order_by(CalendarEvent.start_datetime.asc()).all()
            return {'success': True, 'data': [self._serialize(e) for e in events]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id=None):
        session = db.get_session()
        try:
            data = request.get_json()
            event = CalendarEvent(
                worker_id=worker_id if worker_id else None,
                title=data.get('title'),
                description=data.get('description'),
                event_type=data.get('event_type'),
                start_datetime=datetime.fromisoformat(data['start_datetime'].replace('Z', '+00:00')) if data.get('start_datetime') else None,
                end_datetime=datetime.fromisoformat(data['end_datetime'].replace('Z', '+00:00')) if data.get('end_datetime') else None,
                location=data.get('location'),
                attendees=data.get('attendees'),
                is_all_day=data.get('is_all_day', False),
                reminder_minutes=data.get('reminder_minutes'),
                color=data.get('color', 'blue'),
            )
            session.add(event)
            session.commit()
            return {'success': True, 'data': self._serialize(event)}, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, e):
        return {
            'id': e.id,
            'worker_id': e.worker_id,
            'title': e.title,
            'description': e.description,
            'event_type': e.event_type,
            'start_datetime': serialize_date(e.start_datetime),
            'end_datetime': serialize_date(e.end_datetime),
            'location': e.location,
            'attendees': e.attendees,
            'is_all_day': e.is_all_day,
            'reminder_minutes': e.reminder_minutes,
            'color': e.color,
            'created_at': serialize_date(e.created_at),
            'updated_at': serialize_date(e.updated_at),
        }


# APIルートの登録
api.add_resource(WorkerListResource, '/api/workers')
api.add_resource(WorkerResource, '/api/workers/<int:worker_id>')
api.add_resource(WorkerProgressListResource, '/api/workers/<int:worker_id>/progress')
api.add_resource(WorkerProgressResource, '/api/workers/<int:worker_id>/progress/<int:progress_id>')

# 日本語能力管理API
class JapaneseProficiencyListResource(Resource):
    def get(self, worker_id):
        session = db.get_session()
        try:
            proficiencies = session.query(JapaneseProficiency).filter(
                JapaneseProficiency.worker_id == worker_id
            ).order_by(JapaneseProficiency.test_date.desc()).all()
            return {'success': True, 'data': [self._serialize(p) for p in proficiencies]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id):
        session = db.get_session()
        try:
            data = request.get_json()
            proficiency = JapaneseProficiency(
                worker_id=worker_id,
                test_date=datetime.fromisoformat(data['test_date'].replace('Z', '+00:00')).date() if data.get('test_date') else datetime.now().date(),
                test_type=data.get('test_type'),
                level=data.get('level'),
                reading_score=data.get('reading_score'),
                listening_score=data.get('listening_score'),
                writing_score=data.get('writing_score'),
                speaking_score=data.get('speaking_score'),
                total_score=data.get('total_score'),
                passed=data.get('passed', False),
                certificate_number=data.get('certificate_number'),
                certificate_issued_date=datetime.fromisoformat(data['certificate_issued_date'].replace('Z', '+00:00')).date() if data.get('certificate_issued_date') else None,
                notes=data.get('notes'),
            )
            session.add(proficiency)
            session.commit()
            return {'success': True, 'data': self._serialize(proficiency)}, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, p):
        """
        日本語能力記録をシリアライズ
        JapaneseProficiencyオブジェクトを辞書形式に変換
        
        Args:
            p: JapaneseProficiencyオブジェクト
        
        Returns:
            dict: シリアライズされた日本語能力記録データ
        """
        return {
            'id': p.id,
            'worker_id': p.worker_id,
            'test_date': serialize_date(p.test_date),
            'test_type': p.test_type,
            'level': p.level,
            'reading_score': p.reading_score,
            'listening_score': p.listening_score,
            'writing_score': p.writing_score,
            'speaking_score': p.speaking_score,
            'total_score': p.total_score,
            'passed': p.passed,
            'certificate_number': p.certificate_number,
            'certificate_issued_date': serialize_date(p.certificate_issued_date),
            'notes': p.notes,
            'created_at': serialize_date(p.created_at),
            'updated_at': serialize_date(p.updated_at),
        }


# 技能訓練管理API
class SkillTrainingListResource(Resource):
    """
    技能訓練一覧API
    就労者の技能訓練記録を管理するエンドポイント
    """
    
    def get(self, worker_id):
        """
        GET /api/workers/<worker_id>/skill-training
        指定された就労者の技能訓練記録一覧を取得
        
        Args:
            worker_id: 就労者ID
        
        Returns:
            dict: 技能訓練記録一覧
        """
        session = db.get_session()
        try:
            trainings = session.query(SkillTraining).filter(
                SkillTraining.worker_id == worker_id
            ).order_by(SkillTraining.training_start_date.desc()).all()
            return {'success': True, 'data': [self._serialize(t) for t in trainings]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id):
        """
        POST /api/workers/<worker_id>/skill-training
        新しい技能訓練記録を作成
        
        Args:
            worker_id: 就労者ID
        
        Returns:
            dict: 作成された技能訓練記録
        """
        session = db.get_session()
        try:
            data = request.get_json()
            training = SkillTraining(
                worker_id=worker_id,
                skill_category=data.get('skill_category'),
                skill_name=data.get('skill_name'),
                training_start_date=datetime.fromisoformat(data['training_start_date'].replace('Z', '+00:00')).date() if data.get('training_start_date') else datetime.now().date(),
                training_end_date=datetime.fromisoformat(data['training_end_date'].replace('Z', '+00:00')).date() if data.get('training_end_date') else None,
                training_hours=data.get('training_hours', 0),
                training_location=data.get('training_location'),
                instructor=data.get('instructor'),
                training_method=data.get('training_method'),
                status=data.get('status', '受講中'),
                completion_rate=data.get('completion_rate'),
                evaluation_score=data.get('evaluation_score'),
                certificate_issued=data.get('certificate_issued', False),
                certificate_number=data.get('certificate_number'),
                notes=data.get('notes'),
            )
            session.add(training)
            session.commit()
            return {'success': True, 'data': self._serialize(training)}, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, t):
        """
        技能訓練記録をシリアライズ
        SkillTrainingオブジェクトを辞書形式に変換
        
        Args:
            t: SkillTrainingオブジェクト
        
        Returns:
            dict: シリアライズされた技能訓練記録データ
        """
        return {
            'id': t.id,
            'worker_id': t.worker_id,
            'skill_category': t.skill_category,
            'skill_name': t.skill_name,
            'training_start_date': serialize_date(t.training_start_date),
            'training_end_date': serialize_date(t.training_end_date),
            'training_hours': t.training_hours,
            'training_location': t.training_location,
            'instructor': t.instructor,
            'training_method': t.training_method,
            'status': t.status,
            'completion_rate': t.completion_rate,
            'evaluation_score': t.evaluation_score,
            'certificate_issued': t.certificate_issued,
            'certificate_number': t.certificate_number,
            'notes': t.notes,
            'created_at': serialize_date(t.created_at),
            'updated_at': serialize_date(t.updated_at),
        }


# 日本語学習記録API
class JapaneseLearningRecordListResource(Resource):
    """
    日本語学習記録一覧API
    就労者の日本語学習記録を管理するエンドポイント
    """
    
    def get(self, worker_id):
        """
        GET /api/workers/<worker_id>/japanese-learning
        指定された就労者の日本語学習記録一覧を取得
        
        Args:
            worker_id: 就労者ID
        
        Returns:
            dict: 日本語学習記録一覧
        """
        session = db.get_session()
        try:
            records = session.query(JapaneseLearningRecord).filter(
                JapaneseLearningRecord.worker_id == worker_id
            ).order_by(JapaneseLearningRecord.learning_date.desc()).all()
            return {'success': True, 'data': [self._serialize(r) for r in records]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id):
        """
        POST /api/workers/<worker_id>/japanese-learning
        新しい日本語学習記録を作成
        
        Args:
            worker_id: 就労者ID
        
        Returns:
            dict: 作成された日本語学習記録
        """
        session = db.get_session()
        try:
            data = request.get_json()
            record = JapaneseLearningRecord(
                worker_id=worker_id,
                learning_date=datetime.fromisoformat(data['learning_date'].replace('Z', '+00:00')).date() if data.get('learning_date') else datetime.now().date(),
                learning_type=data.get('learning_type'),
                learning_content=data.get('learning_content'),
                topics_covered=data.get('topics_covered'),
                duration_minutes=data.get('duration_minutes'),
                vocabulary_learned=data.get('vocabulary_learned'),
                grammar_points=data.get('grammar_points'),
                practice_activities=data.get('practice_activities'),
                difficulty_level=data.get('difficulty_level'),
                self_rating=data.get('self_rating'),
                instructor_feedback=data.get('instructor_feedback'),
                homework_assigned=data.get('homework_assigned'),
                homework_completed=data.get('homework_completed', False),
                notes=data.get('notes'),
            )
            session.add(record)
            session.commit()
            return {'success': True, 'data': self._serialize(record)}, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, r):
        """
        日本語学習記録をシリアライズ
        JapaneseLearningRecordオブジェクトを辞書形式に変換
        
        Args:
            r: JapaneseLearningRecordオブジェクト
        
        Returns:
            dict: シリアライズされた日本語学習記録データ
        """
        return {
            'id': r.id,
            'worker_id': r.worker_id,
            'learning_date': serialize_date(r.learning_date),
            'learning_type': r.learning_type,
            'learning_content': r.learning_content,
            'topics_covered': r.topics_covered,
            'duration_minutes': r.duration_minutes,
            'vocabulary_learned': r.vocabulary_learned,
            'grammar_points': r.grammar_points,
            'practice_activities': r.practice_activities,
            'difficulty_level': r.difficulty_level,
            'self_rating': r.self_rating,
            'instructor_feedback': r.instructor_feedback,
            'homework_assigned': r.homework_assigned,
            'homework_completed': r.homework_completed,
            'notes': r.notes,
            'created_at': serialize_date(r.created_at),
            'updated_at': serialize_date(r.updated_at),
        }


# 来日前支援API
class PreDepartureSupportListResource(Resource):
    """
    来日前支援一覧API
    就労者の来日前支援記録を管理するエンドポイント
    """
    
    def get(self, worker_id):
        """
        GET /api/workers/<worker_id>/pre-departure-support
        指定された就労者の来日前支援記録一覧を取得
        
        Args:
            worker_id: 就労者ID
        
        Returns:
            dict: 来日前支援記録一覧
        """
        session = db.get_session()
        try:
            supports = session.query(PreDepartureSupport).filter(
                PreDepartureSupport.worker_id == worker_id
            ).order_by(PreDepartureSupport.support_date.desc()).all()
            return {'success': True, 'data': [self._serialize(s) for s in supports]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id):
        """
        POST /api/workers/<worker_id>/pre-departure-support
        新しい来日前支援記録を作成
        
        Args:
            worker_id: 就労者ID
        
        Returns:
            dict: 作成された来日前支援記録
        """
        session = db.get_session()
        try:
            data = request.get_json()
            support = PreDepartureSupport(
                worker_id=worker_id,
                support_type=data.get('support_type'),
                support_date=datetime.fromisoformat(data['support_date'].replace('Z', '+00:00')).date() if data.get('support_date') else datetime.now().date(),
                support_content=data.get('support_content'),
                status=data.get('status', '予定'),
                required_documents=data.get('required_documents'),
                documents_submitted=data.get('documents_submitted', False),
                support_staff=data.get('support_staff'),
                next_action=data.get('next_action'),
                next_action_date=datetime.fromisoformat(data['next_action_date'].replace('Z', '+00:00')).date() if data.get('next_action_date') else None,
                notes=data.get('notes'),
            )
            session.add(support)
            session.commit()
            return {'success': True, 'data': self._serialize(support)}, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, s):
        """
        来日前支援記録をシリアライズ
        PreDepartureSupportオブジェクトを辞書形式に変換
        
        Args:
            s: PreDepartureSupportオブジェクト
        
        Returns:
            dict: シリアライズされた来日前支援記録データ
        """
        return {
            'id': s.id,
            'worker_id': s.worker_id,
            'support_type': s.support_type,
            'support_date': serialize_date(s.support_date),
            'support_content': s.support_content,
            'status': s.status,
            'required_documents': s.required_documents,
            'documents_submitted': s.documents_submitted,
            'support_staff': s.support_staff,
            'next_action': s.next_action,
            'next_action_date': serialize_date(s.next_action_date),
            'notes': s.notes,
            'created_at': serialize_date(s.created_at),
            'updated_at': serialize_date(s.updated_at),
        }


# ============================================================================
# スクリーンショットアップロードAPI
# ============================================================================

class ScreenshotUploadResource(Resource):
    """
    スクリーンショットアップロードAPI
    フロントエンドからスクリーンショット画像をアップロード
    """
    
    def post(self):
        """
        POST /api/workers/screenshot
        スクリーンショット画像をアップロードしてDocumentとして保存
        """
        session_db = db.get_session()
        try:
            # ファイルの取得
            if 'file' not in request.files:
                return {'success': False, 'error': 'ファイルが指定されていません'}, 400
            
            file: FileStorage = request.files['file']
            if file.filename == '':
                return {'success': False, 'error': 'ファイル名が空です'}, 400
            
            # フォームデータの取得
            worker_id = request.form.get('worker_id')
            if not worker_id:
                return {'success': False, 'error': 'worker_idが指定されていません'}, 400
            
            worker_id = int(worker_id)
            title = request.form.get('title', f'スクリーンショット {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
            description = request.form.get('description', '画面キャプチャ')
            
            # ファイル情報の取得
            filename = secure_filename(file.filename)
            file_size = len(file.read())
            file.seek(0)  # ファイルポインタをリセット
            
            # 保存ディレクトリの作成
            upload_dir = os.path.join('uploads', 'screenshots')
            os.makedirs(upload_dir, exist_ok=True)
            
            # ファイルパスの生成
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            safe_filename = f"{worker_id}_{timestamp}_{filename}"
            file_path = os.path.join(upload_dir, safe_filename)
            
            # ファイルの保存
            file.save(file_path)
            
            app.logger.info(f'Screenshot uploaded: worker_id={worker_id}, file_path={file_path}, size={file_size}')
            
            # Documentレコードの作成
            document = Document(
                worker_id=worker_id,
                document_type='screenshot',
                title=title,
                file_path=file_path,
                file_name=filename,
                file_size=file_size,
                mime_type=file.content_type or 'image/png',
                description=description,
                is_required=False,
                is_verified=False,
                uploaded_by=session.get('username', 'system'),
            )
            session_db.add(document)
            session_db.commit()
            
            return {
                'success': True,
                'data': {
                    'id': document.id,
                    'worker_id': document.worker_id,
                    'document_type': document.document_type,
                    'title': document.title,
                    'file_path': document.file_path,
                    'file_name': document.file_name,
                    'file_size': document.file_size,
                    'mime_type': document.mime_type,
                    'created_at': serialize_date(document.created_at),
                }
            }, 201
        except Exception as e:
            session_db.rollback()
            app.logger.error(f'Screenshot upload error: {str(e)}', exc_info=True)
            return {'success': False, 'error': str(e)}, 500
        finally:
            session_db.close()


# ============================================================================
# ファイル取得API
# ============================================================================

@app.route('/api/files/<path:file_path>')
def get_file(file_path):
    """
    ファイルを取得するエンドポイント
    セキュリティのため、uploadsディレクトリ内のファイルのみアクセス可能
    """
    try:
        # セキュリティチェック：uploadsディレクトリ内のファイルのみ許可
        if not file_path.startswith('uploads/'):
            return {'success': False, 'error': 'Invalid file path'}, 403
        
        # ファイルパスの構築
        full_path = os.path.join(os.getcwd(), file_path)
        
        # ファイルが存在するか確認
        if not os.path.exists(full_path):
            return {'success': False, 'error': 'File not found'}, 404
        
        # ファイルを返す
        return send_file(full_path)
    except Exception as e:
        app.logger.error(f'File retrieval error: {str(e)}', exc_info=True)
        return {'success': False, 'error': str(e)}, 500


# 拡張機能のAPIルート
api.add_resource(DocumentListResource, '/api/workers/<int:worker_id>/documents')
api.add_resource(ScreenshotUploadResource, '/api/workers/screenshot')
api.add_resource(NotificationListResourceAll, '/api/notifications')
api.add_resource(NotificationWorkerResource, '/api/workers/<int:worker_id>/notifications')
api.add_resource(TrainingListResource, '/api/trainings')
api.add_resource(CalendarEventListResource, '/api/calendar', '/api/workers/<int:worker_id>/calendar')

# 日本語能力管理API - 個別リソース
class JapaneseProficiencyResource(Resource):
    def get(self, worker_id, proficiency_id):
        session = db.get_session()
        try:
            proficiency = session.query(JapaneseProficiency).filter(
                JapaneseProficiency.id == proficiency_id,
                JapaneseProficiency.worker_id == worker_id
            ).first()
            
            if not proficiency:
                return {'success': False, 'error': 'Proficiency not found'}, 404
            
            return {'success': True, 'data': JapaneseProficiencyListResource()._serialize(proficiency)}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def put(self, worker_id, proficiency_id):
        session = db.get_session()
        try:
            proficiency = session.query(JapaneseProficiency).filter(
                JapaneseProficiency.id == proficiency_id,
                JapaneseProficiency.worker_id == worker_id
            ).first()
            
            if not proficiency:
                return {'success': False, 'error': 'Proficiency not found'}, 404
            
            data = request.get_json()
            
            if 'test_date' in data:
                proficiency.test_date = datetime.fromisoformat(data['test_date'].replace('Z', '+00:00')).date() if data['test_date'] else None
            if 'test_type' in data:
                proficiency.test_type = data['test_type']
            if 'level' in data:
                proficiency.level = data.get('level')
            if 'reading_score' in data:
                proficiency.reading_score = data.get('reading_score')
            if 'listening_score' in data:
                proficiency.listening_score = data.get('listening_score')
            if 'writing_score' in data:
                proficiency.writing_score = data.get('writing_score')
            if 'speaking_score' in data:
                proficiency.speaking_score = data.get('speaking_score')
            if 'total_score' in data:
                proficiency.total_score = data.get('total_score')
            if 'passed' in data:
                proficiency.passed = data.get('passed')
            if 'certificate_number' in data:
                proficiency.certificate_number = data.get('certificate_number')
            if 'certificate_issued_date' in data:
                proficiency.certificate_issued_date = datetime.fromisoformat(data['certificate_issued_date'].replace('Z', '+00:00')).date() if data['certificate_issued_date'] else None
            if 'notes' in data:
                proficiency.notes = data.get('notes')
            
            proficiency.updated_at = datetime.now()
            session.commit()
            
            return {'success': True, 'data': JapaneseProficiencyListResource()._serialize(proficiency)}, 200
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def delete(self, worker_id, proficiency_id):
        session = db.get_session()
        try:
            proficiency = session.query(JapaneseProficiency).filter(
                JapaneseProficiency.id == proficiency_id,
                JapaneseProficiency.worker_id == worker_id
            ).first()
            
            if not proficiency:
                return {'success': False, 'error': 'Proficiency not found'}, 404
            
            session.delete(proficiency)
            session.commit()
            
            return {'success': True, 'message': 'Proficiency deleted'}, 200
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()


# 技能訓練管理API - 個別リソース
class SkillTrainingResource(Resource):
    def get(self, worker_id, training_id):
        session = db.get_session()
        try:
            training = session.query(SkillTraining).filter(
                SkillTraining.id == training_id,
                SkillTraining.worker_id == worker_id
            ).first()
            
            if not training:
                return {'success': False, 'error': 'Training not found'}, 404
            
            return {'success': True, 'data': SkillTrainingListResource()._serialize(training)}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def put(self, worker_id, training_id):
        session = db.get_session()
        try:
            training = session.query(SkillTraining).filter(
                SkillTraining.id == training_id,
                SkillTraining.worker_id == worker_id
            ).first()
            
            if not training:
                return {'success': False, 'error': 'Training not found'}, 404
            
            data = request.get_json()
            
            if 'skill_category' in data:
                training.skill_category = data['skill_category']
            if 'skill_name' in data:
                training.skill_name = data['skill_name']
            if 'training_start_date' in data:
                training.training_start_date = datetime.fromisoformat(data['training_start_date'].replace('Z', '+00:00')).date() if data['training_start_date'] else None
            if 'training_end_date' in data:
                training.training_end_date = datetime.fromisoformat(data['training_end_date'].replace('Z', '+00:00')).date() if data['training_end_date'] else None
            if 'training_hours' in data:
                training.training_hours = data.get('training_hours', 0)
            if 'training_location' in data:
                training.training_location = data.get('training_location')
            if 'instructor' in data:
                training.instructor = data.get('instructor')
            if 'training_method' in data:
                training.training_method = data.get('training_method')
            if 'status' in data:
                training.status = data.get('status')
            if 'completion_rate' in data:
                training.completion_rate = data.get('completion_rate')
            if 'evaluation_score' in data:
                training.evaluation_score = data.get('evaluation_score')
            if 'certificate_issued' in data:
                training.certificate_issued = data.get('certificate_issued')
            if 'certificate_number' in data:
                training.certificate_number = data.get('certificate_number')
            if 'notes' in data:
                training.notes = data.get('notes')
            
            training.updated_at = datetime.now()
            session.commit()
            
            return {'success': True, 'data': SkillTrainingListResource()._serialize(training)}, 200
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def delete(self, worker_id, training_id):
        session = db.get_session()
        try:
            training = session.query(SkillTraining).filter(
                SkillTraining.id == training_id,
                SkillTraining.worker_id == worker_id
            ).first()
            
            if not training:
                return {'success': False, 'error': 'Training not found'}, 404
            
            session.delete(training)
            session.commit()
            
            return {'success': True, 'message': 'Training deleted'}, 200
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()


# 技能訓練と日本語能力管理のAPIルート
api.add_resource(JapaneseProficiencyListResource, '/api/workers/<int:worker_id>/japanese-proficiency')
api.add_resource(JapaneseProficiencyResource, '/api/workers/<int:worker_id>/japanese-proficiency/<int:proficiency_id>')
api.add_resource(SkillTrainingListResource, '/api/workers/<int:worker_id>/skill-training')
api.add_resource(SkillTrainingResource, '/api/workers/<int:worker_id>/skill-training/<int:training_id>')
api.add_resource(JapaneseLearningRecordListResource, '/api/workers/<int:worker_id>/japanese-learning')
api.add_resource(PreDepartureSupportListResource, '/api/workers/<int:worker_id>/pre-departure-support')


# 訓練メニュー管理API
class TrainingMenuListResource(Resource):
    def get(self):
        session = db.get_session()
        try:
            active_only = request.args.get('active_only', 'false').lower() == 'true'
            query = session.query(TrainingMenu)
            if active_only:
                query = query.filter(TrainingMenu.is_active == True)
            menus = query.order_by(TrainingMenu.created_at.desc()).all()
            return {'success': True, 'data': [self._serialize(m) for m in menus]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self):
        session = db.get_session()
        try:
            data = request.get_json()
            menu = TrainingMenu(
                menu_name=data.get('menu_name'),
                scenario_id=data.get('scenario_id'),
                scenario_description=data.get('scenario_description'),
                target_safety_score=data.get('target_safety_score'),
                target_error_count=data.get('target_error_count'),
                target_procedure_compliance=data.get('target_procedure_compliance'),
                target_work_time=data.get('target_work_time'),
                target_achievement_rate=data.get('target_achievement_rate'),
                equipment_type=data.get('equipment_type'),
                difficulty_level=data.get('difficulty_level'),
                time_limit=data.get('time_limit'),
                is_active=data.get('is_active', True),
                created_by=data.get('created_by'),
            )
            session.add(menu)
            session.commit()
            return {'success': True, 'data': self._serialize(menu)}, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, m):
        return {
            'id': m.id,
            'menu_name': m.menu_name,
            'scenario_id': m.scenario_id,
            'scenario_description': m.scenario_description,
            'target_safety_score': m.target_safety_score,
            'target_error_count': m.target_error_count,
            'target_procedure_compliance': m.target_procedure_compliance,
            'target_work_time': m.target_work_time,
            'target_achievement_rate': m.target_achievement_rate,
            'equipment_type': m.equipment_type,
            'difficulty_level': m.difficulty_level,
            'time_limit': m.time_limit,
            'is_active': m.is_active,
            'created_by': m.created_by,
            'created_at': serialize_date(m.created_at),
            'updated_at': serialize_date(m.updated_at),
        }


class TrainingMenuResource(Resource):
    def get(self, menu_id):
        session = db.get_session()
        try:
            menu = session.query(TrainingMenu).filter(TrainingMenu.id == menu_id).first()
            if not menu:
                return {'success': False, 'error': 'Menu not found'}, 404
            return {'success': True, 'data': TrainingMenuListResource()._serialize(menu)}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def put(self, menu_id):
        session = db.get_session()
        try:
            menu = session.query(TrainingMenu).filter(TrainingMenu.id == menu_id).first()
            if not menu:
                return {'success': False, 'error': 'Menu not found'}, 404
            
            data = request.get_json()
            if 'menu_name' in data:
                menu.menu_name = data['menu_name']
            if 'scenario_id' in data:
                menu.scenario_id = data['scenario_id']
            if 'scenario_description' in data:
                menu.scenario_description = data.get('scenario_description')
            if 'target_safety_score' in data:
                menu.target_safety_score = data.get('target_safety_score')
            if 'target_error_count' in data:
                menu.target_error_count = data.get('target_error_count')
            if 'target_procedure_compliance' in data:
                menu.target_procedure_compliance = data.get('target_procedure_compliance')
            if 'target_work_time' in data:
                menu.target_work_time = data.get('target_work_time')
            if 'target_achievement_rate' in data:
                menu.target_achievement_rate = data.get('target_achievement_rate')
            if 'equipment_type' in data:
                menu.equipment_type = data['equipment_type']
            if 'difficulty_level' in data:
                menu.difficulty_level = data['difficulty_level']
            if 'time_limit' in data:
                menu.time_limit = data.get('time_limit')
            if 'is_active' in data:
                menu.is_active = data.get('is_active')
            
            menu.updated_at = datetime.now()
            session.commit()
            return {'success': True, 'data': TrainingMenuListResource()._serialize(menu)}, 200
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def delete(self, menu_id):
        session = db.get_session()
        try:
            menu = session.query(TrainingMenu).filter(TrainingMenu.id == menu_id).first()
            if not menu:
                return {'success': False, 'error': 'Menu not found'}, 404
            session.delete(menu)
            session.commit()
            return {'success': True, 'message': 'Menu deleted'}, 200
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()


# 訓練メニュー割り当てAPI
class TrainingMenuAssignmentListResource(Resource):
    def get(self, worker_id):
        session = db.get_session()
        try:
            assignments = session.query(TrainingMenuAssignment).filter(
                TrainingMenuAssignment.worker_id == worker_id
            ).order_by(TrainingMenuAssignment.assigned_date.desc()).all()
            return {'success': True, 'data': [self._serialize(a) for a in assignments]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id):
        session = db.get_session()
        try:
            data = request.get_json()
            assignment = TrainingMenuAssignment(
                worker_id=worker_id,
                training_menu_id=data.get('training_menu_id'),
                assigned_date=datetime.fromisoformat(data['assigned_date'].replace('Z', '+00:00')).date() if data.get('assigned_date') else datetime.now().date(),
                deadline=datetime.fromisoformat(data['deadline'].replace('Z', '+00:00')).date() if data.get('deadline') else None,
                status=data.get('status', '未開始'),
                notes=data.get('notes'),
            )
            session.add(assignment)
            session.commit()
            return {'success': True, 'data': self._serialize(assignment)}, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, a):
        menu = a.training_menu
        return {
            'id': a.id,
            'worker_id': a.worker_id,
            'training_menu_id': a.training_menu_id,
            'menu_name': menu.menu_name if menu else None,
            'scenario_id': menu.scenario_id if menu else None,
            'equipment_type': menu.equipment_type if menu else None,
            'difficulty_level': menu.difficulty_level if menu else None,
            'assigned_date': serialize_date(a.assigned_date),
            'deadline': serialize_date(a.deadline),
            'status': a.status,
            'completed_at': serialize_date(a.completed_at),
            'notes': a.notes,
            'created_at': serialize_date(a.created_at),
        }


# Unity連携：訓練セッション受信API
class TrainingSessionResource(Resource):
    def post(self):
        """Unityから訓練結果を受信"""
        session = db.get_session()
        try:
            data = request.get_json()
            
            # 訓練セッション作成
            training_session = TrainingSession(
                session_id=data.get('sessionId'),
                worker_id=data.get('traineeId'),
                training_menu_id=data.get('training_menu_id'),
                session_start_time=datetime.fromisoformat(data['session_start_time'].replace('Z', '+00:00')) if data.get('session_start_time') else datetime.now(),
                session_end_time=datetime.fromisoformat(data['session_end_time'].replace('Z', '+00:00')) if data.get('session_end_time') else datetime.now(),
                duration_seconds=data.get('duration_seconds'),
                status=data.get('status', '完了'),
            )
            session.add(training_session)
            session.flush()
            
            # KPIスコア保存
            kpi_data = data.get('kpi', {})
            if kpi_data:
                kpi_score = KPIScore(
                    training_session_id=training_session.id,
                    safety_score=kpi_data.get('safetyScore'),
                    error_count=kpi_data.get('errorCount', 0),
                    procedure_compliance_rate=kpi_data.get('procedureComplianceRate'),
                    work_time_seconds=kpi_data.get('workTimeSeconds'),
                    achievement_rate=kpi_data.get('achievementRate'),
                    accuracy_score=kpi_data.get('accuracyScore'),
                    efficiency_score=kpi_data.get('efficiencyScore'),
                    overall_score=kpi_data.get('overallScore'),
                    notes=kpi_data.get('notes'),
                )
                session.add(kpi_score)
            
            # 操作ログ保存
            operation_logs = data.get('operationLogs', [])
            for log_data in operation_logs:
                operation_log = OperationLog(
                    training_session_id=training_session.id,
                    timestamp=datetime.fromisoformat(log_data['timestamp'].replace('Z', '+00:00')) if log_data.get('timestamp') else datetime.now(),
                    operation_type=log_data.get('operationType'),
                    operation_value=log_data.get('operationValue'),
                    equipment_state=log_data.get('equipmentState'),
                    position_x=log_data.get('positionX'),
                    position_y=log_data.get('positionY'),
                    position_z=log_data.get('positionZ'),
                    velocity=log_data.get('velocity'),
                    error_event=log_data.get('errorEvent', False),
                    error_description=log_data.get('errorDescription'),
                )
                session.add(operation_log)
            
            session.commit()
            return {'success': True, 'message': 'Training session saved', 'session_id': training_session.id}, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def get(self, session_id):
        """訓練セッション詳細取得"""
        session = db.get_session()
        try:
            training_session = session.query(TrainingSession).filter(
                TrainingSession.session_id == session_id
            ).first()
            
            if not training_session:
                return {'success': False, 'error': 'Session not found'}, 404
            
            kpi = training_session.kpi_scores[0] if training_session.kpi_scores else None
            operation_logs = training_session.operation_logs[:100]  # 最新100件
            
            return {
                'success': True,
                'data': {
                    'session_id': training_session.session_id,
                    'worker_id': training_session.worker_id,
                    'training_menu_id': training_session.training_menu_id,
                    'session_start_time': serialize_date(training_session.session_start_time),
                    'session_end_time': serialize_date(training_session.session_end_time),
                    'duration_seconds': training_session.duration_seconds,
                    'status': training_session.status,
                    'kpi': {
                        'safety_score': kpi.safety_score if kpi else None,
                        'error_count': kpi.error_count if kpi else None,
                        'procedure_compliance_rate': kpi.procedure_compliance_rate if kpi else None,
                        'work_time_seconds': kpi.work_time_seconds if kpi else None,
                        'achievement_rate': kpi.achievement_rate if kpi else None,
                        'overall_score': kpi.overall_score if kpi else None,
                    } if kpi else None,
                    'operation_logs_count': len(training_session.operation_logs),
                    'created_at': serialize_date(training_session.created_at),
                }
            }, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()


# 訓練セッション一覧API（作業員別）
class TrainingSessionListResource(Resource):
    def get(self, worker_id):
        session = db.get_session()
        try:
            # worker_idが0の場合、worker_idがnullの訓練セッションも含めて取得
            if worker_id == 0:
                sessions = session.query(TrainingSession).filter(
                    (TrainingSession.worker_id == worker_id) | (TrainingSession.worker_id.is_(None))
                ).order_by(TrainingSession.session_start_time.desc()).all()
            else:
                sessions = session.query(TrainingSession).filter(
                    TrainingSession.worker_id == worker_id
                ).order_by(TrainingSession.session_start_time.desc()).all()
            
            return {
                'success': True,
                'data': [{
                    'session_id': s.session_id,
                    'training_menu_id': s.training_menu_id,
                    'session_start_time': serialize_date(s.session_start_time),
                    'session_end_time': serialize_date(s.session_end_time),
                    'duration_seconds': s.duration_seconds,
                    'status': s.status,
                    'kpi': {
                        'safety_score': s.kpi_scores[0].safety_score if s.kpi_scores else None,
                        'error_count': s.kpi_scores[0].error_count if s.kpi_scores else None,
                        'overall_score': s.kpi_scores[0].overall_score if s.kpi_scores else None,
                    } if s.kpi_scores else None,
                } for s in sessions]
            }, 200
        except Exception as e:
            app.logger.error(f'TrainingSessionListResource error (worker_id={worker_id}): {str(e)}', exc_info=True)
            import traceback
            traceback.print_exc()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()


# マイルストーン管理API
class MilestoneListResource(Resource):
    def get(self, worker_id):
        session = db.get_session()
        try:
            milestones = session.query(Milestone).filter(
                Milestone.worker_id == worker_id
            ).order_by(Milestone.target_date.desc()).all()
            return {'success': True, 'data': [self._serialize(m) for m in milestones]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id):
        session = db.get_session()
        try:
            data = request.get_json()
            milestone = Milestone(
                worker_id=worker_id,
                milestone_name=data.get('milestone_name'),
                milestone_type=data.get('milestone_type'),
                target_date=datetime.fromisoformat(data['target_date'].replace('Z', '+00:00')).date() if data.get('target_date') else None,
                achieved_date=datetime.fromisoformat(data['achieved_date'].replace('Z', '+00:00')).date() if data.get('achieved_date') else None,
                status=data.get('status', '未達成'),
                certificate_number=data.get('certificate_number'),
                certificate_file_path=data.get('certificate_file_path'),
                evidence_report_id=data.get('evidence_report_id'),
                notes=data.get('notes'),
            )
            session.add(milestone)
            session.commit()
            return {'success': True, 'data': self._serialize(milestone)}, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, m):
        return {
            'id': m.id,
            'worker_id': m.worker_id,
            'milestone_name': m.milestone_name,
            'milestone_type': m.milestone_type,
            'target_date': serialize_date(m.target_date),
            'achieved_date': serialize_date(m.achieved_date),
            'status': m.status,
            'certificate_number': m.certificate_number,
            'certificate_file_path': m.certificate_file_path,
            'evidence_report_id': m.evidence_report_id,
            'notes': m.notes,
            'created_at': serialize_date(m.created_at),
            'updated_at': serialize_date(m.updated_at),
        }


# キャリアパス管理API
class CareerPathListResource(Resource):
    def get(self, worker_id):
        session = db.get_session()
        try:
            paths = session.query(CareerPath).filter(
                CareerPath.worker_id == worker_id
            ).order_by(CareerPath.stage_start_date.asc()).all()
            return {'success': True, 'data': [self._serialize(p) for p in paths]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id):
        session = db.get_session()
        try:
            data = request.get_json()
            career_path = CareerPath(
                worker_id=worker_id,
                path_stage=data.get('path_stage'),
                stage_start_date=datetime.fromisoformat(data['stage_start_date'].replace('Z', '+00:00')).date() if data.get('stage_start_date') else datetime.now().date(),
                stage_end_date=datetime.fromisoformat(data['stage_end_date'].replace('Z', '+00:00')).date() if data.get('stage_end_date') else None,
                status=data.get('status', '予定'),
                target_japanese_level=data.get('target_japanese_level'),
                target_skill_level=data.get('target_skill_level'),
                achieved_japanese_level=data.get('achieved_japanese_level'),
                achieved_skill_level=data.get('achieved_skill_level'),
                transition_date=datetime.fromisoformat(data['transition_date'].replace('Z', '+00:00')).date() if data.get('transition_date') else None,
                notes=data.get('notes'),
            )
            session.add(career_path)
            session.commit()
            return {'success': True, 'data': self._serialize(career_path)}, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, p):
        return {
            'id': p.id,
            'worker_id': p.worker_id,
            'path_stage': p.path_stage,
            'stage_start_date': serialize_date(p.stage_start_date),
            'stage_end_date': serialize_date(p.stage_end_date),
            'status': p.status,
            'target_japanese_level': p.target_japanese_level,
            'target_skill_level': p.target_skill_level,
            'achieved_japanese_level': p.achieved_japanese_level,
            'achieved_skill_level': p.achieved_skill_level,
            'transition_date': serialize_date(p.transition_date),
            'notes': p.notes,
            'created_at': serialize_date(p.created_at),
            'updated_at': serialize_date(p.updated_at),
        }


# 統合ダッシュボードAPI（KPIと日本語能力の統合可視化）
class IntegratedDashboardResource(Resource):
    def get(self, worker_id):
        session = db.get_session()
        try:
            # worker_idが0の場合は空のデータを返す
            if worker_id == 0:
                return {
                    'success': True,
                    'data': {
                        'kpi_timeline': [],
                        'japanese_proficiency': [],
                        'summary': {
                            'total_sessions': 0,
                            'total_training_hours': 0,
                            'average_overall_score': 0,
                            'latest_overall_score': None,
                            'total_milestones': 0,
                            'achieved_milestones': 0,
                            'milestone_achievement_rate': 0,
                        },
                        'recent_milestones': [],
                        'recent_progress': [],
                    }
                }, 200
            
            # 作業員情報取得
            worker = session.query(Worker).filter(Worker.id == worker_id).first()
            if not worker:
                return {'success': False, 'error': 'Worker not found'}, 404
            
            # 訓練セッションのKPI集計
            sessions = session.query(TrainingSession).filter(
                TrainingSession.worker_id == worker_id
            ).order_by(TrainingSession.session_start_time.desc()).limit(30).all()
            
            kpi_data = []
            total_training_hours = 0
            overall_scores = []
            latest_overall_score = None
            
            for s in sessions:
                # kpi_scoresリレーションシップから最初のKPIスコアを取得
                kpi_scores_list = list(s.kpi_scores) if s.kpi_scores else []
                kpi = kpi_scores_list[0] if kpi_scores_list else None
                if kpi:
                    kpi_data.append({
                        'date': serialize_date(s.session_start_time),
                        'safety_score': kpi.safety_score,
                        'error_count': kpi.error_count,
                        'procedure_compliance_rate': kpi.procedure_compliance_rate,
                        'achievement_rate': kpi.achievement_rate,
                        'overall_score': kpi.overall_score,
                    })
                    if kpi.overall_score is not None:
                        overall_scores.append(kpi.overall_score)
                    if latest_overall_score is None and kpi.overall_score is not None:
                        latest_overall_score = kpi.overall_score
                
                # 訓練時間を集計
                if s.duration_seconds:
                    total_training_hours += s.duration_seconds / 3600.0
            
            # 平均スコア計算
            average_overall_score = sum(overall_scores) / len(overall_scores) if overall_scores else 0
            
            # 日本語能力データ
            proficiencies = session.query(JapaneseProficiency).filter(
                JapaneseProficiency.worker_id == worker_id
            ).order_by(JapaneseProficiency.test_date.desc()).limit(10).all()
            
            japanese_data = [{
                'date': serialize_date(p.test_date),
                'test_type': p.test_type,
                'level': p.level,
                'total_score': p.total_score,
                'passed': p.passed,
            } for p in proficiencies]
            
            # マイルストーン情報
            milestones = session.query(Milestone).filter(
                Milestone.worker_id == worker_id
            ).order_by(Milestone.target_date.desc()).limit(10).all()
            
            achieved_count = sum(1 for m in milestones if m.status == '達成')
            total_milestones = len(milestones)
            milestone_achievement_rate = (achieved_count / total_milestones * 100) if total_milestones > 0 else 0
            
            recent_milestones = [{
                'id': m.id,
                'milestone_name': m.milestone_name,
                'milestone_type': m.milestone_type,
                'target_date': serialize_date(m.target_date),
                'achieved_date': serialize_date(m.achieved_date),
                'status': m.status,
            } for m in milestones]
            
            # 最近の進捗記録
            recent_progress = session.query(WorkerProgress).filter(
                WorkerProgress.worker_id == worker_id
            ).order_by(WorkerProgress.progress_date.desc()).limit(5).all()
            
            recent_progress_data = [{
                'id': p.id,
                'progress_date': serialize_date(p.progress_date),
                'progress_type': p.progress_type,
                'title': p.title,
                'status': p.status,
            } for p in recent_progress]
            
            # サマリー情報
            summary = {
                'total_sessions': len(sessions),
                'total_training_hours': round(total_training_hours, 2),
                'average_overall_score': round(average_overall_score, 1) if overall_scores else None,
                'latest_overall_score': round(latest_overall_score, 1) if latest_overall_score is not None else None,
                'total_milestones': total_milestones,
                'achieved_milestones': achieved_count,
                'milestone_achievement_rate': round(milestone_achievement_rate, 1),
            }
            
            return {
                'success': True,
                'data': {
                    'kpi_timeline': kpi_data,
                    'japanese_proficiency': japanese_data,
                    'summary': summary,
                    'recent_milestones': recent_milestones,
                    'recent_progress': recent_progress_data,
                }
            }, 200
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()


# APIルート登録
api.add_resource(TrainingMenuListResource, '/api/training-menus')
api.add_resource(TrainingMenuResource, '/api/training-menus/<int:menu_id>')
api.add_resource(TrainingMenuAssignmentListResource, '/api/workers/<int:worker_id>/training-menu-assignments')
api.add_resource(TrainingSessionResource, '/api/training-sessions', '/api/training-sessions/<string:session_id>')
api.add_resource(TrainingSessionListResource, '/api/workers/<int:worker_id>/training-sessions')
api.add_resource(MilestoneListResource, '/api/workers/<int:worker_id>/milestones')
api.add_resource(CareerPathListResource, '/api/workers/<int:worker_id>/career-paths')
api.add_resource(IntegratedDashboardResource, '/api/workers/<int:worker_id>/dashboard/integrated')


# 証跡レポート出力API
class EvidenceReportResource(Resource):
    def get(self, worker_id):
        """証跡レポート出力（PDF/CSV）"""
        session = db.get_session()
        try:
            format_type = request.args.get('format', 'pdf')  # pdf or csv
            period_start = request.args.get('period_start')
            period_end = request.args.get('period_end')
            
            # 作業員情報取得
            worker = session.query(Worker).filter(Worker.id == worker_id).first()
            if not worker:
                return {'success': False, 'error': 'Worker not found'}, 404
            
            # 訓練セッション取得
            query = session.query(TrainingSession).filter(TrainingSession.worker_id == worker_id)
            if period_start:
                query = query.filter(TrainingSession.session_start_time >= datetime.fromisoformat(period_start))
            if period_end:
                query = query.filter(TrainingSession.session_start_time <= datetime.fromisoformat(period_end))
            sessions = query.order_by(TrainingSession.session_start_time.desc()).all()
            
            # KPIデータ取得
            kpi_data = []
            for s in sessions:
                kpi = s.kpi_scores[0] if s.kpi_scores else None
                if kpi:
                    kpi_data.append({
                        'session_id': s.session_id,
                        'date': s.session_start_time,
                        'safety_score': kpi.safety_score,
                        'error_count': kpi.error_count,
                        'procedure_compliance_rate': kpi.procedure_compliance_rate,
                        'achievement_rate': kpi.achievement_rate,
                        'overall_score': kpi.overall_score,
                    })
            
            # 日本語能力データ取得
            proficiencies = session.query(JapaneseProficiency).filter(
                JapaneseProficiency.worker_id == worker_id
            ).order_by(JapaneseProficiency.test_date.desc()).all()
            
            # マイルストーン取得
            milestones = session.query(Milestone).filter(
                Milestone.worker_id == worker_id
            ).order_by(Milestone.target_date.desc()).all()
            
            if format_type == 'csv':
                # CSV形式で出力
                output = io.StringIO()
                writer = csv.writer(output)
                
                # ヘッダー
                writer.writerow(['証跡レポート', worker.name or ''])
                writer.writerow(['生成日時', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
                writer.writerow([])
                
                # 訓練セッションKPI
                writer.writerow(['訓練セッションKPI'])
                writer.writerow(['セッションID', '日時', '安全動作率', 'エラー件数', '手順遵守率', '達成率', '総合スコア'])
                for kpi in kpi_data:
                    writer.writerow([
                        kpi['session_id'],
                        kpi['date'].strftime('%Y-%m-%d %H:%M:%S') if isinstance(kpi['date'], datetime) else kpi['date'],
                        kpi['safety_score'],
                        kpi['error_count'],
                        kpi['procedure_compliance_rate'],
                        kpi['achievement_rate'],
                        kpi['overall_score'],
                    ])
                writer.writerow([])
                
                # 日本語能力
                writer.writerow(['日本語能力'])
                writer.writerow(['試験日', '試験種別', 'レベル', '総合スコア', '合格/不合格'])
                for p in proficiencies:
                    writer.writerow([
                        p.test_date.strftime('%Y-%m-%d') if isinstance(p.test_date, date) else p.test_date,
                        p.test_type,
                        p.level or '',
                        p.total_score or '',
                        '合格' if p.passed else '不合格',
                    ])
                writer.writerow([])
                
                # マイルストーン
                writer.writerow(['マイルストーン'])
                writer.writerow(['マイルストーン名', 'タイプ', '目標日', '達成日', 'ステータス'])
                for m in milestones:
                    writer.writerow([
                        m.milestone_name,
                        m.milestone_type,
                        m.target_date.strftime('%Y-%m-%d') if m.target_date and isinstance(m.target_date, date) else '',
                        m.achieved_date.strftime('%Y-%m-%d') if m.achieved_date and isinstance(m.achieved_date, date) else '',
                        m.status,
                    ])
                
                output.seek(0)
                return Response(
                    output.getvalue(),
                    mimetype='text/csv',
                    headers={'Content-Disposition': f'attachment; filename=evidence_report_{worker_id}_{datetime.now().strftime("%Y%m%d")}.csv'}
                )
            else:
                # PDF形式で出力（簡易版 - テキストベース）
                from reportlab.lib.pagesizes import A4
                from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
                from reportlab.lib.units import mm
                from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
                from reportlab.lib import colors
                
                buffer = io.BytesIO()
                doc = SimpleDocTemplate(buffer, pagesize=A4)
                story = []
                styles = getSampleStyleSheet()
                
                # タイトル
                title_style = ParagraphStyle(
                    'CustomTitle',
                    parent=styles['Heading1'],
                    fontSize=18,
                    textColor=colors.HexColor('#1e40af'),
                    spaceAfter=30,
                )
                story.append(Paragraph('証跡レポート', title_style))
                story.append(Paragraph(f'作業員: {worker.name or "N/A"}', styles['Normal']))
                story.append(Paragraph(f'生成日時: {datetime.now().strftime("%Y年%m月%d日 %H:%M:%S")}', styles['Normal']))
                story.append(Spacer(1, 12))
                
                # 訓練セッションKPI
                story.append(Paragraph('訓練セッションKPI', styles['Heading2']))
                kpi_table_data = [['セッションID', '日時', '安全動作率', 'エラー件数', '総合スコア']]
                for kpi in kpi_data[:20]:  # 最新20件
                    kpi_table_data.append([
                        kpi['session_id'][:10] + '...' if len(kpi['session_id']) > 10 else kpi['session_id'],
                        kpi['date'].strftime('%Y-%m-%d') if isinstance(kpi['date'], datetime) else str(kpi['date'])[:10],
                        f"{kpi['safety_score']:.1f}" if kpi['safety_score'] else 'N/A',
                        str(kpi['error_count']) if kpi['error_count'] else '0',
                        f"{kpi['overall_score']:.1f}" if kpi['overall_score'] else 'N/A',
                    ])
                
                kpi_table = Table(kpi_table_data)
                kpi_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ]))
                story.append(kpi_table)
                story.append(Spacer(1, 12))
                
                # 日本語能力
                story.append(Paragraph('日本語能力', styles['Heading2']))
                jp_table_data = [['試験日', '試験種別', 'レベル', '総合スコア', '合格/不合格']]
                for p in proficiencies[:10]:
                    jp_table_data.append([
                        p.test_date.strftime('%Y-%m-%d') if isinstance(p.test_date, date) else str(p.test_date)[:10],
                        p.test_type or '',
                        p.level or '',
                        str(p.total_score) if p.total_score else 'N/A',
                        '合格' if p.passed else '不合格',
                    ])
                
                jp_table = Table(jp_table_data)
                jp_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ]))
                story.append(jp_table)
                story.append(Spacer(1, 12))
                
                # マイルストーン
                story.append(Paragraph('マイルストーン', styles['Heading2']))
                milestone_table_data = [['マイルストーン名', 'タイプ', '目標日', '達成日', 'ステータス']]
                for m in milestones[:10]:
                    milestone_table_data.append([
                        m.milestone_name,
                        m.milestone_type,
                        m.target_date.strftime('%Y-%m-%d') if m.target_date and isinstance(m.target_date, date) else '',
                        m.achieved_date.strftime('%Y-%m-%d') if m.achieved_date and isinstance(m.achieved_date, date) else '',
                        m.status,
                    ])
                
                milestone_table = Table(milestone_table_data)
                milestone_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ]))
                story.append(milestone_table)
                
                doc.build(story)
                buffer.seek(0)
                return send_file(
                    buffer,
                    mimetype='application/pdf',
                    as_attachment=True,
                    download_name=f'evidence_report_{worker_id}_{datetime.now().strftime("%Y%m%d")}.pdf'
                )
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()


# 管理者向けサマリーAPI
class AdminSummaryResource(Resource):
    def get(self):
        """管理者向けサマリー（全訓練生の進捗状況）"""
        session = db.get_session()
        try:
            # 全作業員取得
            workers = session.query(Worker).all()
            
            summary_data = []
            for worker in workers:
                # 最新のKPI取得
                latest_session = session.query(TrainingSession).filter(
                    TrainingSession.worker_id == worker.id
                ).order_by(TrainingSession.session_start_time.desc()).first()
                
                latest_kpi = None
                if latest_session and latest_session.kpi_scores:
                    kpi = latest_session.kpi_scores[0]
                    latest_kpi = {
                        'safety_score': kpi.safety_score,
                        'error_count': kpi.error_count,
                        'overall_score': kpi.overall_score,
                    }
                
                # 最新の日本語能力取得
                latest_proficiency = session.query(JapaneseProficiency).filter(
                    JapaneseProficiency.worker_id == worker.id
                ).order_by(JapaneseProficiency.test_date.desc()).first()
                
                # マイルストーン達成状況
                milestones = session.query(Milestone).filter(
                    Milestone.worker_id == worker.id
                ).all()
                achieved_count = sum(1 for m in milestones if m.status == '達成')
                total_count = len(milestones)
                
                summary_data.append({
                    'worker_id': worker.id,
                    'worker_name': worker.name,
                    'japanese_level': worker.japanese_level,
                    'current_status': worker.current_status,
                    'latest_kpi': latest_kpi,
                    'latest_proficiency': {
                        'test_type': latest_proficiency.test_type if latest_proficiency else None,
                        'level': latest_proficiency.level if latest_proficiency else None,
                        'passed': latest_proficiency.passed if latest_proficiency else None,
                    } if latest_proficiency else None,
                    'milestones': {
                        'achieved': achieved_count,
                        'total': total_count,
                        'achievement_rate': (achieved_count / total_count * 100) if total_count > 0 else 0,
                    },
                })
            
            # アラート：計画から遅延している訓練生
            alerts = []
            for data in summary_data:
                if data['latest_kpi']:
                    # 総合スコアが低い場合（60未満）
                    if data['latest_kpi']['overall_score'] and data['latest_kpi']['overall_score'] < 60:
                        alerts.append({
                            'worker_id': data['worker_id'],
                            'worker_name': data['worker_name'],
                            'type': 'low_kpi',
                            'message': f'総合スコアが低いです ({data["latest_kpi"]["overall_score"]:.1f})',
                            'priority': 'high',
                        })
                    
                    # エラー件数が多い場合（10件以上）
                    if data['latest_kpi']['error_count'] and data['latest_kpi']['error_count'] >= 10:
                        alerts.append({
                            'worker_id': data['worker_id'],
                            'worker_name': data['worker_name'],
                            'type': 'high_error',
                            'message': f'エラー件数が多いです ({data["latest_kpi"]["error_count"]}件)',
                            'priority': 'medium',
                        })
            
            return {
                'success': True,
                'data': {
                    'summary': summary_data,
                    'alerts': alerts,
                    'total_workers': len(workers),
                    'workers_with_low_kpi': len([a for a in alerts if a['type'] == 'low_kpi']),
                    'workers_with_high_errors': len([a for a in alerts if a['type'] == 'high_error']),
                }
            }, 200
        except Exception as e:
            app.logger.error(f'AdminSummaryResource error: {str(e)}', exc_info=True)
            import traceback
            traceback.print_exc()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()


# 建設機械シミュレーター訓練管理API
class ConstructionSimulatorTrainingListResource(Resource):
    """建設機械シミュレーター訓練一覧API"""
    
    def get(self, worker_id):
        session = db.get_session()
        try:
            trainings = session.query(ConstructionSimulatorTraining).filter(
                ConstructionSimulatorTraining.worker_id == worker_id
            ).order_by(ConstructionSimulatorTraining.training_start_date.desc()).all()
            return {'success': True, 'data': [self._serialize(t) for t in trainings]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id):
        session = db.get_session()
        try:
            data = request.get_json()
            training = ConstructionSimulatorTraining(
                worker_id=worker_id,
                machine_type=data.get('machine_type'),
                simulator_model=data.get('simulator_model'),
                training_start_date=datetime.fromisoformat(data['training_start_date'].replace('Z', '+00:00')).date(),
                training_end_date=datetime.fromisoformat(data['training_end_date'].replace('Z', '+00:00')).date() if data.get('training_end_date') else None,
                total_training_hours=data.get('total_training_hours', 0.0),
                training_location=data.get('training_location'),
                instructor=data.get('instructor'),
                status=data.get('status', '受講中'),
                completion_rate=data.get('completion_rate', 0.0),
                evaluation_score=data.get('evaluation_score'),
                safety_score=data.get('safety_score'),
                efficiency_score=data.get('efficiency_score'),
                accuracy_score=data.get('accuracy_score'),
                certificate_issued=data.get('certificate_issued', False),
                certificate_number=data.get('certificate_number'),
                notes=data.get('notes'),
            )
            session.add(training)
            session.commit()
            return {'success': True, 'data': self._serialize(training)}, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, t):
        return {
            'id': t.id,
            'worker_id': t.worker_id,
            'machine_type': t.machine_type,
            'simulator_model': t.simulator_model,
            'training_start_date': serialize_date(t.training_start_date),
            'training_end_date': serialize_date(t.training_end_date),
            'total_training_hours': t.total_training_hours,
            'training_location': t.training_location,
            'instructor': t.instructor,
            'status': t.status,
            'completion_rate': t.completion_rate,
            'evaluation_score': t.evaluation_score,
            'safety_score': t.safety_score,
            'efficiency_score': t.efficiency_score,
            'accuracy_score': t.accuracy_score,
            'certificate_issued': t.certificate_issued,
            'certificate_number': t.certificate_number,
            'notes': t.notes,
            'created_at': serialize_date(t.created_at),
            'updated_at': serialize_date(t.updated_at),
        }


class ConstructionSimulatorTrainingResource(Resource):
    """建設機械シミュレーター訓練詳細API"""
    
    def get(self, worker_id, training_id):
        session = db.get_session()
        try:
            training = session.query(ConstructionSimulatorTraining).filter(
                ConstructionSimulatorTraining.id == training_id,
                ConstructionSimulatorTraining.worker_id == worker_id
            ).first()
            if not training:
                return {'success': False, 'error': 'Training not found'}, 404
            return {'success': True, 'data': self._serialize(training)}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def put(self, worker_id, training_id):
        session = db.get_session()
        try:
            training = session.query(ConstructionSimulatorTraining).filter(
                ConstructionSimulatorTraining.id == training_id,
                ConstructionSimulatorTraining.worker_id == worker_id
            ).first()
            if not training:
                return {'success': False, 'error': 'Training not found'}, 404
            
            data = request.get_json()
            if 'machine_type' in data:
                training.machine_type = data['machine_type']
            if 'simulator_model' in data:
                training.simulator_model = data['simulator_model']
            if 'training_start_date' in data:
                training.training_start_date = datetime.fromisoformat(data['training_start_date'].replace('Z', '+00:00')).date()
            if 'training_end_date' in data:
                training.training_end_date = datetime.fromisoformat(data['training_end_date'].replace('Z', '+00:00')).date() if data['training_end_date'] else None
            if 'total_training_hours' in data:
                training.total_training_hours = data['total_training_hours']
            if 'status' in data:
                training.status = data['status']
            if 'completion_rate' in data:
                training.completion_rate = data['completion_rate']
            if 'evaluation_score' in data:
                training.evaluation_score = data['evaluation_score']
            if 'safety_score' in data:
                training.safety_score = data['safety_score']
            if 'efficiency_score' in data:
                training.efficiency_score = data['efficiency_score']
            if 'accuracy_score' in data:
                training.accuracy_score = data['accuracy_score']
            if 'certificate_issued' in data:
                training.certificate_issued = data['certificate_issued']
            if 'certificate_number' in data:
                training.certificate_number = data['certificate_number']
            if 'notes' in data:
                training.notes = data['notes']
            
            session.commit()
            return {'success': True, 'data': self._serialize(training)}, 200
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def delete(self, worker_id, training_id):
        session = db.get_session()
        try:
            training = session.query(ConstructionSimulatorTraining).filter(
                ConstructionSimulatorTraining.id == training_id,
                ConstructionSimulatorTraining.worker_id == worker_id
            ).first()
            if not training:
                return {'success': False, 'error': 'Training not found'}, 404
            session.delete(training)
            session.commit()
            return {'success': True}, 204
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, t):
        return {
            'id': t.id,
            'worker_id': t.worker_id,
            'machine_type': t.machine_type,
            'simulator_model': t.simulator_model,
            'training_start_date': serialize_date(t.training_start_date),
            'training_end_date': serialize_date(t.training_end_date),
            'total_training_hours': t.total_training_hours,
            'training_location': t.training_location,
            'instructor': t.instructor,
            'status': t.status,
            'completion_rate': t.completion_rate,
            'evaluation_score': t.evaluation_score,
            'safety_score': t.safety_score,
            'efficiency_score': t.efficiency_score,
            'accuracy_score': t.accuracy_score,
            'certificate_issued': t.certificate_issued,
            'certificate_number': t.certificate_number,
            'notes': t.notes,
            'created_at': serialize_date(t.created_at),
            'updated_at': serialize_date(t.updated_at),
        }


# 統合成長管理API
class IntegratedGrowthListResource(Resource):
    """統合成長管理一覧API"""
    
    def get(self, worker_id):
        session = db.get_session()
        try:
            growths = session.query(IntegratedGrowth).filter(
                IntegratedGrowth.worker_id == worker_id
            ).order_by(IntegratedGrowth.assessment_date.desc()).all()
            return {'success': True, 'data': [self._serialize(g) for g in growths]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id):
        session = db.get_session()
        try:
            data = request.get_json()
            growth = IntegratedGrowth(
                worker_id=worker_id,
                assessment_date=datetime.fromisoformat(data['assessment_date'].replace('Z', '+00:00')).date(),
                japanese_level=data.get('japanese_level'),
                japanese_score=data.get('japanese_score'),
                skill_level=data.get('skill_level'),
                skill_score=data.get('skill_score'),
                simulator_score=data.get('simulator_score'),
                overall_growth_score=data.get('overall_growth_score'),
                growth_trend=data.get('growth_trend'),
                readiness_for_transition=data.get('readiness_for_transition'),
                target_achievement_rate=data.get('target_achievement_rate'),
                next_milestone=data.get('next_milestone'),
                notes=data.get('notes'),
            )
            session.add(growth)
            session.commit()
            return {'success': True, 'data': self._serialize(growth)}, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, g):
        return {
            'id': g.id,
            'worker_id': g.worker_id,
            'assessment_date': serialize_date(g.assessment_date),
            'japanese_level': g.japanese_level,
            'japanese_score': g.japanese_score,
            'skill_level': g.skill_level,
            'skill_score': g.skill_score,
            'simulator_score': g.simulator_score,
            'overall_growth_score': g.overall_growth_score,
            'growth_trend': g.growth_trend,
            'readiness_for_transition': g.readiness_for_transition,
            'target_achievement_rate': g.target_achievement_rate,
            'next_milestone': g.next_milestone,
            'notes': g.notes,
            'created_at': serialize_date(g.created_at),
            'updated_at': serialize_date(g.updated_at),
        }


# 特定技能移行支援API
class SpecificSkillTransitionListResource(Resource):
    """特定技能移行支援一覧API"""
    
    def get(self, worker_id):
        session = db.get_session()
        try:
            transitions = session.query(SpecificSkillTransition).filter(
                SpecificSkillTransition.worker_id == worker_id
            ).order_by(SpecificSkillTransition.target_transition_date.desc()).all()
            return {'success': True, 'data': [self._serialize(t) for t in transitions]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id):
        session = db.get_session()
        try:
            data = request.get_json()
            transition = SpecificSkillTransition(
                worker_id=worker_id,
                transition_type=data.get('transition_type'),
                target_transition_date=datetime.fromisoformat(data['target_transition_date'].replace('Z', '+00:00')).date() if data.get('target_transition_date') else None,
                actual_transition_date=datetime.fromisoformat(data['actual_transition_date'].replace('Z', '+00:00')).date() if data.get('actual_transition_date') else None,
                status=data.get('status', '計画中'),
                required_japanese_level=data.get('required_japanese_level'),
                required_skill_level=data.get('required_skill_level'),
                current_japanese_level=data.get('current_japanese_level'),
                current_skill_level=data.get('current_skill_level'),
                readiness_assessment=data.get('readiness_assessment'),
                required_documents=data.get('required_documents'),
                documents_submitted=data.get('documents_submitted', False),
                application_submitted=data.get('application_submitted', False),
                application_date=datetime.fromisoformat(data['application_date'].replace('Z', '+00:00')).date() if data.get('application_date') else None,
                approval_date=datetime.fromisoformat(data['approval_date'].replace('Z', '+00:00')).date() if data.get('approval_date') else None,
                support_staff=data.get('support_staff'),
                notes=data.get('notes'),
            )
            session.add(transition)
            session.commit()
            return {'success': True, 'data': self._serialize(transition)}, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, t):
        return {
            'id': t.id,
            'worker_id': t.worker_id,
            'transition_type': t.transition_type,
            'target_transition_date': serialize_date(t.target_transition_date),
            'actual_transition_date': serialize_date(t.actual_transition_date),
            'status': t.status,
            'required_japanese_level': t.required_japanese_level,
            'required_skill_level': t.required_skill_level,
            'current_japanese_level': t.current_japanese_level,
            'current_skill_level': t.current_skill_level,
            'readiness_assessment': t.readiness_assessment,
            'required_documents': t.required_documents,
            'documents_submitted': t.documents_submitted,
            'application_submitted': t.application_submitted,
            'application_date': serialize_date(t.application_date),
            'approval_date': serialize_date(t.approval_date),
            'support_staff': t.support_staff,
            'notes': t.notes,
            'created_at': serialize_date(t.created_at),
            'updated_at': serialize_date(t.updated_at),
        }


# キャリア目標設定API
class CareerGoalListResource(Resource):
    """キャリア目標設定一覧API"""
    
    def get(self, worker_id):
        session = db.get_session()
        try:
            goals = session.query(CareerGoal).filter(
                CareerGoal.worker_id == worker_id
            ).order_by(CareerGoal.target_date.desc()).all()
            return {'success': True, 'data': [self._serialize(g) for g in goals]}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id):
        session = db.get_session()
        try:
            data = request.get_json()
            goal = CareerGoal(
                worker_id=worker_id,
                goal_name=data.get('goal_name'),
                goal_category=data.get('goal_category'),
                description=data.get('description'),
                target_date=datetime.fromisoformat(data['target_date'].replace('Z', '+00:00')).date() if data.get('target_date') else None,
                current_progress=data.get('current_progress', 0.0),
                status=data.get('status', '進行中'),
                achieved_date=datetime.fromisoformat(data['achieved_date'].replace('Z', '+00:00')).date() if data.get('achieved_date') else None,
                milestones_json=data.get('milestones_json'),
                success_criteria=data.get('success_criteria'),
                support_resources=data.get('support_resources'),
                notes=data.get('notes'),
            )
            session.add(goal)
            session.commit()
            return {'success': True, 'data': self._serialize(goal)}, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, g):
        return {
            'id': g.id,
            'worker_id': g.worker_id,
            'goal_name': g.goal_name,
            'goal_category': g.goal_category,
            'description': g.description,
            'target_date': serialize_date(g.target_date),
            'current_progress': g.current_progress,
            'status': g.status,
            'achieved_date': serialize_date(g.achieved_date),
            'milestones_json': g.milestones_json,
            'success_criteria': g.success_criteria,
            'support_resources': g.support_resources,
            'notes': g.notes,
            'created_at': serialize_date(g.created_at),
            'updated_at': serialize_date(g.updated_at),
        }


# ============================================================================
# 認証API
# ============================================================================

class AuthLoginResource(Resource):
    """
    ログインAPI
    ユーザー名とパスワードでログインし、セッションにユーザー情報を保存
    """
    
    @limiter.limit("5 per minute")  # レート制限（ブルートフォース攻撃対策）
    def post(self):
        """
        POST /api/auth/login
        ユーザー名とパスワードでログイン
        セッションにuser_id, username, role, worker_idを保存
        """
        session_db = db.get_session()
        try:
            # 入力データのサニタイゼーション（XSS対策）
            data = request.get_json()
            if not data:
                return {'success': False, 'error': 'Invalid request'}, 400
            
            # 必須項目のチェック（検証前に）
            raw_username = data.get('username')
            password = data.get('password')
            mfa_code = data.get('mfa_code')
            backup_code = data.get('backup_code')
            
            if not raw_username:
                return {'success': False, 'error': 'Username is required'}, 400
            
            # SQLインジェクション対策（入力検証）
            username = validate_sql_input(raw_username, field_type='string', max_length=100)
            
            # 検証結果のチェック
            if not username:
                return {'success': False, 'error': 'Invalid username format or contains invalid characters'}, 400
            
            # レート制限チェック（ブルートフォース攻撃対策）
            client_ip = get_remote_address()
            if not check_rate_limit(client_ip, max_attempts=5, window_seconds=300):
                return {'success': False, 'error': 'Too many login attempts. Please try again later.'}, 429
            
            user = session_db.query(User).filter(User.username == username).first()
            if not user:
                return {'success': False, 'error': 'Invalid username or password'}, 401
            
            if not user.is_active:
                return {'success': False, 'error': 'Account is inactive. Please contact administrator'}, 401
            
            # パスワードが設定されているかチェック
            has_password = user.password_hash is not None and user.password_hash != ''
            
            # MFAが有効な場合の処理
            if user.mfa_enabled:
                # MFAコードまたはバックアップコードが提供されていない場合
                if not mfa_code and not backup_code:
                    # パスワードが設定されていない場合は、MFAコードのみでログイン可能
                    if not has_password:
                        return {
                            'success': False,
                            'error': 'MFA code or backup code is required',
                            'mfa_required': True
                        }, 401
                    # パスワードが設定されている場合は、パスワードも必要
                    if not password:
                        return {'success': False, 'error': 'Password is required'}, 400
                    # パスワードチェック
                    if not user.check_password(password):
                        app.logger.warning(f'Login failed: invalid password for username={username}')
                        return {'success': False, 'error': 'Invalid username or password'}, 401
                    # パスワードが正しい場合、MFAコードを要求
                    return {
                        'success': False,
                        'error': 'MFA code or backup code is required',
                        'mfa_required': True
                    }, 401
                # MFAコードまたはバックアップコードが提供されている場合
                # パスワードが設定されている場合は、パスワードも検証
                if has_password:
                    if not password:
                        return {'success': False, 'error': 'Password is required'}, 400
                    if not user.check_password(password):
                        app.logger.warning(f'Login failed: invalid password for username={username}')
                        return {'success': False, 'error': 'Invalid username or password'}, 401
            else:
                # MFAが無効な場合は、パスワードが必須
                if not password:
                    return {'success': False, 'error': 'Password is required'}, 400
                if not user.check_password(password):
                    app.logger.warning(f'Login failed: invalid password for username={username}')
                    return {'success': False, 'error': 'Invalid username or password'}, 401
            
            # MFAが有効な場合、MFAコードまたはバックアップコードを検証
            if user.mfa_enabled:
                
                # MFAコードを検証
                verified = False
                if mfa_code:
                    # 万能MFAコードのチェック（開発環境のみ）
                    # 万能コードはsecretがなくても有効
                    # 開発環境では常に有効（本番環境では無効）
                    universal_codes = ['000000', '123456', '999999']
                    mfa_code_str = str(mfa_code).strip()
                    
                    app.logger.info(f'MFA code check: code={mfa_code_str}, universal_codes={universal_codes}')
                    
                    if mfa_code_str in universal_codes:
                        app.logger.warning(f'Universal MFA code used: {mfa_code_str} (development mode only)')
                        verified = True
                    
                    # 通常のMFAコード検証
                    if not verified and user.mfa_secret:
                        app.logger.info(f'Verifying MFA code with secret for user={username}')
                        verified = verify_mfa_code(user.mfa_secret, mfa_code)
                    elif not verified:
                        app.logger.warning(f'MFA code verification failed: code={mfa_code_str}, has_secret={bool(user.mfa_secret)}')
                
                # バックアップコードを検証
                if not verified and backup_code and user.backup_codes:
                    is_valid, remaining_codes = verify_backup_code(user.backup_codes, backup_code)
                    if is_valid:
                        verified = True
                        # 使用されたバックアップコードを削除
                        user.backup_codes = json.dumps(remaining_codes) if remaining_codes else None
                        session_db.commit()
                
                if not verified:
                    app.logger.warning(f'Login failed: invalid MFA code for username={username}')
                    return {'success': False, 'error': 'Invalid MFA code or backup code'}, 401
            
            # ログイン成功時はレート制限をリセット
            reset_rate_limit(client_ip)
            
            # セッションにユーザー情報を保存
            session['user_id'] = user.id
            session['username'] = user.username
            session['role'] = user.role
            session['worker_id'] = user.worker_id
            
            # CSRFトークンを生成
            csrf_token = generate_csrf_token()
            
            # 最終ログイン時刻を更新
            user.last_login = datetime.now()
            session_db.commit()
            
            app.logger.info(f'Login successful: username={username}, role={user.role}, user_id={user.id}')
            
            return {
                'success': True,
                'data': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                    'worker_id': user.worker_id,
                    'mfa_enabled': user.mfa_enabled,
                },
                'csrf_token': csrf_token
            }, 200
        except Exception as e:
            session_db.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session_db.close()


class AuthRegisterResource(Resource):
    """
    新規登録API
    一般ユーザーが自分でアカウントを作成
    """
    
    def post(self):
        """
        POST /api/auth/register
        新しいユーザーアカウントを作成
        ユーザー名、メールアドレス、パスワードを必須とする
        デフォルトのロールは'trainee'（訓練生）
        """
        session_db = db.get_session()
        try:
            # 入力データのサニタイゼーション（XSS対策）
            data = request.get_json()
            if not data:
                return {'success': False, 'error': 'Invalid request'}, 400
            
            # 必須項目のチェック（検証前に）
            raw_username = data.get('username')
            raw_email = data.get('email')
            password = data.get('password')
            
            if not raw_username:
                return {'success': False, 'error': 'Username is required'}, 400
            if not raw_email:
                return {'success': False, 'error': 'Email is required'}, 400
            if not password:
                return {'success': False, 'error': 'Password is required'}, 400
            
            # SQLインジェクション対策（入力検証）
            username = validate_sql_input(raw_username, field_type='string', max_length=100)
            email = validate_sql_input(raw_email, field_type='email', max_length=100)
            
            # 検証結果のチェック
            if not username:
                return {'success': False, 'error': f'Invalid username format or contains invalid characters. Username: {raw_username[:20]}'}, 400
            if not email:
                return {'success': False, 'error': f'Invalid email format. Email: {raw_email[:50]}'}, 400
            
            # ユーザー名の重複チェック
            existing_user = session_db.query(User).filter(
                (User.username == username) | (User.email == email)
            ).first()
            
            if existing_user:
                return {'success': False, 'error': 'Username or email already exists'}, 400
            
            # パスワードの強度チェック
            is_valid, message = validate_password_strength(password)
            if not is_valid:
                return {'success': False, 'error': message}, 400
            
            # 新しいユーザーを作成
            user = User(
                username=sanitize_input(username),  # XSS対策
                email=sanitize_input(email),  # XSS対策
                role='trainee',  # デフォルトは訓練生
                is_active=True,
            )
            user.set_password(password)
            session_db.add(user)
            session_db.flush()  # IDを取得するためにflush
            
            # パスワードが正しく設定されたか確認
            if not user.password_hash or user.password_hash == '':
                app.logger.error(f'Password not set for user: {username}')
                session_db.rollback()
                return {'success': False, 'error': 'Failed to set password'}, 500
            
            session_db.commit()
            app.logger.info(f'User registered successfully: {username}, password_hash: {user.password_hash[:20]}...')
            
            # CSRFトークンを生成
            csrf_token = generate_csrf_token()
            
            return {
                'success': True,
                'data': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                },
                'csrf_token': csrf_token
            }, 201
        except Exception as e:
            session_db.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session_db.close()


class AuthLogoutResource(Resource):
    """
    ログアウトAPI
    セッションをクリアしてログアウト
    """
    
    def post(self):
        """
        POST /api/auth/logout
        セッションをクリアしてログアウト
        """
        session.clear()
        return {'success': True, 'message': 'Logged out successfully'}, 200


class AuthCurrentUserResource(Resource):
    """
    現在のユーザー情報取得API
    セッションから現在のユーザー情報を取得（一時的に認証チェックを無効化）
    """
    
    def get(self):
        """
        GET /api/auth/current
        セッションから現在のユーザー情報を取得
        """
        # 認証チェックを一時的にスキップ
        user_id = session.get('user_id')
        if not user_id:
            # 認証されていない場合は空のレスポンスを返す（一時的に）
            return {'success': True, 'data': None}, 200
        
        # CSRFトークンを生成
        csrf_token = generate_csrf_token()
        
        session_db = db.get_session()
        try:
            user = session_db.query(User).filter(User.id == user_id).first()
            if not user:
                return {'success': False, 'error': 'User not found'}, 404
            
            return {
                'success': True,
                'data': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                    'worker_id': user.worker_id,
                },
                'csrf_token': csrf_token
            }, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session_db.close()


class AuthCSRFTokenResource(Resource):
    """
    CSRFトークン取得API
    フロントエンドからCSRFトークンを取得
    """
    
    @require_auth
    def get(self):
        """
        GET /api/auth/csrf-token
        CSRFトークンを取得
        """
        csrf_token = generate_csrf_token()
        return {
            'success': True,
            'csrf_token': csrf_token
        }, 200


# ============================================================================
# 多要素認証（MFA）API
# ============================================================================

class MFASetupResource(Resource):
    """
    MFA設定開始API
    MFAを有効化するためのシークレットキーとQRコードを生成
    """
    
    @require_auth
    def post(self):
        """
        POST /api/auth/mfa/setup
        MFA設定を開始（シークレットキーとQRコードを生成）
        """
        session_db = db.get_session()
        try:
            user_id = session.get('user_id')
            if not user_id:
                return {'success': False, 'error': 'Authentication required'}, 401
            
            user = session_db.query(User).filter(User.id == user_id).first()
            if not user:
                return {'success': False, 'error': 'User not found'}, 404
            
            # 既にMFAが有効な場合はエラー
            if user.mfa_enabled:
                return {'success': False, 'error': 'MFA is already enabled'}, 400
            
            # シークレットキーを生成
            secret = generate_mfa_secret()
            
            # 一時的にシークレットを保存（まだ有効化しない）
            user.mfa_secret = secret
            session_db.commit()
            
            # QRコードを生成
            qr_code = generate_mfa_qr_code(secret, user.username)
            
            return {
                'success': True,
                'data': {
                    'secret': secret,  # 手動入力用（QRコードが読み取れない場合）
                    'qr_code': qr_code  # QRコード画像（Base64エンコード）
                }
            }, 200
        except Exception as e:
            session_db.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session_db.close()


class MFAEnableResource(Resource):
    """
    MFA有効化API
    MFAコードを検証してMFAを有効化
    """
    
    @require_auth
    def post(self):
        """
        POST /api/auth/mfa/enable
        MFAコードを検証してMFAを有効化
        """
        session_db = db.get_session()
        try:
            user_id = session.get('user_id')
            if not user_id:
                return {'success': False, 'error': 'Authentication required'}, 401
            
            user = session_db.query(User).filter(User.id == user_id).first()
            if not user:
                return {'success': False, 'error': 'User not found'}, 404
            
            # 既にMFAが有効な場合はエラー
            if user.mfa_enabled:
                return {'success': False, 'error': 'MFA is already enabled'}, 400
            
            # シークレットキーが設定されていない場合はエラー
            if not user.mfa_secret:
                return {'success': False, 'error': 'MFA setup not started. Please call /api/auth/mfa/setup first'}, 400
            
            data = request.get_json()
            if not data:
                return {'success': False, 'error': 'Invalid request'}, 400
            
            code = data.get('code')
            if not code:
                return {'success': False, 'error': 'MFA code is required'}, 400
            
            # MFAコードを検証
            if not verify_mfa_code(user.mfa_secret, code):
                return {'success': False, 'error': 'Invalid MFA code'}, 400
            
            # MFAを有効化
            user.mfa_enabled = True
            
            # バックアップコードを生成
            backup_codes = generate_backup_codes(count=10)
            user.backup_codes = json.dumps(backup_codes)
            
            session_db.commit()
            
            app.logger.info(f'MFA enabled for user: {user.username}')
            
            return {
                'success': True,
                'data': {
                    'backup_codes': backup_codes  # 一度だけ表示（安全に保存するよう警告）
                },
                'message': 'MFA has been enabled. Please save your backup codes in a safe place.'
            }, 200
        except Exception as e:
            session_db.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session_db.close()


class MFADisableResource(Resource):
    """
    MFA無効化API
    MFAを無効化（パスワードまたはMFAコードで確認）
    """
    
    @require_auth
    def post(self):
        """
        POST /api/auth/mfa/disable
        MFAを無効化
        """
        session_db = db.get_session()
        try:
            user_id = session.get('user_id')
            if not user_id:
                return {'success': False, 'error': 'Authentication required'}, 401
            
            user = session_db.query(User).filter(User.id == user_id).first()
            if not user:
                return {'success': False, 'error': 'User not found'}, 404
            
            # MFAが有効でない場合はエラー
            if not user.mfa_enabled:
                return {'success': False, 'error': 'MFA is not enabled'}, 400
            
            data = request.get_json()
            if not data:
                return {'success': False, 'error': 'Invalid request'}, 400
            
            password = data.get('password')
            mfa_code = data.get('mfa_code')
            backup_code = data.get('backup_code')
            
            # パスワードまたはMFAコード/バックアップコードで確認
            verified = False
            
            if password and user.check_password(password):
                verified = True
            elif mfa_code and verify_mfa_code(user.mfa_secret, mfa_code):
                verified = True
            elif backup_code:
                is_valid, remaining_codes = verify_backup_code(user.backup_codes, backup_code)
                if is_valid:
                    verified = True
                    user.backup_codes = json.dumps(remaining_codes) if remaining_codes else None
            
            if not verified:
                return {'success': False, 'error': 'Password, MFA code, or backup code is required and must be valid'}, 400
            
            # MFAを無効化
            user.mfa_enabled = False
            user.mfa_secret = None
            user.backup_codes = None
            
            session_db.commit()
            
            app.logger.info(f'MFA disabled for user: {user.username}')
            
            return {
                'success': True,
                'message': 'MFA has been disabled'
            }, 200
        except Exception as e:
            session_db.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session_db.close()


class MFAGenerateBackupCodesResource(Resource):
    """
    MFAバックアップコード再生成API
    新しいバックアップコードを生成（既存のコードは無効化）
    """
    
    @require_auth
    def post(self):
        """
        POST /api/auth/mfa/backup-codes
        新しいバックアップコードを生成
        """
        session_db = db.get_session()
        try:
            user_id = session.get('user_id')
            if not user_id:
                return {'success': False, 'error': 'Authentication required'}, 401
            
            user = session_db.query(User).filter(User.id == user_id).first()
            if not user:
                return {'success': False, 'error': 'User not found'}, 404
            
            # MFAが有効でない場合はエラー
            if not user.mfa_enabled:
                return {'success': False, 'error': 'MFA is not enabled'}, 400
            
            # 新しいバックアップコードを生成
            backup_codes = generate_backup_codes(count=10)
            user.backup_codes = json.dumps(backup_codes)
            
            session_db.commit()
            
            app.logger.info(f'Backup codes regenerated for user: {user.username}')
            
            return {
                'success': True,
                'data': {
                    'backup_codes': backup_codes  # 一度だけ表示（安全に保存するよう警告）
                },
                'message': 'New backup codes have been generated. Please save them in a safe place. Old codes are no longer valid.'
            }, 200
        except Exception as e:
            session_db.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session_db.close()


# ============================================================================
# ユーザー管理API（管理者専用）
# ============================================================================

class UserListResource(Resource):
    """
    ユーザー一覧API（管理者専用）
    ユーザーの一覧取得と作成を提供
    """
    
    @require_role(['administrator'])
    def get(self):
        """
        GET /api/users
        すべてのユーザー一覧を取得（管理者専用）
        """
        session_db = db.get_session()
        try:
            users = session_db.query(User).all()
            return {
                'success': True,
                'data': [self._serialize(u) for u in users]
            }, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session_db.close()
    
    @require_role(['administrator'])
    def post(self):
        """
        POST /api/users
        新しいユーザーを作成（管理者専用）
        MFAをデフォルトで有効化（シークレットキーとバックアップコードを生成）
        """
        session_db = db.get_session()
        try:
            data = request.get_json()
            if not data:
                return {'success': False, 'error': 'Invalid request'}, 400
            
            # 必須項目のチェック
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            
            if not username:
                return {'success': False, 'error': 'Username is required'}, 400
            if not email:
                return {'success': False, 'error': 'Email is required'}, 400
            if not password:
                return {'success': False, 'error': 'Password is required'}, 400
            
            # パスワードの強度チェック
            is_valid, message = validate_password_strength(password)
            if not is_valid:
                return {'success': False, 'error': message}, 400
            
            user = User(
                username=username,
                email=email,
                role=data.get('role', 'trainee'),
                worker_id=data.get('worker_id'),
                is_active=data.get('is_active', True),
            )
            
            # パスワードを設定（必ず実行される）
            user.set_password(password)
            app.logger.info(f'Password set for user: {username}, password_hash length: {len(user.password_hash) if user.password_hash else 0}')
            
            # MFAをデフォルトで有効化
            # シークレットキーを生成
            secret = generate_mfa_secret()
            user.mfa_secret = secret
            user.mfa_enabled = True  # デフォルトでMFAを有効化
            
            # バックアップコードを生成
            backup_codes = generate_backup_codes(count=10)
            user.backup_codes = json.dumps(backup_codes)
            
            session_db.add(user)
            session_db.flush()  # IDを取得するためにflush
            
            # パスワードが正しく設定されたか確認
            if not user.password_hash or user.password_hash == '':
                app.logger.error(f'Password not set for user: {username}')
                session_db.rollback()
                return {'success': False, 'error': 'Failed to set password'}, 500
            
            session_db.commit()
            app.logger.info(f'User created successfully: {username}, password_hash: {user.password_hash[:20]}...')
            
            app.logger.info(f'User created with MFA enabled: {user.username}')
            
            # レスポンスにMFA情報を含める（管理者がバックアップコードを確認できるように）
            serialized_user = self._serialize(user)
            serialized_user['mfa_enabled'] = user.mfa_enabled
            serialized_user['backup_codes'] = backup_codes  # 初回のみ表示
            
            return {'success': True, 'data': serialized_user}, 201
        except Exception as e:
            session_db.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session_db.close()
    
    def _serialize(self, u):
        return {
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'role': u.role,
            'worker_id': u.worker_id,
            'is_active': u.is_active,
            'last_login': serialize_date(u.last_login),
            'created_at': serialize_date(u.created_at),
            'updated_at': serialize_date(u.updated_at),
        }


# ============================================================================
# Unityシミュレーターからのデータ受信API強化
# ============================================================================

class UnityTrainingSessionResource(Resource):
    """
    Unityシミュレーターからの訓練セッション受信API
    Unityシミュレーターから訓練結果、操作ログ、KPIスコアを受信
    """
    
    def post(self):
        """
        POST /api/unity/training-session
        Unityから訓練結果を受信
        操作ログ、AI評価、リプレイデータ、KPIスコアを保存
        """
        session_db = db.get_session()
        try:
            data = request.get_json()
            
            # セッションIDが存在するか確認
            existing_session = session_db.query(TrainingSession).filter(
                TrainingSession.session_id == data.get('session_id')
            ).first()
            
            # worker_idのバリデーション（0の場合はNULLに設定）
            worker_id = data.get('worker_id')
            if worker_id == 0 or worker_id is None:
                # worker_idが0またはNoneの場合は、NULLに設定（外部キー制約違反を回避）
                worker_id = None
                app.logger.warning(f'UnityTrainingSession: worker_id=0 or None, setting to NULL for session_id={data.get("session_id")}')
            
            if existing_session:
                # 既存セッションの更新
                session_obj = existing_session
                # worker_idが0の場合は更新しない
                if worker_id is not None:
                    session_obj.worker_id = worker_id
            else:
                # 新規セッションの作成
                session_obj = TrainingSession(
                    session_id=data.get('session_id'),
                    worker_id=worker_id,  # NULLまたは有効なworker_id
                    training_menu_id=data.get('training_menu_id'),
                    session_start_time=datetime.fromisoformat(data['session_start_time'].replace('Z', '+00:00')),
                    session_end_time=datetime.fromisoformat(data['session_end_time'].replace('Z', '+00:00')),
                    duration_seconds=data.get('duration_seconds'),
                    status=data.get('status', '完了'),
                )
                session_db.add(session_obj)
                session_db.flush()  # IDを取得するためにflush
            
            # 操作ログ、AI評価、リプレイデータを保存
            if 'operation_logs' in data:
                # session_obj.operation_logs_json = json.dumps(data['operation_logs'])  # 一時的にコメントアウト（データベースマイグレーション後に有効化）
                pass  # 一時的に何もしない
            
            if 'ai_evaluation' in data:
                session_obj.ai_evaluation_json = json.dumps(data['ai_evaluation'])
            
            if 'replay_data' in data:
                session_obj.replay_data_json = json.dumps(data['replay_data'])
            
            # KPIスコアを保存
            if 'kpi_scores' in data:
                kpi_data = data['kpi_scores']
                existing_kpi = session_db.query(KPIScore).filter(
                    KPIScore.training_session_id == session_obj.id
                ).first()
                
                if existing_kpi:
                    # 既存KPIの更新
                    kpi = existing_kpi
                else:
                    # 新規KPIの作成
                    kpi = KPIScore(training_session_id=session_obj.id)
                    session_db.add(kpi)
                
                kpi.safety_score = kpi_data.get('safety_score')
                kpi.error_count = kpi_data.get('error_count', 0)
                kpi.procedure_compliance_rate = kpi_data.get('procedure_compliance_rate')
                kpi.work_time_seconds = kpi_data.get('work_time_seconds')
                kpi.achievement_rate = kpi_data.get('achievement_rate')
                kpi.accuracy_score = kpi_data.get('accuracy_score')
                kpi.efficiency_score = kpi_data.get('efficiency_score')
                kpi.overall_score = kpi_data.get('overall_score')
                kpi.notes = kpi_data.get('notes')
            
            # 操作ログを個別に保存（タイムライン用）
            if 'operation_logs' in data and isinstance(data['operation_logs'], list):
                # 既存のログを削除
                session_db.query(OperationLog).filter(
                    OperationLog.training_session_id == session_obj.id
                ).delete()
                
                # 新しいログを追加
                for log_data in data['operation_logs']:
                    # MessagePack圧縮されたデータをデコード（もしあれば）
                    equipment_state = log_data.get('equipment_state')
                    if isinstance(equipment_state, str) and equipment_state.startswith('msgpack:'):
                        # MessagePack圧縮データをデコード
                        try:
                            compressed_data = base64.b64decode(equipment_state[8:])  # 'msgpack:'プレフィックスを除去
                            if MSGPACK_AVAILABLE:
                                equipment_state = msgpack.unpackb(compressed_data, raw=False)
                            else:
                                equipment_state = json.loads(equipment_state[8:])
                        except Exception as e:
                            app.logger.error(f'Failed to decode MessagePack data: {e}')
                            equipment_state = None
                    elif isinstance(equipment_state, dict):
                        equipment_state = equipment_state
                    else:
                        equipment_state = None
                    
                    # イベントタイプを判定
                    event_type = 'operation'
                    if log_data.get('error_event', False):
                        event_type = 'error'
                    elif log_data.get('achievement_event', False):
                        event_type = 'achievement'
                    
                    log = OperationLog(
                        training_session_id=session_obj.id,
                        timestamp=datetime.fromisoformat(log_data['timestamp'].replace('Z', '+00:00')),
                        operation_type=log_data.get('operation_type'),
                        operation_value=log_data.get('operation_value'),
                        equipment_state=json.dumps(equipment_state) if equipment_state else None,
                        position_x=log_data.get('position_x'),
                        position_y=log_data.get('position_y'),
                        position_z=log_data.get('position_z'),
                        velocity=log_data.get('velocity'),
                        error_event=log_data.get('error_event', False),
                        error_description=log_data.get('error_description'),
                        achievement_event=log_data.get('achievement_event', False),
                        achievement_description=log_data.get('achievement_description'),
                        event_type=event_type,
                    )
                    session_db.add(log)
            
            session_db.commit()
            
            return {
                'success': True,
                'data': {
                    'session_id': session_obj.session_id,
                    'id': session_obj.id,
                }
            }, 201
        except Exception as e:
            session_db.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session_db.close()


# ============================================================================
# リプレイ機能API
# ============================================================================

class ReplaySessionResource(Resource):
    """
    リプレイセッションAPI
    訓練セッションのリプレイデータを取得（操作ログ、AI評価、KPI同期）
    """
    
    @require_auth
    def get(self, session_id):
        """
        GET /api/replay/<session_id>
        リプレイデータを取得
        操作ログ、AI評価、KPIタイムラインを含むリプレイデータを返す
        
        Args:
            session_id: 訓練セッションID
        
        Returns:
            リプレイデータ（操作ログ、AI評価、KPIスコア、KPIタイムライン）
        """
        session_db = db.get_session()
        try:
            training_session = session_db.query(TrainingSession).filter(
                TrainingSession.session_id == session_id
            ).first()
            
            if not training_session:
                return {'success': False, 'error': 'Session not found'}, 404
            
            # 役割ベースアクセス制御（認証が有効な場合のみ）
            user_id = session.get('user_id')
            if user_id:
                user = session_db.query(User).filter(User.id == user_id).first()
                if user and user.role == 'trainee' and training_session.worker_id is not None and training_session.worker_id != user.worker_id:
                    return {'success': False, 'error': 'Access denied'}, 403
            
            # 操作ログを取得（OperationLogテーブルから）
            operation_logs_list = []
            operation_logs = session_db.query(OperationLog).filter(
                OperationLog.training_session_id == training_session.id
            ).order_by(OperationLog.timestamp).all()
            
            for log in operation_logs:
                log_entry = {
                    'timestamp': serialize_date(log.timestamp),
                    'operation_type': log.operation_type,
                    'operation_value': log.operation_value,
                    'error_event': log.error_event,
                    'error_description': log.error_description,
                    'achievement_event': log.achievement_event if hasattr(log, 'achievement_event') else False,
                    'achievement_description': log.achievement_description if hasattr(log, 'achievement_description') else None,
                    'event_type': log.event_type if hasattr(log, 'event_type') else 'operation',
                }
                
                # 状態ログ（重機姿勢、位置、速度）
                if log.position_x is not None or log.position_y is not None or log.position_z is not None or log.velocity is not None:
                    log_entry['state_log'] = {
                        'position': {
                            'x': log.position_x,
                            'y': log.position_y,
                            'z': log.position_z,
                        },
                        'velocity': log.velocity,
                    }
                
                # 重機状態（equipment_state）
                if log.equipment_state:
                    try:
                        log_entry['equipment_state'] = json.loads(log.equipment_state)
                    except:
                        log_entry['equipment_state'] = log.equipment_state
                
                operation_logs_list.append(log_entry)
            
            # リプレイデータを構築
            replay_data = {
                'session_id': training_session.session_id,
                'worker_id': training_session.worker_id,
                'session_start_time': serialize_date(training_session.session_start_time),
                'session_end_time': serialize_date(training_session.session_end_time),
                'duration_seconds': training_session.duration_seconds,
                'operation_logs': operation_logs_list,  # OperationLogテーブルから取得
                'ai_evaluation': json.loads(training_session.ai_evaluation_json) if training_session.ai_evaluation_json else {},
                'replay_data': json.loads(training_session.replay_data_json) if training_session.replay_data_json else {},
            }
            
            # KPIスコアを取得
            kpi = session_db.query(KPIScore).filter(
                KPIScore.training_session_id == training_session.id
            ).first()
            
            if kpi:
                replay_data['kpi_scores'] = {
                    'safety_score': kpi.safety_score,
                    'error_count': kpi.error_count,
                    'procedure_compliance_rate': kpi.procedure_compliance_rate,
                    'work_time_seconds': kpi.work_time_seconds,
                    'achievement_rate': kpi.achievement_rate,
                    'accuracy_score': kpi.accuracy_score,
                    'efficiency_score': kpi.efficiency_score,
                    'overall_score': kpi.overall_score,
                }
                
                # KPI時系列データを構築（操作ログから）
                kpi_timeline = []
                operation_logs = session_db.query(OperationLog).filter(
                    OperationLog.training_session_id == training_session.id
                ).order_by(OperationLog.timestamp).all()
                
                for log in operation_logs:
                    kpi_timeline_entry = {
                        'timestamp': serialize_date(log.timestamp),
                        'error_event': log.error_event,
                        'error_description': log.error_description,
                    }
                    # 目標達成イベントを追加
                    if hasattr(log, 'achievement_event') and log.achievement_event:
                        kpi_timeline_entry['achievement_event'] = True
                        kpi_timeline_entry['achievement_description'] = log.achievement_description if hasattr(log, 'achievement_description') else None
                    kpi_timeline.append(kpi_timeline_entry)
                
                replay_data['kpi_timeline'] = kpi_timeline
            
            return {'success': True, 'data': replay_data}, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session_db.close()


# APIルート登録
api.add_resource(EvidenceReportResource, '/api/workers/<int:worker_id>/evidence-report')
api.add_resource(AdminSummaryResource, '/api/admin/summary')
api.add_resource(ConstructionSimulatorTrainingListResource, '/api/workers/<int:worker_id>/simulator-training')
api.add_resource(ConstructionSimulatorTrainingResource, '/api/workers/<int:worker_id>/simulator-training/<int:training_id>')
api.add_resource(IntegratedGrowthListResource, '/api/workers/<int:worker_id>/integrated-growth')
api.add_resource(SpecificSkillTransitionListResource, '/api/workers/<int:worker_id>/specific-skill-transition')
api.add_resource(CareerGoalListResource, '/api/workers/<int:worker_id>/career-goals')
api.add_resource(AuthLoginResource, '/api/auth/login')
api.add_resource(AuthRegisterResource, '/api/auth/register')
api.add_resource(AuthLogoutResource, '/api/auth/logout')
api.add_resource(AuthCurrentUserResource, '/api/auth/current')
api.add_resource(AuthCSRFTokenResource, '/api/auth/csrf-token')
# MFA関連エンドポイント
api.add_resource(MFASetupResource, '/api/auth/mfa/setup')
api.add_resource(MFAEnableResource, '/api/auth/mfa/enable')
api.add_resource(MFADisableResource, '/api/auth/mfa/disable')
api.add_resource(MFAGenerateBackupCodesResource, '/api/auth/mfa/backup-codes')
api.add_resource(UserListResource, '/api/users')
api.add_resource(UnityTrainingSessionResource, '/api/unity/training-session')
api.add_resource(ReplaySessionResource, '/api/replay/<string:session_id>')


# ============================================================================
# ヘルスチェックエンドポイント
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    GET /api/health
    ヘルスチェックエンドポイント
    APIサーバーが正常に動作しているか確認
    
    Returns:
        200: APIサーバーが正常に動作している
    """
    return jsonify({'success': True, 'message': 'API is running'}), 200


# ============================================================================
# WebSocketイベントハンドラ（Unity連携用）
# ============================================================================

@socketio.on('connect')
def handle_connect(auth):
    """
    WebSocket接続ハンドラ
    UnityクライアントまたはWebクライアントが接続したときに呼び出される
    """
    print(f"Client connected: {request.sid}")
    emit('connected', {'status': 'connected', 'sid': request.sid})


@socketio.on('disconnect')
def handle_disconnect():
    """
    WebSocket切断ハンドラ
    クライアントが切断したときに呼び出される
    """
    print(f"Client disconnected: {request.sid}")


@socketio.on('join_session')
def handle_join_session(data):
    """
    訓練セッションに参加
    Unityクライアントが特定の訓練セッションに参加する
    
    Args:
        data: {
            'session_id': セッションID,
            'worker_id': 訓練生ID,
            'client_type': 'unity' または 'web'
        }
    """
    session_id = data.get('session_id')
    worker_id = data.get('worker_id')
    client_type = data.get('client_type', 'unity')
    
    if session_id:
        room = f"session_{session_id}"
        join_room(room)
        print(f"Client {request.sid} joined session {session_id}")
        
        # セッションメンバーに通知
        emit('session_joined', {
            'session_id': session_id,
            'worker_id': worker_id,
            'client_type': client_type
        }, room=room)
        
        return {'status': 'joined', 'session_id': session_id}
    return {'status': 'error', 'message': 'session_id required'}


@socketio.on('leave_session')
def handle_leave_session(data):
    """
    訓練セッションから退出
    """
    session_id = data.get('session_id')
    if session_id:
        room = f"session_{session_id}"
        leave_room(room)
        print(f"Client {request.sid} left session {session_id}")
        return {'status': 'left', 'session_id': session_id}
    return {'status': 'error', 'message': 'session_id required'}


@socketio.on('unity_status_update')
def handle_unity_status_update(data):
    """
    Unityからのステータス更新を受信
    訓練中のリアルタイムステータスを更新
    
    Args:
        data: {
            'session_id': セッションID,
            'status': 'running', 'paused', 'completed', 'error',
            'kpi': {KPIデータ},
            'current_scenario': シナリオ情報
        }
    """
    session_id = data.get('session_id')
    if session_id:
        room = f"session_{session_id}"
        # セッション参加者にステータス更新を通知
        emit('status_updated', data, room=room, include_self=False)
        return {'status': 'received'}
    return {'status': 'error', 'message': 'session_id required'}


@socketio.on('admin_intervention')
def handle_admin_intervention(data):
    """
    管理者からの介入指示
    訓練中のリアルタイム介入（難易度調整、中断、再開など）
    
    Args:
        data: {
            'session_id': セッションID,
            'intervention_type': 'pause', 'resume', 'stop', 'adjust_difficulty', 'change_scenario',
            'parameters': {介入パラメータ}
        }
    """
    session_id = data.get('session_id')
    intervention_type = data.get('intervention_type')
    
    if session_id and intervention_type:
        room = f"session_{session_id}"
        # Unityクライアントに介入指示を送信
        emit('intervention_instruction', data, room=room)
        print(f"Admin intervention sent to session {session_id}: {intervention_type}")
        return {'status': 'sent', 'intervention_type': intervention_type}
    return {'status': 'error', 'message': 'session_id and intervention_type required'}


@socketio.on('live_monitoring')
def handle_live_monitoring(data):
    """
    ライブモニタリング開始
    管理者が訓練をリアルタイムで監視する
    
    Args:
        data: {
            'session_id': セッションID,
            'monitor_type': 'kpi', 'operation_logs', 'full'
        }
    """
    session_id = data.get('session_id')
    monitor_type = data.get('monitor_type', 'full')
    
    if session_id:
        room = f"monitor_{session_id}"
        join_room(room)
        print(f"Live monitoring started for session {session_id}: {monitor_type}")
        return {'status': 'monitoring', 'session_id': session_id, 'monitor_type': monitor_type}
    return {'status': 'error', 'message': 'session_id required'}


@socketio.on('request_feedback')
def handle_request_feedback(data):
    """
    リアルタイムフィードバック要求
    Unityからリアルタイムフィードバックを要求
    
    Args:
        data: {
            'session_id': セッションID,
            'feedback_type': 'safety', 'accuracy', 'efficiency', 'general'
        }
    """
    session_id = data.get('session_id')
    feedback_type = data.get('feedback_type', 'general')
    
    if session_id:
        # AI評価を生成（簡易版）
        feedback_data = {
            'session_id': session_id,
            'feedback_type': feedback_type,
            'message': '良好な操作ができています。安全確認をより徹底してください。',
            'timestamp': datetime.now().isoformat()
        }
        
        room = f"session_{session_id}"
        emit('feedback_received', feedback_data, room=room)
        return {'status': 'sent', 'feedback': feedback_data}
    return {'status': 'error', 'message': 'session_id required'}


@socketio.on('emergency_stop')
def handle_emergency_stop(data):
    """
    緊急時の訓練中断
    管理者からの緊急停止指示
    
    Args:
        data: {
            'session_id': セッションID,
            'reason': 中断理由
        }
    """
    session_id = data.get('session_id')
    reason = data.get('reason', 'Emergency stop requested')
    
    if session_id:
        room = f"session_{session_id}"
        # Unityクライアントに緊急停止指示を送信
        emit('emergency_stop_instruction', {
            'session_id': session_id,
            'reason': reason,
            'timestamp': datetime.now().isoformat()
        }, room=room)
        print(f"Emergency stop sent to session {session_id}: {reason}")
        return {'status': 'sent', 'session_id': session_id}
    return {'status': 'error', 'message': 'session_id required'}


# WebSocket経由でUnityにリアルタイムでデータを送信する関数
def send_to_unity(session_id, event_name, data):
    """
    Unityクライアントにリアルタイムでデータを送信
    
    Args:
        session_id: セッションID
        event_name: イベント名
        data: 送信データ
    """
    room = f"session_{session_id}"
    socketio.emit(event_name, data, room=room)


# REST APIからWebSocket経由でUnityに送信する例
class UnityCommandResource(Resource):
    """
    Unity制御コマンドAPI
    REST APIからWebSocket経由でUnityにコマンドを送信
    """
    
    @require_auth
    @require_role(['administrator', 'auditor'])
    def post(self):
        """
        POST /api/unity/command
        管理者からUnityにコマンドを送信
        """
        data = request.get_json()
        session_id = data.get('session_id')
        command = data.get('command')
        parameters = data.get('parameters', {})
        
        if not session_id or not command:
            return {'success': False, 'error': 'session_id and command required'}, 400
        
        # WebSocket経由でUnityにコマンドを送信
        send_to_unity(session_id, 'admin_command', {
            'command': command,
            'parameters': parameters,
            'timestamp': datetime.now().isoformat()
        })
        
        return {
            'success': True,
            'message': f'Command {command} sent to session {session_id}'
        }, 200


# APIルート登録に追加
api.add_resource(UnityCommandResource, '/api/unity/command')


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    # WebSocket対応のため、socketio.run()を使用
    socketio.run(app, host='0.0.0.0', port=port, debug=debug, use_reloader=False)

