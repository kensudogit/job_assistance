"""
マッチング機能モジュール
"""

from .database import Database, Applicant, JobPosting, Matching, Application


class MatchingService:
    """マッチングサービスクラス"""
    
    def __init__(self, db: Database):
        """
        初期化
        
        Args:
            db: データベースインスタンス
        """
        self.db = db
    
    def _calculate_match_score(self, applicant_skills: str, job_skills: str) -> float:
        """
        マッチングスコアを計算
        
        Args:
            applicant_skills: 応募者のスキル（カンマ区切り）
            job_skills: 求人の必要スキル（カンマ区切り）
        
        Returns:
            マッチングスコア (0-100)
        """
        if not applicant_skills or not job_skills:
            return 0.0
        
        applicant_skill_list = [s.strip().lower() for s in applicant_skills.split(',') if s.strip()]
        job_skill_list = [s.strip().lower() for s in job_skills.split(',') if s.strip()]
        
        if not applicant_skill_list or not job_skill_list:
            return 0.0
        
        # マッチしたスキル数を計算
        matched_skills = set(applicant_skill_list) & set(job_skill_list)
        
        # スコア計算: (マッチしたスキル数 / 必要スキル数) * 100
        match_score = (len(matched_skills) / len(job_skill_list)) * 100
        
        return min(match_score, 100.0)
    
    def match_all(self):
        """全応募者と全求人をマッチング"""
        print("\n全マッチング実行")
        print("-" * 30)
        
        session = self.db.get_session()
        try:
            applicants = session.query(Applicant).all()
            job_postings = session.query(JobPosting).all()
            
            if not applicants or not job_postings:
                print("応募者または求人情報が不足しています。")
                return
            
            matches = []
            for applicant in applicants:
                for job in job_postings:
                    score = self._calculate_match_score(applicant.skills or '', job.required_skills or '')
                    
                    if score > 0:
                        matched_skills = set((applicant.skills or '').split(',')) & set((job.required_skills or '').split(','))
                        matched_skills_str = ', '.join([s.strip() for s in matched_skills if s.strip()])
                        
                        matches.append({
                            'applicant': applicant,
                            'job': job,
                            'score': score,
                            'matched_skills': matched_skills_str
                        })
            
            # スコア順にソート
            matches.sort(key=lambda x: x['score'], reverse=True)
            
            print(f"\nマッチング結果: {len(matches)}件")
            print("=" * 80)
            for match in matches[:20]:  # 上位20件を表示
                print(f"応募者: {match['applicant'].name} (ID: {match['applicant'].id})")
                print(f"求人: {match['job'].title} (ID: {match['job'].id})")
                print(f"マッチングスコア: {match['score']:.1f}%")
                print(f"マッチしたスキル: {match['matched_skills']}")
                print("-" * 80)
            
            # マッチング結果をデータベースに保存するか確認
            save = input("\nマッチング結果をデータベースに保存しますか？ [y/N]: ").strip().lower()
            if save == 'y':
                self._save_matches(session, matches)
        
        except Exception as e:
            print(f"エラーが発生しました: {e}")
        finally:
            session.close()
    
    def _save_matches(self, session, matches):
        """マッチング結果をデータベースに保存"""
        try:
            for match in matches:
                existing = session.query(Matching).filter(
                    Matching.applicant_id == match['applicant'].id,
                    Matching.job_posting_id == match['job'].id
                ).first()
                
                if existing:
                    existing.match_score = match['score']
                    existing.matched_skills = match['matched_skills']
                else:
                    new_match = Matching(
                        applicant_id=match['applicant'].id,
                        job_posting_id=match['job'].id,
                        match_score=match['score'],
                        matched_skills=match['matched_skills']
                    )
                    session.add(new_match)
            
            session.commit()
            print("マッチング結果を保存しました。")
        except Exception as e:
            session.rollback()
            print(f"保存エラーが発生しました: {e}")
    
    def find_candidates_for_job(self):
        """求人に対する応募者候補を検索"""
        print("\n求人に対する応募者候補検索")
        print("-" * 30)
        
        job_id = input("求人ID: ").strip()
        
        session = self.db.get_session()
        try:
            job = session.query(JobPosting).filter(JobPosting.id == int(job_id)).first()
            
            if not job:
                print("該当する求人情報がありません。")
                return
            
            print(f"\n求人: {job.title} - {job.company_name}")
            print(f"必要スキル: {job.required_skills}")
            print("\n候補者:")
            print("=" * 80)
            
            applicants = session.query(Applicant).all()
            candidates = []
            
            for applicant in applicants:
                score = self._calculate_match_score(applicant.skills or '', job.required_skills or '')
                if score > 0:
                    matched_skills = set((applicant.skills or '').split(',')) & set((job.required_skills or '').split(','))
                    matched_skills_str = ', '.join([s.strip() for s in matched_skills if s.strip()])
                    
                    candidates.append({
                        'applicant': applicant,
                        'score': score,
                        'matched_skills': matched_skills_str
                    })
            
            # スコア順にソート
            candidates.sort(key=lambda x: x['score'], reverse=True)
            
            for candidate in candidates:
                print(f"応募者ID: {candidate['applicant'].id} | {candidate['applicant'].name}")
                print(f"スコア: {candidate['score']:.1f}%")
                print(f"マッチしたスキル: {candidate['matched_skills']}")
                print(f"スキル: {candidate['applicant'].skills}")
                print("-" * 80)
            
            if not candidates:
                print("該当する候補者がいません。")
        
        except ValueError:
            print("無効なIDです。")
        except Exception as e:
            print(f"エラーが発生しました: {e}")
        finally:
            session.close()
    
    def find_jobs_for_applicant(self):
        """応募者に対する求人候補を検索"""
        print("\n応募者に対する求人候補検索")
        print("-" * 30)
        
        applicant_id = input("応募者ID: ").strip()
        
        session = self.db.get_session()
        try:
            applicant = session.query(Applicant).filter(Applicant.id == int(applicant_id)).first()
            
            if not applicant:
                print("該当する応募者がいません。")
                return
            
            print(f"\n応募者: {applicant.name}")
            print(f"スキル: {applicant.skills}")
            print("\n候補求人:")
            print("=" * 80)
            
            jobs = session.query(JobPosting).all()
            job_candidates = []
            
            for job in jobs:
                score = self._calculate_match_score(applicant.skills or '', job.required_skills or '')
                if score > 0:
                    matched_skills = set((applicant.skills or '').split(',')) & set((job.required_skills or '').split(','))
                    matched_skills_str = ', '.join([s.strip() for s in matched_skills if s.strip()])
                    
                    job_candidates.append({
                        'job': job,
                        'score': score,
                        'matched_skills': matched_skills_str
                    })
            
            # スコア順にソート
            job_candidates.sort(key=lambda x: x['score'], reverse=True)
            
            for candidate in job_candidates:
                print(f"求人ID: {candidate['job'].id} | {candidate['job'].title} - {candidate['job'].company_name}")
                print(f"スコア: {candidate['score']:.1f}%")
                print(f"マッチしたスキル: {candidate['matched_skills']}")
                print(f"必要スキル: {candidate['job'].required_skills}")
                print(f"勤務地: {candidate['job'].location}")
                print("-" * 80)
            
            if not job_candidates:
                print("該当する求人がありません。")
        
        except ValueError:
            print("無効なIDです。")
        except Exception as e:
            print(f"エラーが発生しました: {e}")
        finally:
            session.close()

