"""
求人情報管理モジュール
"""

from datetime import datetime
from .database import Database, JobPosting


class JobPostingManager:
    """求人情報管理クラス"""
    
    def __init__(self, db: Database):
        """
        初期化
        
        Args:
            db: データベースインスタンス
        """
        self.db = db
    
    def create_job_posting(self):
        """求人情報を登録"""
        print("\n求人情報登録")
        print("-" * 30)
        
        title = input("求人タイトル: ").strip()
        company_name = input("会社名: ").strip()
        description = input("求人詳細: ").strip()
        required_skills = input("必要スキル（カンマ区切り）: ").strip()
        location = input("勤務地: ").strip()
        salary_min = input("最低給与（万円）: ").strip()
        salary_max = input("最高給与（万円）: ").strip()
        employment_type = input("雇用形態: ").strip()
        
        session = self.db.get_session()
        try:
            job_posting = JobPosting(
                title=title,
                company_name=company_name,
                description=description,
                required_skills=required_skills,
                location=location,
                salary_min=int(salary_min) if salary_min else None,
                salary_max=int(salary_max) if salary_max else None,
                employment_type=employment_type
            )
            session.add(job_posting)
            session.commit()
            print(f"求人情報を登録しました（ID: {job_posting.id}）")
        except Exception as e:
            session.rollback()
            print(f"エラーが発生しました: {e}")
        finally:
            session.close()
    
    def list_job_postings(self):
        """求人情報一覧を表示"""
        print("\n求人情報一覧")
        print("-" * 80)
        
        session = self.db.get_session()
        try:
            job_postings = session.query(JobPosting).order_by(JobPosting.created_at.desc()).all()
            
            if not job_postings:
                print("求人情報がありません。")
                return
            
            for job in job_postings:
                print(f"ID: {job.id}")
                print(f"タイトル: {job.title}")
                print(f"会社名: {job.company_name}")
                print(f"勤務地: {job.location}")
                print(f"給与: {job.salary_min or '未設定'}万円 ～ {job.salary_max or '未設定'}万円")
                print(f"雇用形態: {job.employment_type}")
                print(f"登録日: {job.created_at.strftime('%Y-%m-%d %H:%M')}")
                print("-" * 80)
        finally:
            session.close()
    
    def search_job_postings(self):
        """求人情報を検索"""
        print("\n求人情報検索")
        print("-" * 30)
        
        keyword = input("検索キーワード（タイトル、会社名、勤務地）: ").strip()
        
        session = self.db.get_session()
        try:
            job_postings = session.query(JobPosting).filter(
                (JobPosting.title.contains(keyword)) |
                (JobPosting.company_name.contains(keyword)) |
                (JobPosting.location.contains(keyword))
            ).all()
            
            if not job_postings:
                print("該当する求人情報がありません。")
                return
            
            print(f"\n検索結果: {len(job_postings)}件")
            print("-" * 80)
            for job in job_postings:
                print(f"ID: {job.id} | {job.title} | {job.company_name} | {job.location}")
        finally:
            session.close()
    
    def update_job_posting(self):
        """求人情報を更新"""
        print("\n求人情報更新")
        print("-" * 30)
        
        job_id = input("更新する求人ID: ").strip()
        
        session = self.db.get_session()
        try:
            job = session.query(JobPosting).filter(JobPosting.id == int(job_id)).first()
            
            if not job:
                print("該当する求人情報がありません。")
                return
            
            print(f"\n現在の情報: {job.title} - {job.company_name}")
            
            title = input(f"求人タイトル（現在: {job.title}）: ").strip()
            if title:
                job.title = title
            
            company_name = input(f"会社名（現在: {job.company_name}）: ").strip()
            if company_name:
                job.company_name = company_name
            
            description = input(f"求人詳細（現在: {job.description or 'なし'}）: ").strip()
            if description:
                job.description = description
            
            session.commit()
            print("求人情報を更新しました。")
        except ValueError:
            print("無効なIDです。")
        except Exception as e:
            session.rollback()
            print(f"エラーが発生しました: {e}")
        finally:
            session.close()
    
    def delete_job_posting(self):
        """求人情報を削除"""
        print("\n求人情報削除")
        print("-" * 30)
        
        job_id = input("削除する求人ID: ").strip()
        
        session = self.db.get_session()
        try:
            job = session.query(JobPosting).filter(JobPosting.id == int(job_id)).first()
            
            if not job:
                print("該当する求人情報がありません。")
                return
            
            confirm = input(f"削除しますか？ ({job.title}) [y/N]: ").strip().lower()
            
            if confirm == 'y':
                session.delete(job)
                session.commit()
                print("求人情報を削除しました。")
            else:
                print("削除をキャンセルしました。")
        except ValueError:
            print("無効なIDです。")
        except Exception as e:
            session.rollback()
            print(f"エラーが発生しました: {e}")
        finally:
            session.close()

