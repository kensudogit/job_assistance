"""
スキル管理モジュール
"""

from datetime import datetime
from .database import Database, Skill


class SkillsManager:
    """スキル管理クラス"""
    
    def __init__(self, db: Database):
        """
        初期化
        
        Args:
            db: データベースインスタンス
        """
        self.db = db
    
    def create_skill(self):
        """スキルを登録"""
        print("\nスキル登録")
        print("-" * 30)
        
        name = input("スキル名: ").strip()
        category = input("カテゴリ（プログラミング、言語、その他など）: ").strip()
        description = input("説明: ").strip()
        
        session = self.db.get_session()
        try:
            # 既存のスキルをチェック
            existing = session.query(Skill).filter(Skill.name == name).first()
            if existing:
                print(f"スキル '{name}' は既に登録されています。")
                return
            
            skill = Skill(
                name=name,
                category=category,
                description=description
            )
            session.add(skill)
            session.commit()
            print(f"スキルを登録しました（ID: {skill.id}）")
        except Exception as e:
            session.rollback()
            print(f"エラーが発生しました: {e}")
        finally:
            session.close()
    
    def list_skills(self):
        """スキル一覧を表示"""
        print("\nスキル一覧")
        print("-" * 80)
        
        session = self.db.get_session()
        try:
            skills = session.query(Skill).order_by(Skill.category, Skill.name).all()
            
            if not skills:
                print("スキルが登録されていません。")
                return
            
            current_category = None
            for skill in skills:
                if current_category != skill.category:
                    if current_category is not None:
                        print()
                    print(f"[{skill.category or 'その他'}]")
                    current_category = skill.category
                
                print(f"  ID: {skill.id} | {skill.name}")
                if skill.description:
                    print(f"    説明: {skill.description}")
                print("-" * 80)
        finally:
            session.close()
    
    def search_skills(self):
        """スキルを検索"""
        print("\nスキル検索")
        print("-" * 30)
        
        keyword = input("検索キーワード（スキル名、カテゴリ、説明）: ").strip()
        
        session = self.db.get_session()
        try:
            skills = session.query(Skill).filter(
                (Skill.name.contains(keyword)) |
                (Skill.category.contains(keyword)) |
                (Skill.description.contains(keyword))
            ).all()
            
            if not skills:
                print("該当するスキルがありません。")
                return
            
            print(f"\n検索結果: {len(skills)}件")
            print("-" * 80)
            for skill in skills:
                print(f"ID: {skill.id} | {skill.name} | カテゴリ: {skill.category}")
                if skill.description:
                    print(f"  説明: {skill.description}")
                print("-" * 80)
        finally:
            session.close()
    
    def update_skill(self):
        """スキル情報を更新"""
        print("\nスキル情報更新")
        print("-" * 30)
        
        skill_id = input("更新するスキルID: ").strip()
        
        session = self.db.get_session()
        try:
            skill = session.query(Skill).filter(Skill.id == int(skill_id)).first()
            
            if not skill:
                print("該当するスキルがありません。")
                return
            
            print(f"\n現在の情報: {skill.name}")
            
            name = input(f"スキル名（現在: {skill.name}）: ").strip()
            if name and name != skill.name:
                # 重複チェック
                existing = session.query(Skill).filter(Skill.name == name).first()
                if existing:
                    print(f"スキル '{name}' は既に登録されています。")
                    return
                skill.name = name
            
            category = input(f"カテゴリ（現在: {skill.category or 'なし'}）: ").strip()
            if category:
                skill.category = category
            
            description = input(f"説明（現在: {skill.description or 'なし'}）: ").strip()
            if description:
                skill.description = description
            
            session.commit()
            print("スキル情報を更新しました。")
        
        except ValueError:
            print("無効なIDです。")
        except Exception as e:
            session.rollback()
            print(f"エラーが発生しました: {e}")
        finally:
            session.close()
    
    def delete_skill(self):
        """スキルを削除"""
        print("\nスキル削除")
        print("-" * 30)
        
        skill_id = input("削除するスキルID: ").strip()
        
        session = self.db.get_session()
        try:
            skill = session.query(Skill).filter(Skill.id == int(skill_id)).first()
            
            if not skill:
                print("該当するスキルがありません。")
                return
            
            confirm = input(f"削除しますか？ ({skill.name}) [y/N]: ").strip().lower()
            
            if confirm == 'y':
                session.delete(skill)
                session.commit()
                print("スキルを削除しました。")
            else:
                print("削除をキャンセルしました。")
        
        except ValueError:
            print("無効なIDです。")
        except Exception as e:
            session.rollback()
            print(f"エラーが発生しました: {e}")
        finally:
            session.close()

