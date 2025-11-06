"""
就労支援システムのメインエントリーポイント
"""

from . import job_posting
from . import application
from . import matching
from . import interview
from . import skills
from . import database


def main():
    """
    アプリケーションのメインエントリーポイント
    就労支援システムを開始する
    """
    print("=" * 50)
    print("就労支援システム")
    print("=" * 50)
    print()
    
    # データベース初期化
    db = database.Database()
    db.init_database()
    
    while True:
        print("\nメニュー:")
        print("1. 求人情報管理")
        print("2. 応募者管理")
        print("3. マッチング")
        print("4. 面接スケジュール管理")
        print("5. スキル管理")
        print("0. 終了")
        
        choice = input("\n選択してください (0-5): ").strip()
        
        if choice == "0":
            print("終了します。")
            break
        elif choice == "1":
            job_posting_menu(db)
        elif choice == "2":
            application_menu(db)
        elif choice == "3":
            matching_menu(db)
        elif choice == "4":
            interview_menu(db)
        elif choice == "5":
            skills_menu(db)
        else:
            print("無効な選択です。再度選択してください。")


def job_posting_menu(db):
    """求人情報管理メニュー"""
    manager = job_posting.JobPostingManager(db)
    
    while True:
        print("\n求人情報管理:")
        print("1. 求人情報登録")
        print("2. 求人情報一覧")
        print("3. 求人情報検索")
        print("4. 求人情報更新")
        print("5. 求人情報削除")
        print("0. 戻る")
        
        choice = input("\n選択してください (0-5): ").strip()
        
        if choice == "0":
            break
        elif choice == "1":
            manager.create_job_posting()
        elif choice == "2":
            manager.list_job_postings()
        elif choice == "3":
            manager.search_job_postings()
        elif choice == "4":
            manager.update_job_posting()
        elif choice == "5":
            manager.delete_job_posting()


def application_menu(db):
    """応募者管理メニュー"""
    manager = application.ApplicationManager(db)
    
    while True:
        print("\n応募者管理:")
        print("1. 応募者登録")
        print("2. 応募者一覧")
        print("3. 応募者検索")
        print("4. 応募者情報更新")
        print("5. 応募者削除")
        print("0. 戻る")
        
        choice = input("\n選択してください (0-5): ").strip()
        
        if choice == "0":
            break
        elif choice == "1":
            manager.create_application()
        elif choice == "2":
            manager.list_applications()
        elif choice == "3":
            manager.search_applications()
        elif choice == "4":
            manager.update_application()
        elif choice == "5":
            manager.delete_application()


def matching_menu(db):
    """マッチングメニュー"""
    matcher = matching.MatchingService(db)
    
    while True:
        print("\nマッチング:")
        print("1. 応募者と求人のマッチング")
        print("2. 求人に対する応募者候補")
        print("3. 応募者に対する求人候補")
        print("0. 戻る")
        
        choice = input("\n選択してください (0-3): ").strip()
        
        if choice == "0":
            break
        elif choice == "1":
            matcher.match_all()
        elif choice == "2":
            matcher.find_candidates_for_job()
        elif choice == "3":
            matcher.find_jobs_for_applicant()


def interview_menu(db):
    """面接スケジュール管理メニュー"""
    manager = interview.InterviewManager(db)
    
    while True:
        print("\n面接スケジュール管理:")
        print("1. 面接スケジュール登録")
        print("2. 面接スケジュール一覧")
        print("3. 面接スケジュール検索")
        print("4. 面接スケジュール更新")
        print("5. 面接スケジュール削除")
        print("0. 戻る")
        
        choice = input("\n選択してください (0-5): ").strip()
        
        if choice == "0":
            break
        elif choice == "1":
            manager.create_interview()
        elif choice == "2":
            manager.list_interviews()
        elif choice == "3":
            manager.search_interviews()
        elif choice == "4":
            manager.update_interview()
        elif choice == "5":
            manager.delete_interview()


def skills_menu(db):
    """スキル管理メニュー"""
    manager = skills.SkillsManager(db)
    
    while True:
        print("\nスキル管理:")
        print("1. スキル登録")
        print("2. スキル一覧")
        print("3. スキル検索")
        print("4. スキル更新")
        print("5. スキル削除")
        print("0. 戻る")
        
        choice = input("\n選択してください (0-5): ").strip()
        
        if choice == "0":
            break
        elif choice == "1":
            manager.create_skill()
        elif choice == "2":
            manager.list_skills()
        elif choice == "3":
            manager.search_skills()
        elif choice == "4":
            manager.update_skill()
        elif choice == "5":
            manager.delete_skill()


if __name__ == '__main__':
    main()

