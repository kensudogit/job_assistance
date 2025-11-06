"""
モックデータ生成スクリプト
機能仕様に基づいて、テスト用のモックデータを作成します。

使用方法:
    python create_mock_data.py

環境変数:
    DB_HOST: データベースホスト（デフォルト: localhost）
    DB_PORT: データベースポート（デフォルト: 5432）
    DB_NAME: データベース名（デフォルト: job_assistance）
    DB_USER: データベースユーザー（デフォルト: postgres）
    DB_PASSWORD: データベースパスワード（デフォルト: postgres）
"""
import sys
import os
from datetime import datetime, timedelta, date
import random
import json

# プロジェクトルートをパスに追加
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.database import Database, User, Worker, TrainingMenu, TrainingMenuAssignment, TrainingSession, KPIScore, OperationLog, JapaneseProficiency, WorkerProgress, IntegratedGrowth, SpecificSkillTransition, CareerGoal

def create_mock_data():
    """モックデータを作成"""
    db = Database()
    session = db.get_session()
    
    try:
        print("モックデータを作成しています...")
        
        # 既存データを削除（必要に応じて）
        print("既存のモックデータを削除しています...")
        try:
            session.query(OperationLog).delete()
            session.query(KPIScore).delete()
            session.query(TrainingSession).delete()
            session.query(TrainingMenuAssignment).delete()
            session.query(TrainingMenu).delete()
            session.query(CareerGoal).delete()
            session.query(SpecificSkillTransition).delete()
            session.query(IntegratedGrowth).delete()
            session.query(WorkerProgress).delete()
            session.query(JapaneseProficiency).delete()
            session.query(Worker).delete()
            session.query(User).filter(User.username.in_(['trainee1', 'trainee2', 'trainee3'])).delete()
            session.commit()
        except Exception as e:
            print(f"既存データの削除でエラー（無視します）: {e}")
            session.rollback()
        
        # ============================================
        # 1. ユーザーと就労者の作成
        # ============================================
        print("ユーザーと就労者を作成しています...")
        
        # 管理者ユーザー
        admin_user = User(
            username='admin',
            email='admin@example.com',
            role='administrator',
            is_active=True
        )
        admin_user.set_password('admin123')
        session.add(admin_user)
        session.flush()
        
        # 監査担当者ユーザー
        auditor_user = User(
            username='auditor',
            email='auditor@example.com',
            role='auditor',
            is_active=True
        )
        auditor_user.set_password('auditor123')
        session.add(auditor_user)
        session.flush()
        
        # 訓練生ユーザーと就労者（3名）
        trainees = []
        for i in range(1, 4):
            # 就労者を作成
            worker = Worker(
                name=f'訓練生{i}',
                name_kana=f'クンレンセイ{i}',
                email=f'trainee{i}@example.com',
                phone=f'090-1234-{5670+i}',
                address=f'東京都渋谷区{i}丁目',
                birth_date=date(1995, 1, 1) + timedelta(days=i*100),
                nationality=['ベトナム', 'フィリピン', 'インドネシア'][i-1],
                native_language=['ベトナム語', 'タガログ語', 'インドネシア語'][i-1],
                visa_status='特定技能',
                visa_expiry_date=date(2026, 12, 31),
                japanese_level=['N3', 'N4', 'N5'][i-1],
                english_level=['中級', '初級', '初級'][i-1],
                skills='建設機械操作,安全知識',
                experience_years=i,
                education='高等学校卒業',
                current_status='就労中'
            )
            session.add(worker)
            session.flush()
            
            # ユーザーを作成
            trainee_user = User(
                username=f'trainee{i}',
                email=f'trainee{i}@example.com',
                role='trainee',
                worker_id=worker.id,
                is_active=True
            )
            trainee_user.set_password(f'trainee{i}123')
            session.add(trainee_user)
            session.flush()
            
            trainees.append({'worker': worker, 'user': trainee_user})
        
        session.commit()
        print(f"✓ {len(trainees)}名の訓練生と{1}名の管理者、{1}名の監査担当者を作成しました。")
        
        # ============================================
        # 2. 訓練メニューの作成
        # ============================================
        print("訓練メニューを作成しています...")
        
        training_menus = []
        scenarios = [
            {
                'name': '初級：基本操作訓練',
                'scenario': '平らな土地での基本的な掘削作業',
                'equipment': '油圧ショベル',
                'difficulty': '初級',
                'targets': {
                    'safety_score': 70.0,
                    'error_count': 5,
                    'procedure_compliance': 75.0,
                    'work_time': 1800,
                    'achievement_rate': 70.0
                }
            },
            {
                'name': '中級：斜面作業訓練',
                'scenario': '傾斜地での安全な掘削作業',
                'equipment': '油圧ショベル',
                'difficulty': '中級',
                'targets': {
                    'safety_score': 85.0,
                    'error_count': 3,
                    'procedure_compliance': 85.0,
                    'work_time': 2400,
                    'achievement_rate': 80.0
                }
            },
            {
                'name': '上級：複合作業訓練',
                'scenario': '複数の重機を使用した連携作業',
                'equipment': 'ブルドーザー',
                'difficulty': '上級',
                'targets': {
                    'safety_score': 90.0,
                    'error_count': 2,
                    'procedure_compliance': 90.0,
                    'work_time': 3600,
                    'achievement_rate': 85.0
                }
            },
            {
                'name': '初級：土砂運搬作業',
                'scenario': '土砂の安全な運搬と積み込み',
                'equipment': 'ダンプトラック',
                'difficulty': '初級',
                'targets': {
                    'safety_score': 75.0,
                    'error_count': 4,
                    'procedure_compliance': 80.0,
                    'work_time': 1500,
                    'achievement_rate': 75.0
                }
            },
        ]
        
        for scenario in scenarios:
            menu = TrainingMenu(
                menu_name=scenario['name'],
                scenario_id=f"scenario_{scenario['difficulty']}_{len(training_menus)+1}",
                scenario_description=scenario['scenario'],
                target_safety_score=scenario['targets']['safety_score'],
                target_error_count=scenario['targets']['error_count'],
                target_procedure_compliance=scenario['targets']['procedure_compliance'],
                target_work_time=scenario['targets']['work_time'],
                target_achievement_rate=scenario['targets']['achievement_rate'],
                equipment_type=scenario['equipment'],
                difficulty_level=scenario['difficulty'],
                time_limit=scenario['targets']['work_time'] + 600,
                is_active=True,
                created_by='admin'
            )
            session.add(menu)
            session.flush()
            training_menus.append(menu)
        
        session.commit()
        print(f"✓ {len(training_menus)}個の訓練メニューを作成しました。")
        
        # ============================================
        # 3. 訓練メニューの割り当て
        # ============================================
        print("訓練メニューの割り当てを作成しています...")
        
        assignments = []
        for trainee in trainees:
            # 各訓練生に2-3個のメニューを割り当て
            assigned_menus = random.sample(training_menus, random.randint(2, 3))
            for menu in assigned_menus:
                assignment = TrainingMenuAssignment(
                    worker_id=trainee['worker'].id,
                    training_menu_id=menu.id,
                    assigned_date=date.today() - timedelta(days=random.randint(7, 30)),
                    deadline=date.today() + timedelta(days=random.randint(14, 30)),
                    status=random.choice(['未開始', '実施中', '完了']),
                    notes=f'{menu.menu_name}の割り当て'
                )
                session.add(assignment)
                assignments.append(assignment)
        
        session.commit()
        print(f"✓ {len(assignments)}件の訓練メニュー割り当てを作成しました。")
        
        # ============================================
        # 4. 訓練セッションとKPIスコアの作成
        # ============================================
        print("訓練セッションとKPIスコアを作成しています...")
        
        sessions_created = 0
        for trainee in trainees:
            # 各訓練生に対して5-10個のセッションを作成
            num_sessions = random.randint(5, 10)
            assigned_menus = [a for a in assignments if a.worker_id == trainee['worker'].id]
            
            for i in range(num_sessions):
                # 割り当てられたメニューから選択、またはNone
                menu = random.choice(assigned_menus).training_menu if assigned_menus else None
                
                # セッション開始・終了時刻
                start_time = datetime.now() - timedelta(days=random.randint(1, 60), hours=random.randint(0, 12))
                duration = random.randint(1200, 3600)  # 20分～1時間
                end_time = start_time + timedelta(seconds=duration)
                
                # 訓練セッションを作成
                session_obj = TrainingSession(
                    session_id=f"session_{trainee['worker'].id}_{i+1}_{int(start_time.timestamp())}",
                    worker_id=trainee['worker'].id,
                    training_menu_id=menu.id if menu else None,
                    session_start_time=start_time,
                    session_end_time=end_time,
                    duration_seconds=duration,
                    status='完了'
                )
                
                # 操作ログ（JSON形式）
                operation_logs = []
                for j in range(10, 30):
                    log_time = start_time + timedelta(seconds=j*60)
                    operation_logs.append({
                        'timestamp': log_time.isoformat(),
                        'action': random.choice(['掘削開始', '土砂運搬', '安全確認', '停止', '再開']),
                        'position': {'x': random.uniform(0, 100), 'y': random.uniform(0, 100), 'z': random.uniform(0, 50)},
                        'error': random.choice([None, '軽微なエラー', None, None])
                    })
                session_obj.operation_logs_json = json.dumps(operation_logs, ensure_ascii=False)
                
                # AI評価（JSON形式）
                ai_evaluation = {
                    'overall_comment': '良好な操作ができています。安全確認をより徹底してください。',
                    'strengths': ['正確な操作', '時間内の作業完了'],
                    'improvements': ['安全確認の頻度を上げる', 'エラー発生時の対応を改善'],
                    'score_breakdown': {
                        'safety': random.uniform(70, 95),
                        'accuracy': random.uniform(75, 95),
                        'efficiency': random.uniform(70, 90)
                    }
                }
                session_obj.ai_evaluation_json = json.dumps(ai_evaluation, ensure_ascii=False)
                
                # リプレイデータ（JSON形式）
                replay_data = {
                    'session_id': session_obj.session_id,
                    'duration': duration,
                    'operation_timeline': operation_logs[:10]  # 最初の10個のログ
                }
                session_obj.replay_data_json = json.dumps(replay_data, ensure_ascii=False)
                
                session.add(session_obj)
                session.flush()
                
                # KPIスコアを作成
                if menu:
                    # 目標値に基づいたスコア（目標値の80-110%の範囲）
                    kpi = KPIScore(
                        training_session_id=session_obj.id,
                        safety_score=random.uniform(menu.target_safety_score * 0.8, min(menu.target_safety_score * 1.1, 100)),
                        error_count=random.randint(0, menu.target_error_count + 2),
                        procedure_compliance_rate=random.uniform(menu.target_procedure_compliance * 0.85, min(menu.target_procedure_compliance * 1.1, 100)),
                        work_time_seconds=duration,
                        achievement_rate=random.uniform(menu.target_achievement_rate * 0.8, min(menu.target_achievement_rate * 1.1, 100)),
                        accuracy_score=random.uniform(75, 95),
                        efficiency_score=random.uniform(70, 90),
                        overall_score=random.uniform(75, 90),
                        notes='Unityシミュレーターからの自動記録'
                    )
                else:
                    # メニューがない場合のデフォルトスコア
                    kpi = KPIScore(
                        training_session_id=session_obj.id,
                        safety_score=random.uniform(70, 90),
                        error_count=random.randint(0, 5),
                        procedure_compliance_rate=random.uniform(75, 90),
                        work_time_seconds=duration,
                        achievement_rate=random.uniform(70, 85),
                        accuracy_score=random.uniform(75, 90),
                        efficiency_score=random.uniform(70, 85),
                        overall_score=random.uniform(75, 88),
                        notes='Unityシミュレーターからの自動記録'
                    )
                session.add(kpi)
                
                # 操作ログ（個別レコード）
                for log_data in operation_logs[:5]:  # 最初の5個のログを個別レコードとして保存
                    position = log_data.get('position', {})
                    log_record = OperationLog(
                        training_session_id=session_obj.id,
                        timestamp=datetime.fromisoformat(log_data['timestamp']),
                        operation_type=log_data['action'],
                        operation_value=random.uniform(0, 100),
                        equipment_state=json.dumps({'state': 'operating'}, ensure_ascii=False),
                        position_x=position.get('x', 0),
                        position_y=position.get('y', 0),
                        position_z=position.get('z', 0),
                        velocity=random.uniform(0, 10),
                        error_event=log_data.get('error') is not None,
                        error_description=log_data.get('error')
                    )
                    session.add(log_record)
                
                sessions_created += 1
        
        session.commit()
        print(f"✓ {sessions_created}個の訓練セッションとKPIスコアを作成しました。")
        
        # ============================================
        # 5. 日本語能力データの作成
        # ============================================
        print("日本語能力データを作成しています...")
        
        proficiencies = []
        for trainee in trainees:
            # 各訓練生に対して2-3個の日本語能力テスト記録を作成
            test_dates = [
                date.today() - timedelta(days=random.randint(30, 90)),
                date.today() - timedelta(days=random.randint(10, 30)),
            ]
            
            for test_date in test_dates:
                jlpt_levels = ['N5', 'N4', 'N3', 'N2']
                worker_level = trainee['worker'].japanese_level
                level_index = jlpt_levels.index(worker_level) if worker_level in jlpt_levels else 2
                
                # 段階的にレベルアップするようにスコアを設定
                base_level = max(0, level_index - 1) if test_date < date.today() - timedelta(days=20) else level_index
                
                proficiency = JapaneseProficiency(
                    worker_id=trainee['worker'].id,
                    test_date=test_date,
                    test_type=random.choice(['JLPT', 'JFT']),
                    level=jlpt_levels[min(base_level, len(jlpt_levels)-1)],
                    total_score=random.uniform(60, 95),
                    reading_score=random.uniform(60, 95),
                    listening_score=random.uniform(60, 95),
                    writing_score=random.uniform(60, 95) if random.random() > 0.5 else None,
                    speaking_score=random.uniform(60, 95) if random.random() > 0.5 else None,
                    passed=random.choice([True, True, True, False]),  # 75%の合格率
                    cefr_level=random.choice(['A1', 'A2', 'B1', 'B2']),
                    notes='定期テスト'
                )
                session.add(proficiency)
                proficiencies.append(proficiency)
        
        session.commit()
        print(f"✓ {len(proficiencies)}件の日本語能力データを作成しました。")
        
        # ============================================
        # 6. 進捗記録の作成
        # ============================================
        print("進捗記録を作成しています...")
        
        progress_records = []
        for trainee in trainees:
            # 各訓練生に対して3-5個の進捗記録を作成
            for i in range(random.randint(3, 5)):
                progress_date = date.today() - timedelta(days=random.randint(1, 60))
                progress = WorkerProgress(
                    worker_id=trainee['worker'].id,
                    progress_date=progress_date,
                    progress_type=random.choice(['面談', '研修', '定期フォロー', '就労支援']),
                    title=f'{progress_date.strftime("%Y年%m月")}の進捗記録',
                    description=f'訓練生{trainee["worker"].name}の進捗状況を記録しました。',
                    status=random.choice(['実施中', '完了', '完了']),
                    support_content='日本語能力向上のためのサポートを実施',
                    next_action='次回の面談を予定',
                    next_action_date=progress_date + timedelta(days=14),
                    support_staff='担当スタッフ'
                )
                session.add(progress)
                progress_records.append(progress)
        
        session.commit()
        print(f"✓ {len(progress_records)}件の進捗記録を作成しました。")
        
        # ============================================
        # 7. 統合成長データの作成
        # ============================================
        print("統合成長データを作成しています...")
        
        growth_records = []
        for trainee in trainees:
            # 各訓練生に対して2-3個の統合成長記録を作成
            for i in range(random.randint(2, 3)):
                assessment_date = date.today() - timedelta(days=random.randint(7, 60))
                
                # 最新の日本語能力テストからスコアを取得
                latest_proficiency = session.query(JapaneseProficiency).filter(
                    JapaneseProficiency.worker_id == trainee['worker'].id,
                    JapaneseProficiency.test_date <= assessment_date
                ).order_by(JapaneseProficiency.test_date.desc()).first()
                
                japanese_score = float(latest_proficiency.total_score) if latest_proficiency else random.uniform(60, 85)
                japanese_level = latest_proficiency.level if latest_proficiency else 'N4'
                
                # 最新のKPIスコアから技能スコアを取得
                latest_session = session.query(TrainingSession).filter(
                    TrainingSession.worker_id == trainee['worker'].id,
                    TrainingSession.session_start_time <= datetime.combine(assessment_date, datetime.min.time())
                ).order_by(TrainingSession.session_start_time.desc()).first()
                
                skill_score = None
                if latest_session and latest_session.kpi_scores:
                    kpi_scores_list = list(latest_session.kpi_scores)
                    if kpi_scores_list:
                        skill_score = kpi_scores_list[0].overall_score
                    else:
                        skill_score = random.uniform(70, 90)
                else:
                    skill_score = random.uniform(70, 90)
                
                growth = IntegratedGrowth(
                    worker_id=trainee['worker'].id,
                    assessment_date=assessment_date,
                    japanese_level=japanese_level,
                    japanese_score=japanese_score,
                    skill_level=random.choice(['初級', '中級', '上級']),
                    skill_score=skill_score,
                    simulator_score=random.uniform(75, 90),
                    overall_growth_score=random.uniform(75, 88),
                    growth_trend='上昇',
                    readiness_for_transition=random.choice(['準備中', '準備完了', '準備中']),
                    target_achievement_rate=random.uniform(70, 90),
                    next_milestone='次のレベルアップ目標',
                    notes='統合的な成長評価'
                )
                session.add(growth)
                growth_records.append(growth)
        
        session.commit()
        print(f"✓ {len(growth_records)}件の統合成長データを作成しました。")
        
        # ============================================
        # 8. 特定技能移行データの作成
        # ============================================
        print("特定技能移行データを作成しています...")
        
        transitions = []
        for trainee in trainees:
            # 各訓練生に対して1-2個の特定技能移行記録を作成
            for i in range(random.randint(1, 2)):
                transition = SpecificSkillTransition(
                    worker_id=trainee['worker'].id,
                    transition_type='特定技能1号',
                    target_transition_date=date.today() + timedelta(days=random.randint(90, 180)),
                    status=random.choice(['計画中', '準備中', '申請中']),
                    required_japanese_level='N4',
                    required_skill_level='中級',
                    current_japanese_level=trainee['worker'].japanese_level,
                    current_skill_level=random.choice(['初級', '中級']),
                    readiness_assessment='準備が進んでいます',
                    required_documents='在留資格変更申請書,技能証明書',
                    documents_submitted=random.choice([True, False]),
                    application_submitted=random.choice([False, False, True]),  # 33%の確率で申請済み
                    support_staff='担当スタッフ',
                    notes='特定技能への移行サポート'
                )
                session.add(transition)
                transitions.append(transition)
        
        session.commit()
        print(f"✓ {len(transitions)}件の特定技能移行データを作成しました。")
        
        # ============================================
        # 9. キャリア目標データの作成
        # ============================================
        print("キャリア目標データを作成しています...")
        
        goals = []
        goal_categories = ['日本語能力向上', '技能向上', '資格取得', '特定技能移行']
        
        for trainee in trainees:
            # 各訓練生に対して2-3個のキャリア目標を作成
            for i in range(random.randint(2, 3)):
                category = goal_categories[i % len(goal_categories)]
                goal = CareerGoal(
                    worker_id=trainee['worker'].id,
                    goal_name=f'{category}の達成',
                    goal_category=category,
                    description=f'{category}に関する具体的な目標を設定',
                    target_date=date.today() + timedelta(days=random.randint(60, 180)),
                    current_progress=random.randint(20, 80),
                    status=random.choice(['進行中', '進行中', '完了']),
                    success_criteria='目標スコアの達成',
                    support_resources='訓練メニュー、日本語レッスン',
                    notes='キャリア目標の進捗管理'
                )
                session.add(goal)
                goals.append(goal)
        
        session.commit()
        print(f"✓ {len(goals)}件のキャリア目標データを作成しました。")
        
        print("\n" + "="*60)
        print("モックデータの作成が完了しました！")
        print("="*60)
        print(f"\n作成されたデータ:")
        print(f"  - ユーザー: {len(trainees) + 2}名（訓練生{len(trainees)}名、管理者1名、監査担当者1名）")
        print(f"  - 就労者: {len(trainees)}名")
        print(f"  - 訓練メニュー: {len(training_menus)}個")
        print(f"  - 訓練メニュー割り当て: {len(assignments)}件")
        print(f"  - 訓練セッション: {sessions_created}個")
        print(f"  - 日本語能力データ: {len(proficiencies)}件")
        print(f"  - 進捗記録: {len(progress_records)}件")
        print(f"  - 統合成長データ: {len(growth_records)}件")
        print(f"  - 特定技能移行データ: {len(transitions)}件")
        print(f"  - キャリア目標: {len(goals)}件")
        print(f"\nログイン情報:")
        print(f"  - 管理者: username='admin', password='admin123'")
        print(f"  - 監査担当者: username='auditor', password='auditor123'")
        print(f"  - 訓練生1: username='trainee1', password='trainee1123'")
        print(f"  - 訓練生2: username='trainee2', password='trainee2123'")
        print(f"  - 訓練生3: username='trainee3', password='trainee3123'")
        
    except Exception as e:
        session.rollback()
        print(f"✗ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        session.close()

if __name__ == '__main__':
    create_mock_data()

