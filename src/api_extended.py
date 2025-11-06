"""
拡張機能のFlask REST API
ドキュメント、通知、研修、評価、メッセージ、カレンダー、レポート管理
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_restful import Api, Resource
from datetime import datetime, date
from .database import (
    Database, Document, Notification, Training, TrainingEnrollment,
    Evaluation, Message, CalendarEvent, Report, Worker
)
from sqlalchemy.orm import joinedload
from sqlalchemy import and_, or_, func
import json

app = Flask(__name__)
CORS(app)
api = Api(app)

db = Database()


def serialize_date(obj):
    """日付をシリアライズ"""
    if isinstance(obj, (date, datetime)):
        return obj.isoformat() if obj else None
    return obj


# ドキュメント管理API
class DocumentListResource(Resource):
    def get(self, worker_id):
        """就労者のドキュメント一覧を取得"""
        session = db.get_session()
        try:
            documents = session.query(Document).filter(
                Document.worker_id == worker_id
            ).order_by(Document.created_at.desc()).all()
            
            return {
                'success': True,
                'data': [self._serialize(doc) for doc in documents]
            }, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id):
        """ドキュメントを登録"""
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
            
            return {
                'success': True,
                'data': self._serialize(document)
            }, 201
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


class DocumentResource(Resource):
    def get(self, worker_id, document_id):
        """ドキュメントを取得"""
        session = db.get_session()
        try:
            document = session.query(Document).filter(
                Document.id == document_id,
                Document.worker_id == worker_id
            ).first()
            
            if not document:
                return {'success': False, 'error': 'Document not found'}, 404
            
            return {
                'success': True,
                'data': DocumentListResource()._serialize(document)
            }, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def put(self, worker_id, document_id):
        """ドキュメントを更新"""
        session = db.get_session()
        try:
            document = session.query(Document).filter(
                Document.id == document_id,
                Document.worker_id == worker_id
            ).first()
            
            if not document:
                return {'success': False, 'error': 'Document not found'}, 404
            
            data = request.get_json()
            
            if 'title' in data:
                document.title = data['title']
            if 'description' in data:
                document.description = data.get('description')
            if 'expiry_date' in data:
                document.expiry_date = datetime.fromisoformat(data['expiry_date'].replace('Z', '+00:00')).date() if data['expiry_date'] else None
            if 'is_verified' in data:
                document.is_verified = data['is_verified']
            
            document.updated_at = datetime.now()
            session.commit()
            
            return {
                'success': True,
                'data': DocumentListResource()._serialize(document)
            }, 200
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def delete(self, worker_id, document_id):
        """ドキュメントを削除"""
        session = db.get_session()
        try:
            document = session.query(Document).filter(
                Document.id == document_id,
                Document.worker_id == worker_id
            ).first()
            
            if not document:
                return {'success': False, 'error': 'Document not found'}, 404
            
            session.delete(document)
            session.commit()
            
            return {'success': True, 'message': 'Document deleted'}, 200
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()


# 通知管理API
class NotificationListResource(Resource):
    def get(self, worker_id=None):
        """通知一覧を取得"""
        session = db.get_session()
        try:
            query = session.query(Notification)
            if worker_id:
                query = query.filter(Notification.worker_id == worker_id)
            else:
                query = query.filter(Notification.worker_id.is_(None))
            
            notifications = query.order_by(Notification.created_at.desc()).all()
            
            return {
                'success': True,
                'data': [self._serialize(n) for n in notifications]
            }, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id=None):
        """通知を登録"""
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
            
            return {
                'success': True,
                'data': self._serialize(notification)
            }, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, n):
        return {
            'id': n.id,
            'worker_id': n.worker_id,
            'title': n.title,
            'message': n.message,
            'notification_type': n.notification_type,
            'priority': n.priority,
            'is_read': n.is_read,
            'read_at': serialize_date(n.read_at),
            'scheduled_date': serialize_date(n.scheduled_date),
            'related_type': n.related_type,
            'related_id': n.related_id,
            'created_at': serialize_date(n.created_at),
        }


class NotificationResource(Resource):
    def get(self, notification_id):
        """通知を取得"""
        session = db.get_session()
        try:
            notification = session.query(Notification).filter(
                Notification.id == notification_id
            ).first()
            
            if not notification:
                return {'success': False, 'error': 'Notification not found'}, 404
            
            return {
                'success': True,
                'data': NotificationListResource()._serialize(notification)
            }, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def put(self, notification_id):
        """通知を既読にする"""
        session = db.get_session()
        try:
            notification = session.query(Notification).filter(
                Notification.id == notification_id
            ).first()
            
            if not notification:
                return {'success': False, 'error': 'Notification not found'}, 404
            
            notification.is_read = True
            notification.read_at = datetime.now()
            session.commit()
            
            return {
                'success': True,
                'data': NotificationListResource()._serialize(notification)
            }, 200
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()


# 研修管理API
class TrainingListResource(Resource):
    def get(self):
        """研修一覧を取得"""
        session = db.get_session()
        try:
            trainings = session.query(Training).order_by(Training.start_date.desc()).all()
            
            return {
                'success': True,
                'data': [self._serialize(t) for t in trainings]
            }, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self):
        """研修を登録"""
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
            
            return {
                'success': True,
                'data': self._serialize(training)
            }, 201
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


# 研修受講登録API
class TrainingEnrollmentResource(Resource):
    def get(self, worker_id):
        """就労者の受講登録一覧を取得"""
        session = db.get_session()
        try:
            enrollments = session.query(TrainingEnrollment).filter(
                TrainingEnrollment.worker_id == worker_id
            ).order_by(TrainingEnrollment.enrollment_date.desc()).all()
            
            return {
                'success': True,
                'data': [self._serialize(e) for e in enrollments]
            }, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id):
        """研修に登録"""
        session = db.get_session()
        try:
            data = request.get_json()
            training_id = data.get('training_id')
            
            # 研修の存在確認
            training = session.query(Training).filter(Training.id == training_id).first()
            if not training:
                return {'success': False, 'error': 'Training not found'}, 404
            
            # 既に登録済みか確認
            existing = session.query(TrainingEnrollment).filter(
                TrainingEnrollment.worker_id == worker_id,
                TrainingEnrollment.training_id == training_id
            ).first()
            
            if existing:
                return {'success': False, 'error': 'Already enrolled'}, 400
            
            enrollment = TrainingEnrollment(
                training_id=training_id,
                worker_id=worker_id,
                enrollment_date=datetime.now().date(),
                status=data.get('status', '登録済み'),
            )
            
            session.add(enrollment)
            training.current_participants += 1
            session.commit()
            
            return {
                'success': True,
                'data': self._serialize(enrollment)
            }, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, e):
        return {
            'id': e.id,
            'training_id': e.training_id,
            'worker_id': e.worker_id,
            'enrollment_date': serialize_date(e.enrollment_date),
            'status': e.status,
            'completion_date': serialize_date(e.completion_date),
            'score': e.score,
            'certificate_issued': e.certificate_issued,
            'notes': e.notes,
            'created_at': serialize_date(e.created_at),
            'updated_at': serialize_date(e.updated_at),
        }


# 評価管理API
class EvaluationListResource(Resource):
    def get(self, worker_id):
        """就労者の評価一覧を取得"""
        session = db.get_session()
        try:
            evaluations = session.query(Evaluation).filter(
                Evaluation.worker_id == worker_id
            ).order_by(Evaluation.evaluation_date.desc()).all()
            
            return {
                'success': True,
                'data': [self._serialize(e) for e in evaluations]
            }, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id):
        """評価を登録"""
        session = db.get_session()
        try:
            data = request.get_json()
            
            evaluation = Evaluation(
                worker_id=worker_id,
                evaluator=data.get('evaluator'),
                evaluation_type=data.get('evaluation_type'),
                evaluation_date=datetime.fromisoformat(data['evaluation_date'].replace('Z', '+00:00')).date() if data.get('evaluation_date') else datetime.now().date(),
                overall_score=data.get('overall_score'),
                communication_score=data.get('communication_score'),
                technical_score=data.get('technical_score'),
                attitude_score=data.get('attitude_score'),
                punctuality_score=data.get('punctuality_score'),
                teamwork_score=data.get('teamwork_score'),
                comments=data.get('comments'),
                strengths=data.get('strengths'),
                areas_for_improvement=data.get('areas_for_improvement'),
                next_review_date=datetime.fromisoformat(data['next_review_date'].replace('Z', '+00:00')).date() if data.get('next_review_date') else None,
            )
            
            session.add(evaluation)
            session.commit()
            
            return {
                'success': True,
                'data': self._serialize(evaluation)
            }, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, e):
        return {
            'id': e.id,
            'worker_id': e.worker_id,
            'evaluator': e.evaluator,
            'evaluation_type': e.evaluation_type,
            'evaluation_date': serialize_date(e.evaluation_date),
            'overall_score': e.overall_score,
            'communication_score': e.communication_score,
            'technical_score': e.technical_score,
            'attitude_score': e.attitude_score,
            'punctuality_score': e.punctuality_score,
            'teamwork_score': e.teamwork_score,
            'comments': e.comments,
            'strengths': e.strengths,
            'areas_for_improvement': e.areas_for_improvement,
            'next_review_date': serialize_date(e.next_review_date),
            'created_at': serialize_date(e.created_at),
            'updated_at': serialize_date(e.updated_at),
        }


# メッセージ管理API
class MessageListResource(Resource):
    def get(self, worker_id):
        """就労者のメッセージ一覧を取得"""
        session = db.get_session()
        try:
            messages = session.query(Message).filter(
                Message.worker_id == worker_id
            ).order_by(Message.created_at.desc()).all()
            
            return {
                'success': True,
                'data': [self._serialize(m) for m in messages]
            }, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id):
        """メッセージを送信"""
        session = db.get_session()
        try:
            data = request.get_json()
            
            message = Message(
                worker_id=worker_id,
                sender=data.get('sender'),
                recipient=data.get('recipient'),
                subject=data.get('subject'),
                message=data.get('message'),
                priority=data.get('priority', 'normal'),
                message_type=data.get('message_type', 'general'),
            )
            
            session.add(message)
            session.commit()
            
            return {
                'success': True,
                'data': self._serialize(message)
            }, 201
        except Exception as e:
            session.rollback()
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def _serialize(self, m):
        return {
            'id': m.id,
            'worker_id': m.worker_id,
            'sender': m.sender,
            'recipient': m.recipient,
            'subject': m.subject,
            'message': m.message,
            'is_read': m.is_read,
            'read_at': serialize_date(m.read_at),
            'priority': m.priority,
            'message_type': m.message_type,
            'created_at': serialize_date(m.created_at),
        }


# カレンダー管理API
class CalendarEventListResource(Resource):
    def get(self, worker_id=None):
        """カレンダーイベント一覧を取得"""
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
            
            return {
                'success': True,
                'data': [self._serialize(e) for e in events]
            }, 200
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
        finally:
            session.close()
    
    def post(self, worker_id=None):
        """カレンダーイベントを登録"""
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
            
            return {
                'success': True,
                'data': self._serialize(event)
            }, 201
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


# APIルートの登録（メインのapi.pyから統合する必要があります）
# このファイルは拡張機能用のAPIで、メインのapi.pyに統合する必要があります

