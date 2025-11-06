"""
応募者管理モジュール
"""

from datetime import datetime
from .database import Database, Applicant, Application, JobPosting


class ApplicationManager:
    """応募者管理クラス"""
    
    def __init__(self, db: Database):
        """
        初期化
        
        Args:
            db: データベースインスタンス
        """
        self.db = db
    
    def create_application(self):
        """応募者を登録"""
        print("\n応募者登録")
        print("-" * 30)
        
        name = input("氏名: ").strip()
        email = input("メールアドレス: ").strip()
        phone = input("電話番号: ").strip()
        address = input("住所: ").strip()
        skills = input("スキル（カンマ区切り）: ").strip()
        experience_years = input("経験年数: ").strip()
        education = input("学歴: ").strip()
        
        session = self.db.get_session()
        try:
            applicant = Applicant(
                name=name,
                email=email,
                phone=phone,
                address=address,
                skills=skills,
                experience_years=int(experience_years) if experience_years else 0,
                education=education
            )
            session.add(applicant)
            session.commit()
            print(f"応募者を登録しました（ID: {applicant.id}）")
            
            # 応募情報も登録するか確認
            apply_job = input("求人に応募しますか？ [y/N]: ").strip().lower()
            if apply_job == 'y':
                self._apply_to_job(session, applicant.id)
        except Exception as e:
            session.rollback()
            print(f"エラーが発生しました: {e}")
        finally:
            session.close()
    
    def _apply_to_job(self, session, applicant_id: int):
        """求人に応募"""
        print("\n応募する求人を選択してください")
        job_postings = session.query(JobPosting).all()
        
        if not job_postings:
            print("求人情報がありません。")
            return
        
        for job in job_postings:
            print(f"ID: {job.id} | {job.title} | {job.company_name}")
        
        job_id = input("\n求人ID: ").strip()
        
        try:
            job = session.query(JobPosting).filter(JobPosting.id == int(job_id)).first()
            if not job:
                print("該当する求人情報がありません。")
                return
            
            cover_letter = input("カバーレター: ").strip()
            
            application = Application(
                applicant_id=applicant_id,
                job_posting_id=int(job_id),
                cover_letter=cover_letter,
                status='応募中'
            )
            session.add(application)
            session.commit()
            print(f"応募しました（応募ID: {application.id}）")
        except ValueError:
            print("無効なIDです。")
        except Exception as e:
            print(f"エラーが発生しました: {e}")
    
    def list_applications(self):
        """応募者一覧を表示"""
        print("\n応募者一覧")
        print("-" * 80)
        
        session = self.db.get_session()
        try:
            applicants = session.query(Applicant).order_by(Applicant.created_at.desc()).all()
            
            if not applicants:
                print("応募者がいません。")
                return
            
            for applicant in applicants:
                print(f"ID: {applicant.id}")
                print(f"氏名: {applicant.name}")
                print(f"メール: {applicant.email}")
                print(f"電話: {applicant.phone}")
                print(f"スキル: {applicant.skills}")
                print(f"経験年数: {applicant.experience_years}年")
                print(f"登録日: {applicant.created_at.strftime('%Y-%m-%d %H:%M')}")
                
                # 応募情報も表示
                applications = session.query(Application).filter(
                    Application.applicant_id == applicant.id
                ).all()
                if applications:
                    print("応募中:")
                    for app in applications:
                        job = session.query(JobPosting).filter(JobPosting.id == app.job_posting_id).first()
                        print(f"  - {job.title if job else '不明'} (ステータス: {app.status})")
                
                print("-" * 80)
        finally:
            session.close()
    
    def search_applications(self):
        """応募者を検索"""
        print("\n応募者検索")
        print("-" * 30)
        
        keyword = input("検索キーワード（氏名、メール、スキル）: ").strip()
        
        session = self.db.get_session()
        try:
            applicants = session.query(Applicant).filter(
                (Applicant.name.contains(keyword)) |
                (Applicant.email.contains(keyword)) |
                (Applicant.skills.contains(keyword))
            ).all()
            
            if not applicants:
                print("該当する応募者がいません。")
                return
            
            print(f"\n検索結果: {len(applicants)}件")
            print("-" * 80)
            for applicant in applicants:
                print(f"ID: {applicant.id} | {applicant.name} | {applicant.email} | スキル: {applicant.skills}")
        finally:
            session.close()
    
    def update_application(self):
        """応募者情報を更新"""
        print("\n応募者情報更新")
        print("-" * 30)
        
        applicant_id = input("更新する応募者ID: ").strip()
        
        session = self.db.get_session()
        try:
            applicant = session.query(Applicant).filter(Applicant.id == int(applicant_id)).first()
            
            if not applicant:
                print("該当する応募者がいません。")
                return
            
            print(f"\n現在の情報: {applicant.name}")
            
            name = input(f"氏名（現在: {applicant.name}）: ").strip()
            if name:
                applicant.name = name
            
            email = input(f"メールアドレス（現在: {applicant.email}）: ").strip()
            if email:
                applicant.email = email
            
            skills = input(f"スキル（現在: {applicant.skills or 'なし'}）: ").strip()
            if skills:
                applicant.skills = skills
            
            session.commit()
            print("応募者情報を更新しました。")
        except ValueError:
            print("無効なIDです。")
        except Exception as e:
            session.rollback()
            print(f"エラーが発生しました: {e}")
        finally:
            session.close()
    
    def delete_application(self):
        """応募者を削除"""
        print("\n応募者削除")
        print("-" * 30)
        
        applicant_id = input("削除する応募者ID: ").strip()
        
        session = self.db.get_session()
        try:
            applicant = session.query(Applicant).filter(Applicant.id == int(applicant_id)).first()
            
            if not applicant:
                print("該当する応募者がいません。")
                return
            
            confirm = input(f"削除しますか？ ({applicant.name}) [y/N]: ").strip().lower()
            
            if confirm == 'y':
                session.delete(applicant)
                session.commit()
                print("応募者を削除しました。")
            else:
                print("削除をキャンセルしました。")
        except ValueError:
            print("無効なIDです。")
        except Exception as e:
            session.rollback()
            print(f"エラーが発生しました: {e}")
        finally:
            session.close()

