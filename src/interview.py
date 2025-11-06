"""
面接スケジュール管理モジュール
"""

from datetime import datetime
from .database import Database, Interview, Applicant, JobPosting


class InterviewManager:
    """面接スケジュール管理クラス"""
    
    def __init__(self, db: Database):
        """
        初期化
        
        Args:
            db: データベースインスタンス
        """
        self.db = db
    
    def create_interview(self):
        """面接スケジュールを登録"""
        print("\n面接スケジュール登録")
        print("-" * 30)
        
        # 応募者選択
        session = self.db.get_session()
        try:
            applicants = session.query(Applicant).all()
            if not applicants:
                print("応募者がいません。")
                return
            
            print("応募者一覧:")
            for applicant in applicants:
                print(f"ID: {applicant.id} | {applicant.name}")
            
            applicant_id = input("\n応募者ID: ").strip()
            applicant = session.query(Applicant).filter(Applicant.id == int(applicant_id)).first()
            
            if not applicant:
                print("該当する応募者がいません。")
                return
            
            # 求人選択
            jobs = session.query(JobPosting).all()
            if not jobs:
                print("求人情報がありません。")
                return
            
            print("\n求人一覧:")
            for job in jobs:
                print(f"ID: {job.id} | {job.title} - {job.company_name}")
            
            job_id = input("\n求人ID: ").strip()
            job = session.query(JobPosting).filter(JobPosting.id == int(job_id)).first()
            
            if not job:
                print("該当する求人情報がありません。")
                return
            
            # 面接情報入力
            date_str = input("面接日時 (YYYY-MM-DD HH:MM): ").strip()
            interview_date = datetime.strptime(date_str, '%Y-%m-%d %H:%M')
            
            interview_type = input("面接種別（一次面接、二次面接、最終面接など）: ").strip()
            location = input("面接場所: ").strip()
            interviewer = input("面接官: ").strip()
            notes = input("備考: ").strip()
            
            interview = Interview(
                applicant_id=int(applicant_id),
                job_posting_id=int(job_id),
                interview_date=interview_date,
                interview_type=interview_type,
                location=location,
                interviewer=interviewer,
                notes=notes
            )
            session.add(interview)
            session.commit()
            print(f"面接スケジュールを登録しました（ID: {interview.id}）")
        
        except ValueError as e:
            print(f"入力形式が正しくありません: {e}")
        except Exception as e:
            session.rollback()
            print(f"エラーが発生しました: {e}")
        finally:
            session.close()
    
    def list_interviews(self):
        """面接スケジュール一覧を表示"""
        print("\n面接スケジュール一覧")
        print("-" * 80)
        
        session = self.db.get_session()
        try:
            interviews = session.query(Interview).order_by(Interview.interview_date).all()
            
            if not interviews:
                print("面接スケジュールがありません。")
                return
            
            for interview in interviews:
                applicant = session.query(Applicant).filter(Applicant.id == interview.applicant_id).first()
                job = session.query(JobPosting).filter(JobPosting.id == interview.job_posting_id).first()
                
                print(f"ID: {interview.id}")
                print(f"応募者: {applicant.name if applicant else '不明'} (ID: {interview.applicant_id})")
                print(f"求人: {job.title if job else '不明'} - {job.company_name if job else '不明'}")
                print(f"面接日時: {interview.interview_date.strftime('%Y-%m-%d %H:%M')}")
                print(f"面接種別: {interview.interview_type}")
                print(f"場所: {interview.location}")
                print(f"面接官: {interview.interviewer}")
                print(f"結果: {interview.result or '未確定'}")
                if interview.notes:
                    print(f"備考: {interview.notes}")
                print("-" * 80)
        finally:
            session.close()
    
    def search_interviews(self):
        """面接スケジュールを検索"""
        print("\n面接スケジュール検索")
        print("-" * 30)
        
        print("検索条件:")
        print("1. 応募者名")
        print("2. 求人タイトル")
        print("3. 面接日時範囲")
        
        choice = input("選択してください (1-3): ").strip()
        
        session = self.db.get_session()
        try:
            if choice == "1":
                keyword = input("応募者名: ").strip()
                applicants = session.query(Applicant).filter(Applicant.name.contains(keyword)).all()
                applicant_ids = [a.id for a in applicants]
                interviews = session.query(Interview).filter(Interview.applicant_id.in_(applicant_ids)).all()
            
            elif choice == "2":
                keyword = input("求人タイトル: ").strip()
                jobs = session.query(JobPosting).filter(JobPosting.title.contains(keyword)).all()
                job_ids = [j.id for j in jobs]
                interviews = session.query(Interview).filter(Interview.job_posting_id.in_(job_ids)).all()
            
            elif choice == "3":
                start_date_str = input("開始日時 (YYYY-MM-DD HH:MM): ").strip()
                end_date_str = input("終了日時 (YYYY-MM-DD HH:MM): ").strip()
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d %H:%M')
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d %H:%M')
                interviews = session.query(Interview).filter(
                    Interview.interview_date >= start_date,
                    Interview.interview_date <= end_date
                ).all()
            
            else:
                print("無効な選択です。")
                return
            
            if not interviews:
                print("該当する面接スケジュールがありません。")
                return
            
            print(f"\n検索結果: {len(interviews)}件")
            print("-" * 80)
            for interview in interviews:
                applicant = session.query(Applicant).filter(Applicant.id == interview.applicant_id).first()
                job = session.query(JobPosting).filter(JobPosting.id == interview.job_posting_id).first()
                print(f"ID: {interview.id} | {applicant.name if applicant else '不明'} | {job.title if job else '不明'} | {interview.interview_date.strftime('%Y-%m-%d %H:%M')}")
        
        except ValueError as e:
            print(f"入力形式が正しくありません: {e}")
        except Exception as e:
            print(f"エラーが発生しました: {e}")
        finally:
            session.close()
    
    def update_interview(self):
        """面接スケジュールを更新"""
        print("\n面接スケジュール更新")
        print("-" * 30)
        
        interview_id = input("更新する面接ID: ").strip()
        
        session = self.db.get_session()
        try:
            interview = session.query(Interview).filter(Interview.id == int(interview_id)).first()
            
            if not interview:
                print("該当する面接スケジュールがありません。")
                return
            
            print(f"\n現在の情報:")
            print(f"面接日時: {interview.interview_date.strftime('%Y-%m-%d %H:%M')}")
            print(f"結果: {interview.result or '未確定'}")
            
            date_str = input(f"面接日時（現在: {interview.interview_date.strftime('%Y-%m-%d %H:%M')}）: ").strip()
            if date_str:
                interview.interview_date = datetime.strptime(date_str, '%Y-%m-%d %H:%M')
            
            result = input(f"結果（現在: {interview.result or '未確定'}）: ").strip()
            if result:
                interview.result = result
            
            notes = input(f"備考（現在: {interview.notes or 'なし'}）: ").strip()
            if notes:
                interview.notes = notes
            
            session.commit()
            print("面接スケジュールを更新しました。")
        
        except ValueError:
            print("無効なIDまたは日時形式です。")
        except Exception as e:
            session.rollback()
            print(f"エラーが発生しました: {e}")
        finally:
            session.close()
    
    def delete_interview(self):
        """面接スケジュールを削除"""
        print("\n面接スケジュール削除")
        print("-" * 30)
        
        interview_id = input("削除する面接ID: ").strip()
        
        session = self.db.get_session()
        try:
            interview = session.query(Interview).filter(Interview.id == int(interview_id)).first()
            
            if not interview:
                print("該当する面接スケジュールがありません。")
                return
            
            applicant = session.query(Applicant).filter(Applicant.id == interview.applicant_id).first()
            confirm = input(f"削除しますか？ (面接ID: {interview.id}) [y/N]: ").strip().lower()
            
            if confirm == 'y':
                session.delete(interview)
                session.commit()
                print("面接スケジュールを削除しました。")
            else:
                print("削除をキャンセルしました。")
        
        except ValueError:
            print("無効なIDです。")
        except Exception as e:
            session.rollback()
            print(f"エラーが発生しました: {e}")
        finally:
            session.close()

