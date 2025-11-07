"""
データベースモデルと初期化
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
import hashlib
import secrets

Base = declarative_base()


class User(Base):
    """ユーザーモデル（認証・認可）"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True, nullable=False)  # ログインID
    password_hash = Column(String(256), nullable=False)  # パスワードハッシュ
    email = Column(String(100), unique=True, nullable=False)
    role = Column(String(50), nullable=False, default='trainee')  # trainee, administrator, auditor
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=True)  # 訓練生の場合、Workerとの関連
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    worker = relationship("Worker", foreign_keys=[worker_id])
    
    def set_password(self, password: str):
        """パスワードをハッシュ化して設定"""
        salt = secrets.token_hex(16)
        password_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        self.password_hash = f"{salt}:{password_hash.hex()}"
    
    def check_password(self, password: str) -> bool:
        """パスワードを検証"""
        try:
            salt, stored_hash = self.password_hash.split(':')
            password_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
            return password_hash.hex() == stored_hash
        except:
            return False


class JobPosting(Base):
    """
    求人情報モデル
    求人情報を管理するテーブル
    """
    __tablename__ = 'job_postings'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    company_name = Column(String(100), nullable=False)
    description = Column(Text)
    required_skills = Column(Text)  # カンマ区切りでスキルを保存
    location = Column(String(100))
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    employment_type = Column(String(50))  # 正社員、契約社員、パートタイムなど
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    applications = relationship("Application", back_populates="job_posting")
    interviews = relationship("Interview", back_populates="job_posting")


class Applicant(Base):
    """応募者モデル"""
    __tablename__ = 'applicants'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    phone = Column(String(500))  # 暗号化された値を保存するため、サイズを拡張
    address = Column(String(200))
    skills = Column(Text)  # カンマ区切りでスキルを保存
    experience_years = Column(Integer, default=0)
    education = Column(String(200))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    applications = relationship("Application", back_populates="applicant")
    interviews = relationship("Interview", back_populates="applicant")


class Application(Base):
    """応募情報モデル"""
    __tablename__ = 'applications'
    
    id = Column(Integer, primary_key=True)
    applicant_id = Column(Integer, ForeignKey('applicants.id'), nullable=False)
    job_posting_id = Column(Integer, ForeignKey('job_postings.id'), nullable=False)
    status = Column(String(50), default='応募中')  # 応募中、審査中、合格、不合格など
    cover_letter = Column(Text)
    applied_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    applicant = relationship("Applicant", back_populates="applications")
    job_posting = relationship("JobPosting", back_populates="applications")


class Interview(Base):
    """面接スケジュールモデル"""
    __tablename__ = 'interviews'
    
    id = Column(Integer, primary_key=True)
    applicant_id = Column(Integer, ForeignKey('applicants.id'), nullable=False)
    job_posting_id = Column(Integer, ForeignKey('job_postings.id'), nullable=False)
    interview_date = Column(DateTime, nullable=False)
    interview_type = Column(String(50))  # 一次面接、二次面接、最終面接など
    location = Column(String(200))
    interviewer = Column(String(100))
    notes = Column(Text)
    result = Column(String(50))  # 合格、不合格、保留など
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    applicant = relationship("Applicant", back_populates="interviews")
    job_posting = relationship("JobPosting", back_populates="interviews")


class Skill(Base):
    """スキルモデル"""
    __tablename__ = 'skills'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    category = Column(String(50))  # プログラミング、言語、その他など
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class Matching(Base):
    """マッチング結果モデル"""
    __tablename__ = 'matchings'
    
    id = Column(Integer, primary_key=True)
    applicant_id = Column(Integer, ForeignKey('applicants.id'), nullable=False)
    job_posting_id = Column(Integer, ForeignKey('job_postings.id'), nullable=False)
    match_score = Column(Float)  # マッチングスコア (0-100)
    matched_skills = Column(Text)  # マッチしたスキル
    created_at = Column(DateTime, default=datetime.now)
    
    # リレーション
    applicant = relationship("Applicant")
    job_posting = relationship("JobPosting")


class Worker(Base):
    """外国人就労者モデル（属性管理）"""
    __tablename__ = 'workers'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    name_kana = Column(String(100))  # カナ名
    email = Column(String(100), nullable=False)
    phone = Column(String(500))  # 暗号化された値を保存するため、サイズを拡張
    address = Column(String(200))
    birth_date = Column(Date)
    nationality = Column(String(100))  # 国籍
    native_language = Column(String(50))  # 母国語
    visa_status = Column(String(50))  # 在留資格（技術・人文知識・国際業務、特定技能など）
    visa_expiry_date = Column(Date)  # 在留期限
    japanese_level = Column(String(20))  # 日本語レベル（N1, N2, N3, N4, N5）
    english_level = Column(String(20))  # 英語レベル
    skills = Column(Text)  # スキル（カンマ区切り）
    experience_years = Column(Integer, default=0)
    education = Column(String(200))
    current_status = Column(String(50), default='登録中')  # 登録中、面談中、就労中、休職中など
    notes = Column(Text)  # 備考
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    progress_records = relationship("WorkerProgress", back_populates="worker", cascade="all, delete-orphan")
    documents = relationship("Document", foreign_keys="Document.worker_id", cascade="all, delete-orphan")
    notifications = relationship("Notification", foreign_keys="Notification.worker_id", cascade="all, delete-orphan")
    training_enrollments = relationship("TrainingEnrollment", foreign_keys="TrainingEnrollment.worker_id", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", foreign_keys="Evaluation.worker_id", cascade="all, delete-orphan")
    messages = relationship("Message", foreign_keys="Message.worker_id", cascade="all, delete-orphan")
    calendar_events = relationship("CalendarEvent", foreign_keys="CalendarEvent.worker_id", cascade="all, delete-orphan")
    reports = relationship("Report", foreign_keys="Report.worker_id", cascade="all, delete-orphan")
    japanese_proficiencies = relationship("JapaneseProficiency", foreign_keys="JapaneseProficiency.worker_id", cascade="all, delete-orphan")
    skill_trainings = relationship("SkillTraining", foreign_keys="SkillTraining.worker_id", cascade="all, delete-orphan")
    japanese_learning_records = relationship("JapaneseLearningRecord", foreign_keys="JapaneseLearningRecord.worker_id", cascade="all, delete-orphan")
    pre_departure_supports = relationship("PreDepartureSupport", foreign_keys="PreDepartureSupport.worker_id", cascade="all, delete-orphan")


class WorkerProgress(Base):
    """就労支援進捗管理モデル"""
    __tablename__ = 'worker_progress'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=False)
    progress_date = Column(Date, nullable=False)  # 進捗記録日
    progress_type = Column(String(50), nullable=False)  # 進捗タイプ（面談、研修、就労開始、定期フォローなど）
    title = Column(String(200))  # タイトル
    description = Column(Text)  # 詳細説明
    status = Column(String(50), default='実施中')  # 状態（実施中、完了、保留、キャンセル）
    support_content = Column(Text)  # サポート内容
    next_action = Column(Text)  # 次のアクション
    next_action_date = Column(Date)  # 次のアクション予定日
    support_staff = Column(String(100))  # 担当スタッフ
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    worker = relationship("Worker", back_populates="progress_records")


class Document(Base):
    """ドキュメント管理モデル"""
    __tablename__ = 'documents'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=False)
    document_type = Column(String(50), nullable=False)  # 履歴書、在留資格証明書、パスポート、契約書など
    title = Column(String(200), nullable=False)
    file_path = Column(String(500))  # ファイルパスまたはURL
    file_name = Column(String(200))
    file_size = Column(Integer)  # ファイルサイズ（バイト）
    mime_type = Column(String(100))  # MIMEタイプ
    description = Column(Text)
    expiry_date = Column(Date)  # 有効期限（在留資格証明書など）
    is_required = Column(Boolean, default=False)  # 必須書類かどうか
    is_verified = Column(Boolean, default=False)  # 検証済みかどうか
    uploaded_by = Column(String(100))  # アップロードした人
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    worker = relationship("Worker")


class Notification(Base):
    """通知・リマインダーモデル"""
    __tablename__ = 'notifications'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=True)  # Noneの場合は全員向け
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)  # リマインダー、通知、警告など
    priority = Column(String(20), default='normal')  # low, normal, high, urgent
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    scheduled_date = Column(DateTime)  # 通知予定日時
    related_type = Column(String(50))  # 関連タイプ（interview, document, trainingなど）
    related_id = Column(Integer)  # 関連ID
    created_at = Column(DateTime, default=datetime.now)
    
    # リレーション
    worker = relationship("Worker")


class Training(Base):
    """研修・トレーニングモデル"""
    __tablename__ = 'trainings'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    training_type = Column(String(50))  # 日本語、ビジネスマナー、技術研修など
    category = Column(String(50))  # 必須、推奨、オプション
    duration_hours = Column(Integer)  # 研修時間（時間）
    start_date = Column(Date)
    end_date = Column(Date)
    location = Column(String(200))  # 場所（オンライン、オフライン）
    instructor = Column(String(100))  # 講師
    max_participants = Column(Integer)  # 最大参加者数
    current_participants = Column(Integer, default=0)  # 現在の参加者数
    status = Column(String(50), default='予定')  # 予定、開催中、完了、キャンセル
    materials = Column(Text)  # 研修資料のURLやパス
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    enrollments = relationship("TrainingEnrollment", back_populates="training", cascade="all, delete-orphan")


class TrainingEnrollment(Base):
    """研修受講登録モデル"""
    __tablename__ = 'training_enrollments'
    
    id = Column(Integer, primary_key=True)
    training_id = Column(Integer, ForeignKey('trainings.id'), nullable=False)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=False)
    enrollment_date = Column(Date, nullable=False)
    status = Column(String(50), default='登録済み')  # 登録済み、受講中、完了、欠席
    completion_date = Column(Date)
    score = Column(Float)  # 評価スコア
    certificate_issued = Column(Boolean, default=False)  # 修了証発行済み
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    training = relationship("Training", back_populates="enrollments")
    worker = relationship("Worker")


class JapaneseProficiency(Base):
    """日本語能力管理モデル"""
    __tablename__ = 'japanese_proficiencies'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=False)
    test_date = Column(Date, nullable=False)  # 試験日
    test_type = Column(String(50), nullable=False)  # JLPT, JFT-Basic, BJTなど
    level = Column(String(20))  # N1, N2, N3, N4, N5, A1, A2, B1, B2, C1, C2
    reading_score = Column(Integer)  # 読解スコア
    listening_score = Column(Integer)  # 聴解スコア
    writing_score = Column(Integer)  # 作文スコア
    speaking_score = Column(Integer)  # 口頭表現スコア
    total_score = Column(Integer)  # 総合スコア
    passed = Column(Boolean, default=False)  # 合格/不合格
    certificate_number = Column(String(100))  # 証明書番号
    certificate_issued_date = Column(Date)  # 証明書発行日
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    worker = relationship("Worker")


class SkillTraining(Base):
    """技能訓練モデル"""
    __tablename__ = 'skill_trainings'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=False)
    skill_category = Column(String(100), nullable=False)  # 建設、製造、介護、農業、外食など
    skill_name = Column(String(200), nullable=False)  # 具体的な技能名
    training_start_date = Column(Date, nullable=False)
    training_end_date = Column(Date)
    training_hours = Column(Integer, default=0)  # 訓練時間（時間）
    training_location = Column(String(200))  # 訓練場所
    instructor = Column(String(100))  # 指導者
    training_method = Column(String(50))  # 実技、座学、オンライン、OJTなど
    status = Column(String(50), default='受講中')  # 受講中、修了、中断、未開始
    completion_rate = Column(Float)  # 修了率（0-100%）
    evaluation_score = Column(Float)  # 評価スコア（0-100）
    certificate_issued = Column(Boolean, default=False)  # 修了証発行済み
    certificate_number = Column(String(100))  # 修了証番号
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    worker = relationship("Worker")
    training_records = relationship("SkillTrainingRecord", back_populates="skill_training", cascade="all, delete-orphan")


class SkillTrainingRecord(Base):
    """技能訓練記録モデル（進捗記録）"""
    __tablename__ = 'skill_training_records'
    
    id = Column(Integer, primary_key=True)
    skill_training_id = Column(Integer, ForeignKey('skill_trainings.id'), nullable=False)
    record_date = Column(Date, nullable=False)  # 記録日
    training_content = Column(Text, nullable=False)  # 訓練内容
    hours_trained = Column(Float)  # 訓練時間
    progress_percentage = Column(Float)  # 進捗率（0-100%）
    instructor_feedback = Column(Text)  # 指導者からのフィードバック
    worker_self_assessment = Column(Text)  # 本人の自己評価
    difficulties = Column(Text)  # 課題・困難点
    improvements = Column(Text)  # 改善点
    next_focus = Column(Text)  # 次回の重点項目
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    skill_training = relationship("SkillTraining", back_populates="training_records")


class JapaneseLearningRecord(Base):
    """日本語学習記録モデル"""
    __tablename__ = 'japanese_learning_records'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=False)
    learning_date = Column(Date, nullable=False)  # 学習日
    learning_type = Column(String(50), nullable=False)  # 教室、オンライン、自習、実践など
    learning_content = Column(Text, nullable=False)  # 学習内容
    topics_covered = Column(Text)  # 学習トピック（カンマ区切り）
    duration_minutes = Column(Integer)  # 学習時間（分）
    vocabulary_learned = Column(Integer)  # 学習単語数
    grammar_points = Column(Text)  # 学習文法項目
    practice_activities = Column(Text)  # 練習活動
    difficulty_level = Column(String(20))  # 難易度（初級、中級、上級）
    self_rating = Column(Integer)  # 自己評価（1-5）
    instructor_feedback = Column(Text)  # 講師からのフィードバック
    homework_assigned = Column(Text)  # 宿題
    homework_completed = Column(Boolean, default=False)  # 宿題完了
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    worker = relationship("Worker")


class PreDepartureSupport(Base):
    """来日前支援モデル"""
    __tablename__ = 'pre_departure_supports'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=False)
    support_type = Column(String(50), nullable=False)  # ビザ申請、契約書確認、事前研修、健康診断など
    support_date = Column(Date, nullable=False)
    support_content = Column(Text, nullable=False)  # 支援内容
    status = Column(String(50), default='予定')  # 予定、実施中、完了、保留
    required_documents = Column(Text)  # 必要書類（カンマ区切り）
    documents_submitted = Column(Boolean, default=False)  # 書類提出済み
    support_staff = Column(String(100))  # 担当スタッフ
    next_action = Column(Text)  # 次のアクション
    next_action_date = Column(Date)  # 次のアクション予定日
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    worker = relationship("Worker")


class Evaluation(Base):
    """評価・フィードバックモデル"""
    __tablename__ = 'evaluations'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=False)
    evaluator = Column(String(100), nullable=False)  # 評価者
    evaluation_type = Column(String(50), nullable=False)  # 定期評価、プロジェクト評価、最終評価など
    evaluation_date = Column(Date, nullable=False)
    overall_score = Column(Float)  # 総合評価スコア（0-100）
    communication_score = Column(Float)  # コミュニケーション能力
    technical_score = Column(Float)  # 技術力
    attitude_score = Column(Float)  # 態度・姿勢
    punctuality_score = Column(Float)  # 時間厳守
    teamwork_score = Column(Float)  # チームワーク
    comments = Column(Text)  # コメント
    strengths = Column(Text)  # 強み
    areas_for_improvement = Column(Text)  # 改善点
    next_review_date = Column(Date)  # 次回評価予定日
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    worker = relationship("Worker")


class Message(Base):
    """メッセージングモデル"""
    __tablename__ = 'messages'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=False)
    sender = Column(String(100), nullable=False)  # 送信者
    recipient = Column(String(100), nullable=False)  # 受信者
    subject = Column(String(200))
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    priority = Column(String(20), default='normal')  # low, normal, high
    message_type = Column(String(50), default='general')  # general, support, question, announcement
    created_at = Column(DateTime, default=datetime.now)
    
    # リレーション
    worker = relationship("Worker")


class CalendarEvent(Base):
    """カレンダーイベントモデル"""
    __tablename__ = 'calendar_events'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=True)  # Noneの場合は全員向け
    title = Column(String(200), nullable=False)
    description = Column(Text)
    event_type = Column(String(50), nullable=False)  # 面談、研修、面接、会議、イベントなど
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)
    location = Column(String(200))
    attendees = Column(Text)  # 参加者（カンマ区切り）
    is_all_day = Column(Boolean, default=False)
    reminder_minutes = Column(Integer)  # リマインダー（分前）
    color = Column(String(20), default='blue')  # カレンダー表示色
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    worker = relationship("Worker")


class Report(Base):
    """レポート・統計モデル"""
    __tablename__ = 'reports'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=True)  # Noneの場合は全体レポート
    report_type = Column(String(50), nullable=False)  # 月次、年次、カスタムなど
    title = Column(String(200), nullable=False)
    description = Column(Text)
    report_data = Column(Text)  # JSON形式のデータ
    period_start = Column(Date)
    period_end = Column(Date)
    generated_by = Column(String(100))  # 生成者
    generated_at = Column(DateTime, default=datetime.now)
    
    # リレーション
    worker = relationship("Worker")


class TrainingMenu(Base):
    """訓練メニューモデル（Unityシミュレーター用）"""
    __tablename__ = 'training_menus'
    
    id = Column(Integer, primary_key=True)
    menu_name = Column(String(200), nullable=False)  # メニュー名
    scenario_id = Column(String(100), nullable=False)  # シナリオID
    scenario_description = Column(Text)  # シナリオ説明
    target_safety_score = Column(Float)  # 目標安全動作率（0-100）
    target_error_count = Column(Integer)  # 目標エラー件数（最小値）
    target_procedure_compliance = Column(Float)  # 目標手順遵守率（0-100）
    target_work_time = Column(Integer)  # 目標作業時間（秒）
    target_achievement_rate = Column(Float)  # 目標達成度（0-100）
    equipment_type = Column(String(100), nullable=False)  # 使用重機（油圧ショベル、ブルドーザーなど）
    difficulty_level = Column(String(20), nullable=False)  # 難易度（初級、中級、上級）
    time_limit = Column(Integer)  # 制限時間（秒）
    is_active = Column(Boolean, default=True)  # 有効/無効
    created_by = Column(String(100))  # 作成者
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    training_sessions = relationship("TrainingSession", back_populates="training_menu", cascade="all, delete-orphan")
    menu_assignments = relationship("TrainingMenuAssignment", back_populates="training_menu", cascade="all, delete-orphan")


class TrainingMenuAssignment(Base):
    """訓練メニュー割り当てモデル"""
    __tablename__ = 'training_menu_assignments'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=False)
    training_menu_id = Column(Integer, ForeignKey('training_menus.id'), nullable=False)
    assigned_date = Column(Date, nullable=False)
    deadline = Column(Date)  # 期限
    status = Column(String(50), default='未開始')  # 未開始、実施中、完了、中断
    completed_at = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    worker = relationship("Worker")
    training_menu = relationship("TrainingMenu", back_populates="menu_assignments")


class TrainingSession(Base):
    """訓練セッションモデル（Unityから送信される訓練結果）"""
    __tablename__ = 'training_sessions'
    
    id = Column(Integer, primary_key=True)
    session_id = Column(String(100), unique=True, nullable=False)  # Unityから送信されるセッションID
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=True)  # NULLを許可（モックモードやテスト用）
    training_menu_id = Column(Integer, ForeignKey('training_menus.id'), nullable=True)
    session_start_time = Column(DateTime, nullable=False)
    session_end_time = Column(DateTime, nullable=False)
    duration_seconds = Column(Integer)  # セッション時間（秒）
    # operation_logs_json = Column(Text, nullable=True)  # 操作ログ（JSON形式でタイムライン記録）- データベースマイグレーションで追加される（一時的にコメントアウト）
    ai_evaluation_json = Column(Text)  # AI評価コメント（JSON形式）
    replay_data_json = Column(Text)  # リプレイ用データ（JSON形式）
    status = Column(String(50), default='完了')  # 完了、中断、エラー
    created_at = Column(DateTime, default=datetime.now)
    
    # リレーション
    worker = relationship("Worker")
    training_menu = relationship("TrainingMenu", back_populates="training_sessions")
    kpi_scores = relationship("KPIScore", back_populates="training_session", cascade="all, delete-orphan")
    operation_logs = relationship("OperationLog", back_populates="training_session", cascade="all, delete-orphan")


class KPIScore(Base):
    """
    KPIスコアモデル
    訓練セッションのKPI（Key Performance Indicator）スコアを管理するテーブル
    """
    __tablename__ = 'kpi_scores'
    
    id = Column(Integer, primary_key=True)
    training_session_id = Column(Integer, ForeignKey('training_sessions.id'), nullable=False)  # 訓練セッションID
    safety_score = Column(Float)  # 安全動作率（0-100）
    error_count = Column(Integer, default=0)  # エラー件数
    procedure_compliance_rate = Column(Float)  # 手順遵守率（0-100）
    work_time_seconds = Column(Integer)  # 作業時間（秒）
    achievement_rate = Column(Float)  # 目標達成度（0-100）
    accuracy_score = Column(Float)  # 正確性スコア（0-100）
    efficiency_score = Column(Float)  # 効率性スコア（0-100）
    overall_score = Column(Float)  # 総合スコア（0-100）
    notes = Column(Text)  # 備考
    created_at = Column(DateTime, default=datetime.now)  # 作成日時
    
    # リレーション
    training_session = relationship("TrainingSession", back_populates="kpi_scores")  # 訓練セッションとの関連


class OperationLog(Base):
    """
    操作ログモデル（操作タイムライン記録）
    Unityシミュレーターからの操作ログをタイムライン形式で記録するテーブル
    リプレイ機能で使用される
    """
    __tablename__ = 'operation_logs'
    
    id = Column(Integer, primary_key=True)
    training_session_id = Column(Integer, ForeignKey('training_sessions.id'), nullable=False)  # 訓練セッションID
    timestamp = Column(DateTime, nullable=False)  # 操作タイムスタンプ（操作が発生した時刻）
    operation_type = Column(String(100), nullable=False)  # 操作タイプ（レバー入力、ペダル入力など）
    operation_value = Column(Float)  # 操作値
    equipment_state = Column(Text)  # 重機状態（JSON形式）
    position_x = Column(Float)  # 重機の位置X座標
    position_y = Column(Float)  # 重機の位置Y座標
    position_z = Column(Float)  # 重機の位置Z座標
    velocity = Column(Float)  # 重機の速度
    error_event = Column(Boolean, default=False)  # エラーイベントが発生したかどうか
    error_description = Column(Text)  # エラー説明
    created_at = Column(DateTime, default=datetime.now)  # 作成日時
    
    # リレーション
    training_session = relationship("TrainingSession", back_populates="operation_logs")  # 訓練セッションとの関連


class Milestone(Base):
    """マイルストーンモデル"""
    __tablename__ = 'milestones'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=False)
    milestone_name = Column(String(200), nullable=False)  # マイルストーン名
    milestone_type = Column(String(100), nullable=False)  # 特定訓練コース修了、JLPT N3合格、安全講習修了、重機操作資格取得など
    target_date = Column(Date)  # 目標日
    achieved_date = Column(Date)  # 達成日
    status = Column(String(50), default='未達成')  # 未達成、達成、保留
    certificate_number = Column(String(100))  # 証明書番号
    certificate_file_path = Column(String(500))  # 証明書ファイルパス
    evidence_report_id = Column(Integer, ForeignKey('reports.id'))  # 証跡レポートID
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    worker = relationship("Worker")
    evidence_report = relationship("Report")


class CareerPath(Base):
    """キャリアパスモデル（育成就労→特定技能1号→2号）"""
    __tablename__ = 'career_paths'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=False)
    path_stage = Column(String(100), nullable=False)  # 育成就労、特定技能1号、特定技能2号
    stage_start_date = Column(Date, nullable=False)
    stage_end_date = Column(Date)
    status = Column(String(50), default='予定')  # 予定、進行中、完了
    target_japanese_level = Column(String(20))  # 目標日本語レベル（JLPT N3、N2など）
    target_skill_level = Column(String(100))  # 目標技能レベル
    achieved_japanese_level = Column(String(20))  # 達成日本語レベル
    achieved_skill_level = Column(String(100))  # 達成技能レベル
    transition_date = Column(Date)  # 移行日
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    worker = relationship("Worker")


class ConstructionSimulatorTraining(Base):
    """建設機械シミュレーター訓練モデル"""
    __tablename__ = 'construction_simulator_trainings'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=False)
    machine_type = Column(String(100), nullable=False)  # バックホー、ブルドーザー、クレーン、フォークリフトなど
    simulator_model = Column(String(100))  # シミュレーターモデル名
    training_start_date = Column(Date, nullable=False)
    training_end_date = Column(Date)
    total_training_hours = Column(Float, default=0.0)  # 総訓練時間（時間）
    training_location = Column(String(200))  # 訓練場所
    instructor = Column(String(100))  # 指導者
    status = Column(String(50), default='受講中')  # 受講中、修了、中断、未開始
    completion_rate = Column(Float, default=0.0)  # 修了率（0-100%）
    evaluation_score = Column(Float)  # 評価スコア（0-100）
    safety_score = Column(Float)  # 安全運転スコア（0-100）
    efficiency_score = Column(Float)  # 効率性スコア（0-100）
    accuracy_score = Column(Float)  # 正確性スコア（0-100）
    certificate_issued = Column(Boolean, default=False)  # 修了証発行済み
    certificate_number = Column(String(100))  # 修了証番号
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    worker = relationship("Worker")
    training_sessions = relationship("ConstructionSimulatorSession", back_populates="training", cascade="all, delete-orphan")


class ConstructionSimulatorSession(Base):
    """建設機械シミュレーター訓練セッションモデル"""
    __tablename__ = 'construction_simulator_sessions'
    
    id = Column(Integer, primary_key=True)
    training_id = Column(Integer, ForeignKey('construction_simulator_trainings.id'), nullable=False)
    session_date = Column(DateTime, nullable=False)  # セッション日時
    session_duration_minutes = Column(Integer, nullable=False)  # セッション時間（分）
    scenario_type = Column(String(100))  # シナリオタイプ（基本操作、現場作業、応用操作など）
    scenario_difficulty = Column(String(20))  # 難易度（初級、中級、上級）
    score = Column(Float)  # セッションスコア（0-100）
    safety_score = Column(Float)  # 安全運転スコア
    efficiency_score = Column(Float)  # 効率性スコア
    accuracy_score = Column(Float)  # 正確性スコア
    errors_count = Column(Integer, default=0)  # エラー回数
    warnings_count = Column(Integer, default=0)  # 警告回数
    completion_status = Column(String(50))  # 完了、中断、失敗
    instructor_feedback = Column(Text)  # 指導者からのフィードバック
    worker_self_assessment = Column(Text)  # 本人の自己評価
    improvements_needed = Column(Text)  # 改善が必要な点
    next_focus = Column(Text)  # 次回の重点項目
    session_data_json = Column(Text)  # セッションデータ（JSON形式で詳細データを保存）
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    training = relationship("ConstructionSimulatorTraining", back_populates="training_sessions")


class IntegratedGrowth(Base):
    """
    統合成長管理モデル（技能＋語学力の可視化）
    技能と語学力を統合的に管理し、成長を可視化するテーブル
    """
    __tablename__ = 'integrated_growth'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=False)
    assessment_date = Column(Date, nullable=False)  # 評価日
    japanese_level = Column(String(20))  # 日本語レベル（JLPT N1-N5、A1-C2）
    japanese_score = Column(Float)  # 日本語スコア（0-100）
    skill_level = Column(String(100))  # 技能レベル
    skill_score = Column(Float)  # 技能スコア（0-100）
    simulator_score = Column(Float)  # シミュレーター訓練スコア（0-100）
    overall_growth_score = Column(Float)  # 統合成長スコア（0-100）
    growth_trend = Column(String(50))  # 成長傾向（向上、維持、低下）
    readiness_for_transition = Column(String(50))  # 移行準備度（準備完了、準備中、未準備）
    target_achievement_rate = Column(Float)  # 目標達成率（0-100%）
    next_milestone = Column(String(200))  # 次のマイルストーン
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    worker = relationship("Worker")


class SpecificSkillTransition(Base):
    """特定技能移行支援モデル"""
    __tablename__ = 'specific_skill_transitions'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=False)
    transition_type = Column(String(100), nullable=False)  # 育成就労→特定技能1号、特定技能1号→2号
    target_transition_date = Column(Date)  # 目標移行日
    actual_transition_date = Column(Date)  # 実際の移行日
    status = Column(String(50), default='計画中')  # 計画中、準備中、申請中、完了、保留
    required_japanese_level = Column(String(20))  # 必要日本語レベル
    required_skill_level = Column(String(100))  # 必要技能レベル
    current_japanese_level = Column(String(20))  # 現在の日本語レベル
    current_skill_level = Column(String(100))  # 現在の技能レベル
    readiness_assessment = Column(Text)  # 準備度評価
    required_documents = Column(Text)  # 必要書類（カンマ区切り）
    documents_submitted = Column(Boolean, default=False)  # 書類提出済み
    application_submitted = Column(Boolean, default=False)  # 申請提出済み
    application_date = Column(Date)  # 申請日
    approval_date = Column(Date)  # 承認日
    support_staff = Column(String(100))  # 担当スタッフ
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    worker = relationship("Worker")


class DigitalEvidence(Base):
    """デジタル証跡モデル（監査対応）"""
    __tablename__ = 'digital_evidence'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=False)
    evidence_type = Column(String(100), nullable=False)  # 訓練記録、評価記録、証明書、申請書類など
    related_type = Column(String(100))  # 関連タイプ（simulator_training、japanese_proficiency、skill_trainingなど）
    related_id = Column(Integer)  # 関連ID
    evidence_title = Column(String(200), nullable=False)  # 証跡タイトル
    evidence_description = Column(Text)  # 証跡説明
    file_path = Column(String(500))  # ファイルパス
    file_hash = Column(String(256))  # ファイルハッシュ（改ざん検知用）
    metadata_json = Column(Text)  # メタデータ（JSON形式）
    created_by = Column(String(100))  # 作成者
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    is_verified = Column(Boolean, default=False)  # 検証済み
    verified_by = Column(String(100))  # 検証者
    verified_at = Column(DateTime)  # 検証日時
    audit_trail_json = Column(Text)  # 監査証跡（JSON形式で変更履歴を保存）
    
    # リレーション
    worker = relationship("Worker")


class CareerGoal(Base):
    """
    キャリア目標設定モデル
    就労者のキャリア目標を設定・管理するテーブル
    目標カテゴリ、進捗、マイルストーン、成功基準を記録
    """
    __tablename__ = 'career_goals'
    
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey('workers.id'), nullable=False)
    goal_name = Column(String(200), nullable=False)  # 目標名
    goal_category = Column(String(100), nullable=False)  # 日本語、技能、資格、キャリアなど
    description = Column(Text)  # 目標説明
    target_date = Column(Date)  # 目標日
    current_progress = Column(Float, default=0.0)  # 現在の進捗（0-100%）
    status = Column(String(50), default='進行中')  # 進行中、達成、保留、未達成
    achieved_date = Column(Date)  # 達成日
    milestones_json = Column(Text)  # マイルストーン（JSON形式）
    success_criteria = Column(Text)  # 成功基準
    support_resources = Column(Text)  # 支援リソース
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # リレーション
    worker = relationship("Worker")


class Database:
    """
    データベース管理クラス
    SQLAlchemyを使用してデータベース接続とテーブル管理を行う
    """
    
    def __init__(self, db_url=None):
        """
        データベース初期化
        
        Args:
            db_url: データベースURL（デフォルトは環境変数から取得、なければPostgreSQL）
            
        環境変数から以下の設定を読み取る:
        - DATABASE_URL: 完全なデータベースURL（優先）
        - DB_HOST: データベースホスト（デフォルト: localhost）
        - DB_PORT: データベースポート（デフォルト: 5432）
        - DB_NAME: データベース名（デフォルト: job_assistance）
        - DB_USER: データベースユーザー（デフォルト: postgres）
        - DB_PASSWORD: データベースパスワード（デフォルト: postgres）
        """
        if db_url is None:
            # 環境変数からデータベースURLを取得
            db_url = os.getenv('DATABASE_URL')
            if not db_url:
                # PostgreSQLのデフォルト接続情報を環境変数から取得（末尾の空白を削除）
                db_host = os.getenv('DB_HOST', 'localhost').strip()
                db_port = os.getenv('DB_PORT', '5432').strip()
                db_name = os.getenv('DB_NAME', 'job_assistance').strip()
                db_user = os.getenv('DB_USER', 'postgres').strip()
                db_password = os.getenv('DB_PASSWORD', 'postgres').strip()
                # PostgreSQL接続URLを構築
                db_url = f'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
        
        # SQLAlchemyエンジンを作成（echo=FalseでSQLログを無効化）
        self.engine = create_engine(db_url, echo=False)
        # セッションファクトリを作成（エンジンにバインド）
        self.SessionLocal = sessionmaker(bind=self.engine)
        self.db_url = db_url
    
    def init_database(self):
        """
        データベーステーブルを作成
        Base.metadataに定義されたすべてのテーブルをデータベースに作成する
        """
        Base.metadata.create_all(self.engine)
        
        # 既存のテーブルにカラムを追加（マイグレーション）
        from sqlalchemy import text, inspect
        inspector = inspect(self.engine)
        
        # training_sessionsテーブルに不足しているカラムを追加
        if 'training_sessions' in inspector.get_table_names():
            try:
                columns = [col['name'] for col in inspector.get_columns('training_sessions')]
                db_type = self.engine.dialect.name
                
                # 追加が必要なカラムのリスト
                required_columns = {
                    'operation_logs_json': 'TEXT',
                    'ai_evaluation_json': 'TEXT',
                    'replay_data_json': 'TEXT',
                }
                
                for col_name, col_type in required_columns.items():
                    if col_name not in columns:
                        if db_type == 'postgresql':
                            with self.engine.begin() as conn:
                                conn.execute(text(f"""
                                    DO $$ 
                                    BEGIN 
                                        IF NOT EXISTS (
                                            SELECT 1 FROM information_schema.columns 
                                            WHERE table_name = 'training_sessions' 
                                            AND column_name = '{col_name}'
                                        ) THEN
                                            ALTER TABLE training_sessions ADD COLUMN {col_name} {col_type};
                                        END IF;
                                    END $$;
                                """))
                        else:
                            # その他のデータベース（SQLiteなど）
                            with self.engine.begin() as conn:
                                conn.execute(text(f"ALTER TABLE training_sessions ADD COLUMN {col_name} {col_type}"))
                        print(f"training_sessionsテーブルに{col_name}カラムを追加しました。")
                    else:
                        print(f"training_sessionsテーブルに{col_name}カラムは既に存在します。")
            except Exception as e:
                print(f"カラム追加エラー: {e}")
                import traceback
                traceback.print_exc()
        
        # training_sessionsテーブルのworker_idカラムをNULLを許可するように変更
        if 'training_sessions' in inspector.get_table_names():
            try:
                columns = {col['name']: col for col in inspector.get_columns('training_sessions')}
                if 'worker_id' in columns:
                    # worker_idカラムがNOT NULL制約を持っている場合、NULLを許可するように変更
                    db_type = self.engine.dialect.name
                    if db_type == 'postgresql':
                        # PostgreSQLの場合、カラムのNULL制約を確認
                        with self.engine.begin() as conn:
                            result = conn.execute(text("""
                                SELECT is_nullable 
                                FROM information_schema.columns 
                                WHERE table_name = 'training_sessions' 
                                AND column_name = 'worker_id'
                            """))
                            row = result.fetchone()
                            if row and row[0] == 'NO':
                                # NOT NULL制約がある場合、NULLを許可するように変更
                                conn.execute(text("ALTER TABLE training_sessions ALTER COLUMN worker_id DROP NOT NULL"))
                                print("training_sessionsテーブルのworker_idカラムをNULLを許可するように変更しました。")
                            else:
                                print("training_sessionsテーブルのworker_idカラムは既にNULLを許可しています。")
                    else:
                        # SQLiteなど、ALTER COLUMNをサポートしないデータベースの場合
                        print(f"training_sessionsテーブルのworker_idカラムのNULL制約変更はスキップされました（データベースタイプ: {db_type}）。")
            except Exception as e:
                print(f"training_sessionsテーブルのworker_idカラム変更エラー: {e}")
                import traceback
                traceback.print_exc()
        
        # workersテーブルとapplicantsテーブルのphoneカラムのサイズを拡張
        for table_name in ['workers', 'applicants']:
            if table_name in inspector.get_table_names():
                try:
                    columns = {col['name']: col for col in inspector.get_columns(table_name)}
                    if 'phone' in columns:
                        current_type = str(columns['phone']['type'])
                        # 現在のサイズが20文字以下の場合、拡張する
                        if 'varchar(20)' in current_type.lower() or 'character varying(20)' in current_type.lower():
                            db_type = self.engine.dialect.name
                            if db_type == 'postgresql':
                                with self.engine.begin() as conn:
                                    conn.execute(text(f"ALTER TABLE {table_name} ALTER COLUMN phone TYPE VARCHAR(500)"))
                                print(f"{table_name}テーブルのphoneカラムのサイズを拡張しました。")
                            else:
                                # SQLiteなど、ALTER COLUMNをサポートしないデータベースの場合
                                print(f"{table_name}テーブルのphoneカラムのサイズ拡張はスキップされました（データベースタイプ: {db_type}）。")
                        else:
                            print(f"{table_name}テーブルのphoneカラムは既に適切なサイズです。")
                except Exception as e:
                    print(f"{table_name}テーブルのphoneカラム拡張エラー: {e}")
                    import traceback
                    traceback.print_exc()
        
        print("データベースを初期化しました。")
    
    def get_session(self):
        """
        データベースセッションを取得
        データベース操作を行うためのセッションオブジェクトを返す
        
        Returns:
            Session: SQLAlchemyセッションオブジェクト
        """
        return self.SessionLocal()

