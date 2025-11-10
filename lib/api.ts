/**
 * APIクライアント
 * バックエンドAPIとの通信を管理するAxiosベースのクライアント
 */
import axios from 'axios';

// APIベースURL（環境変数から取得、デフォルトはlocalhost:5000）
// 本番環境では環境変数VITE_API_BASE_URLを設定する必要があります
// Vercelデプロイ時は、バックエンドAPIのURLを環境変数で設定してください
// バックエンドがない場合、相対パス（空文字列）を使用してVercelのAPI Routesを使用
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:5000');  // 本番環境では空文字列（相対パス）を使用

// 本番環境でAPI_BASE_URLが空の場合、相対パスを使用（同じドメインのAPIを想定）
// VercelのAPI Routes（api/ディレクトリ）を使用する場合は、相対パスで動作します

// デバッグ用: APIベースURLをコンソールに出力
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL || '(相対パス)');
}

// Axiosインスタンスの作成（共通設定）
export const api = axios.create({
  baseURL: API_BASE_URL,  // ベースURL
  headers: {
    'Content-Type': 'application/json',  // JSON形式でリクエスト
  },
});

// エラーレスポンスのインターセプター
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // エラーレスポンスを処理
    if (error.response) {
      // サーバーからのエラーレスポンス
      const errorData = error.response.data;
      let errorMessage = 'An error occurred';
      
      // エラーメッセージを抽出（複数の形式に対応）
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('API Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: errorData,
        message: errorMessage,
      });
      
      // エラーオブジェクトを適切に処理（React error #31を防ぐ）
      // Errorオブジェクトを作成し、メッセージを設定
      const apiError = new Error(errorMessage);
      // 元のエラー情報を保持（必要に応じて）
      (apiError as any).response = error.response;
      (apiError as any).status = error.response.status;
      (apiError as any).data = errorData;
      
      return Promise.reject(apiError);
    } else if (error.request) {
      // リクエストは送信されたが、レスポンスが受信されなかった
      console.error('Network Error:', error.request);
      const networkError = new Error('Network error. Please check your connection.');
      (networkError as any).request = error.request;
      return Promise.reject(networkError);
    } else {
      // リクエストの設定中にエラーが発生
      console.error('Request Error:', error.message);
      // エラーが既にErrorオブジェクトの場合はそのまま返す
      if (error instanceof Error) {
        return Promise.reject(error);
      }
      // エラーがオブジェクト形式（{code, message}など）の場合はErrorオブジェクトに変換
      const requestError = new Error(error.message || 'Request configuration error');
      if (error.code) {
        (requestError as any).code = error.code;
      }
      return Promise.reject(requestError);
    }
  }
);

export interface Worker {
  id?: number;
  name: string;
  name_kana?: string;
  email: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  nationality?: string;
  native_language?: string;
  visa_status?: string;
  visa_expiry_date?: string;
  japanese_level?: string;
  english_level?: string;
  skills?: string;
  experience_years?: number;
  education?: string;
  current_status?: string;
  notes?: string;
}

export interface WorkerProgress {
  id?: number;
  worker_id: number;
  progress_date: string;
  progress_type: string;
  title?: string;
  description?: string;
  status?: string;
  support_content?: string;
  next_action?: string;
  next_action_date?: string;
  support_staff?: string;
}

/**
 * APIレスポンスの共通インターフェース
 * すべてのAPIレスポンスはこの形式に従う
 */
export interface ApiResponse<T> {
  success: boolean;  // リクエストが成功したかどうか
  data?: T;          // レスポンスデータ（成功時）
  error?: string;    // エラーメッセージ（失敗時）
}

/**
 * 就労者（Worker）管理API
 * 就労者のCRUD操作を提供
 */
export const workerApi = {
  // すべての就労者を取得
  getAll: async (): Promise<Worker[]> => {
    const response = await api.get<ApiResponse<Worker[]>>('/api/workers');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch workers');
  },

  // IDで就労者を取得
  getById: async (id: number): Promise<Worker> => {
    const response = await api.get<ApiResponse<Worker>>(`/api/workers/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch worker');
  },

  // 新しい就労者を作成
  create: async (worker: Worker): Promise<Worker> => {
    const response = await api.post<ApiResponse<Worker>>('/api/workers', worker);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create worker');
  },

  // 就労者情報を更新
  update: async (id: number, worker: Partial<Worker>): Promise<Worker> => {
    const response = await api.put<ApiResponse<Worker>>(`/api/workers/${id}`, worker);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update worker');
  },

  // 就労者を削除
  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/api/workers/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete worker');
    }
  },
};

export interface JapaneseProficiency {
  id?: number;
  worker_id: number;
  test_date: string;
  test_type: string;
  level?: string;
  reading_score?: number;
  listening_score?: number;
  writing_score?: number;
  speaking_score?: number;
  total_score?: number;
  passed?: boolean;
  certificate_number?: string;
  certificate_issued_date?: string;
  notes?: string;
}

export interface SkillTraining {
  id?: number;
  worker_id: number;
  skill_category: string;
  skill_name: string;
  training_start_date: string;
  training_end_date?: string;
  training_hours?: number;
  training_location?: string;
  instructor?: string;
  training_method?: string;
  status?: string;
  completion_rate?: number;
  evaluation_score?: number;
  certificate_issued?: boolean;
  certificate_number?: string;
  notes?: string;
}

export interface JapaneseLearningRecord {
  id?: number;
  worker_id: number;
  learning_date: string;
  learning_type: string;
  learning_content: string;
  topics_covered?: string;
  duration_minutes?: number;
  vocabulary_learned?: number;
  grammar_points?: string;
  practice_activities?: string;
  difficulty_level?: string;
  self_rating?: number;
  instructor_feedback?: string;
  homework_assigned?: string;
  homework_completed?: boolean;
  notes?: string;
}

export interface PreDepartureSupport {
  id?: number;
  worker_id: number;
  support_type: string;
  support_date: string;
  support_content: string;
  status?: string;
  required_documents?: string;
  documents_submitted?: boolean;
  support_staff?: string;
  next_action?: string;
  next_action_date?: string;
  notes?: string;
}

/**
 * 進捗管理API
 * 就労者の進捗記録を管理するAPIクライアント
 */
export const progressApi = {
  /**
   * 指定された就労者のすべての進捗記録を取得
   * @param workerId - 就労者ID
   * @returns 進捗記録の配列
   */
  getAll: async (workerId: number): Promise<WorkerProgress[]> => {
    const response = await api.get<ApiResponse<WorkerProgress[]>>(`/api/workers/${workerId}/progress`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch progress');
  },

  /**
   * 指定された進捗記録を取得
   * @param workerId - 就労者ID
   * @param progressId - 進捗記録ID
   * @returns 進捗記録
   */
  getById: async (workerId: number, progressId: number): Promise<WorkerProgress> => {
    const response = await api.get<ApiResponse<WorkerProgress>>(`/api/workers/${workerId}/progress/${progressId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch progress');
  },

  /**
   * 新しい進捗記録を作成
   * @param progress - 進捗記録データ
   * @returns 作成された進捗記録
   */
  create: async (progress: WorkerProgress): Promise<WorkerProgress> => {
    const response = await api.post<ApiResponse<WorkerProgress>>(
      `/api/workers/${progress.worker_id}/progress`,
      progress
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create progress');
  },

  /**
   * 進捗記録を更新
   * @param workerId - 就労者ID
   * @param progressId - 進捗記録ID
   * @param progress - 更新する進捗記録データ（部分更新可能）
   * @returns 更新された進捗記録
   */
  update: async (workerId: number, progressId: number, progress: Partial<WorkerProgress>): Promise<WorkerProgress> => {
    const response = await api.put<ApiResponse<WorkerProgress>>(
      `/api/workers/${workerId}/progress/${progressId}`,
      progress
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update progress');
  },

  /**
   * 進捗記録を削除
   * @param workerId - 就労者ID
   * @param progressId - 進捗記録ID
   */
  delete: async (workerId: number, progressId: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/api/workers/${workerId}/progress/${progressId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete progress');
    }
  },
};

/**
 * 日本語能力管理API
 * 就労者の日本語能力記録を管理するAPIクライアント
 */
export const japaneseProficiencyApi = {
  /**
   * 指定された就労者のすべての日本語能力記録を取得
   * @param workerId - 就労者ID
   * @returns 日本語能力記録の配列
   */
  getAll: async (workerId: number): Promise<JapaneseProficiency[]> => {
    const response = await api.get<ApiResponse<JapaneseProficiency[]>>(`/api/workers/${workerId}/japanese-proficiency`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch proficiencies');
  },

  /**
   * 指定された日本語能力記録を取得
   * @param workerId - 就労者ID
   * @param proficiencyId - 日本語能力記録ID
   * @returns 日本語能力記録
   */
  getById: async (workerId: number, proficiencyId: number): Promise<JapaneseProficiency> => {
    const response = await api.get<ApiResponse<JapaneseProficiency>>(`/api/workers/${workerId}/japanese-proficiency/${proficiencyId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch proficiency');
  },

  /**
   * 新しい日本語能力記録を作成
   * @param proficiency - 日本語能力記録データ
   * @returns 作成された日本語能力記録
   */
  create: async (proficiency: JapaneseProficiency): Promise<JapaneseProficiency> => {
    const response = await api.post<ApiResponse<JapaneseProficiency>>(
      `/api/workers/${proficiency.worker_id}/japanese-proficiency`,
      proficiency
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create proficiency');
  },

  /**
   * 日本語能力記録を更新
   * @param workerId - 就労者ID
   * @param proficiencyId - 日本語能力記録ID
   * @param proficiency - 更新する日本語能力記録データ（部分更新可能）
   * @returns 更新された日本語能力記録
   */
  update: async (workerId: number, proficiencyId: number, proficiency: Partial<JapaneseProficiency>): Promise<JapaneseProficiency> => {
    const response = await api.put<ApiResponse<JapaneseProficiency>>(
      `/api/workers/${workerId}/japanese-proficiency/${proficiencyId}`,
      proficiency
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update proficiency');
  },

  /**
   * 日本語能力記録を削除
   * @param workerId - 就労者ID
   * @param proficiencyId - 日本語能力記録ID
   */
  delete: async (workerId: number, proficiencyId: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/api/workers/${workerId}/japanese-proficiency/${proficiencyId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete proficiency');
    }
  },
};

/**
 * 技能訓練管理API
 * 就労者の技能訓練記録を管理するAPIクライアント
 */
export const skillTrainingApi = {
  /**
   * 指定された就労者のすべての技能訓練記録を取得
   * @param workerId - 就労者ID
   * @returns 技能訓練記録の配列
   */
  getAll: async (workerId: number): Promise<SkillTraining[]> => {
    const response = await api.get<ApiResponse<SkillTraining[]>>(`/api/workers/${workerId}/skill-training`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch trainings');
  },

  /**
   * 指定された技能訓練記録を取得
   * @param workerId - 就労者ID
   * @param trainingId - 技能訓練記録ID
   * @returns 技能訓練記録
   */
  getById: async (workerId: number, trainingId: number): Promise<SkillTraining> => {
    const response = await api.get<ApiResponse<SkillTraining>>(`/api/workers/${workerId}/skill-training/${trainingId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch training');
  },

  /**
   * 新しい技能訓練記録を作成
   * @param training - 技能訓練記録データ
   * @returns 作成された技能訓練記録
   */
  create: async (training: SkillTraining): Promise<SkillTraining> => {
    const response = await api.post<ApiResponse<SkillTraining>>(
      `/api/workers/${training.worker_id}/skill-training`,
      training
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create training');
  },

  /**
   * 技能訓練記録を更新
   * @param workerId - 就労者ID
   * @param trainingId - 技能訓練記録ID
   * @param training - 更新する技能訓練記録データ（部分更新可能）
   * @returns 更新された技能訓練記録
   */
  update: async (workerId: number, trainingId: number, training: Partial<SkillTraining>): Promise<SkillTraining> => {
    const response = await api.put<ApiResponse<SkillTraining>>(
      `/api/workers/${workerId}/skill-training/${trainingId}`,
      training
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update training');
  },

  /**
   * 技能訓練記録を削除
   * @param workerId - 就労者ID
   * @param trainingId - 技能訓練記録ID
   */
  delete: async (workerId: number, trainingId: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/api/workers/${workerId}/skill-training/${trainingId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete training');
    }
  },
};

/**
 * 日本語学習記録管理API
 * 就労者の日本語学習記録を管理するAPIクライアント
 */
export const japaneseLearningApi = {
  /**
   * 指定された就労者のすべての日本語学習記録を取得
   * @param workerId - 就労者ID
   * @returns 日本語学習記録の配列
   */
  getAll: async (workerId: number): Promise<JapaneseLearningRecord[]> => {
    const response = await api.get<ApiResponse<JapaneseLearningRecord[]>>(`/api/workers/${workerId}/japanese-learning`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch learning records');
  },

  /**
   * 新しい日本語学習記録を作成
   * @param record - 日本語学習記録データ
   * @returns 作成された日本語学習記録
   */
  create: async (record: JapaneseLearningRecord): Promise<JapaneseLearningRecord> => {
    const response = await api.post<ApiResponse<JapaneseLearningRecord>>(
      `/api/workers/${record.worker_id}/japanese-learning`,
      record
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create learning record');
  },
};

/**
 * 来日前支援管理API
 * 就労者の来日前支援記録を管理するAPIクライアント
 */
export const preDepartureSupportApi = {
  /**
   * 指定された就労者のすべての来日前支援記録を取得
   * @param workerId - 就労者ID
   * @returns 来日前支援記録の配列
   */
  getAll: async (workerId: number): Promise<PreDepartureSupport[]> => {
    const response = await api.get<ApiResponse<PreDepartureSupport[]>>(`/api/workers/${workerId}/pre-departure-support`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch pre-departure supports');
  },

  /**
   * 新しい来日前支援記録を作成
   * @param support - 来日前支援記録データ
   * @returns 作成された来日前支援記録
   */
  create: async (support: PreDepartureSupport): Promise<PreDepartureSupport> => {
    const response = await api.post<ApiResponse<PreDepartureSupport>>(
      `/api/workers/${support.worker_id}/pre-departure-support`,
      support
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create pre-departure support');
  },
};

// 訓練管理機能の型定義
export interface TrainingMenu {
  id?: number;
  menu_name: string;
  scenario_id: string;
  scenario_description?: string;
  target_safety_score?: number;
  target_error_count?: number;
  target_procedure_compliance?: number;
  target_work_time?: number;
  target_achievement_rate?: number;
  equipment_type: string;
  difficulty_level: string;
  time_limit?: number;
  is_active?: boolean;
  created_by?: string;
}

export interface TrainingMenuAssignment {
  id?: number;
  worker_id: number;
  training_menu_id: number;
  assigned_date: string;
  deadline?: string;
  status?: string;
  completed_at?: string;
  notes?: string;
  menu_name?: string;
  scenario_id?: string;
  equipment_type?: string;
  difficulty_level?: string;
}

export interface TrainingSession {
  session_id: string;
  worker_id: number;
  training_menu_id?: number;
  session_start_time: string;
  session_end_time?: string;
  duration_seconds?: number;
  status?: string;
  kpi?: KPIScore;
  operation_logs_count?: number;
}

export interface KPIScore {
  safety_score?: number;
  error_count?: number;
  procedure_compliance_rate?: number;
  work_time_seconds?: number;
  achievement_rate?: number;
  accuracy_score?: number;
  efficiency_score?: number;
  overall_score?: number;
  notes?: string;
}

export interface Milestone {
  id?: number;
  worker_id: number;
  milestone_name: string;
  milestone_type: string;
  target_date?: string;
  achieved_date?: string;
  status?: string;
  certificate_number?: string;
  certificate_file_path?: string;
  evidence_report_id?: number;
  notes?: string;
}

export interface CareerPath {
  id?: number;
  worker_id: number;
  path_stage: string;
  stage_start_date: string;
  stage_end_date?: string;
  status?: string;
  target_japanese_level?: string;
  target_skill_level?: string;
  achieved_japanese_level?: string;
  achieved_skill_level?: string;
  transition_date?: string;
  notes?: string;
}

export interface IntegratedDashboardData {
  kpi_timeline: Array<{
    date: string;
    safety_score?: number;
    error_count?: number;
    procedure_compliance_rate?: number;
    achievement_rate?: number;
    overall_score?: number;
  }>;
  japanese_proficiency: Array<{
    date: string;
    test_type: string;
    level?: string;
    total_score?: number;
    passed?: boolean;
  }>;
}

// 訓練管理API
export const trainingMenuApi = {
  getAll: async (activeOnly?: boolean): Promise<TrainingMenu[]> => {
    const url = activeOnly ? '/api/training-menus?active_only=true' : '/api/training-menus';
    const response = await api.get<ApiResponse<TrainingMenu[]>>(url);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch training menus');
  },

  getById: async (menuId: number): Promise<TrainingMenu> => {
    const response = await api.get<ApiResponse<TrainingMenu>>(`/api/training-menus/${menuId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch training menu');
  },

  create: async (menu: TrainingMenu): Promise<TrainingMenu> => {
    const response = await api.post<ApiResponse<TrainingMenu>>('/api/training-menus', menu);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create training menu');
  },

  update: async (menuId: number, menu: Partial<TrainingMenu>): Promise<TrainingMenu> => {
    const response = await api.put<ApiResponse<TrainingMenu>>(`/api/training-menus/${menuId}`, menu);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update training menu');
  },

  delete: async (menuId: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/api/training-menus/${menuId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete training menu');
    }
  },
};

export const trainingMenuAssignmentApi = {
  getAll: async (workerId: number): Promise<TrainingMenuAssignment[]> => {
    const response = await api.get<ApiResponse<TrainingMenuAssignment[]>>(`/api/workers/${workerId}/training-menu-assignments`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch training menu assignments');
  },

  create: async (assignment: TrainingMenuAssignment): Promise<TrainingMenuAssignment> => {
    const response = await api.post<ApiResponse<TrainingMenuAssignment>>(
      `/api/workers/${assignment.worker_id}/training-menu-assignments`,
      assignment
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create training menu assignment');
  },
};

export const trainingSessionApi = {
  create: async (session: any): Promise<any> => {
    const response = await api.post<ApiResponse<any>>('/api/training-sessions', session);
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.error || 'Failed to create training session');
  },

  getById: async (sessionId: string): Promise<TrainingSession> => {
    const response = await api.get<ApiResponse<TrainingSession>>(`/api/training-sessions/${sessionId}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch training session');
  },

  getAllByWorker: async (workerId: number): Promise<TrainingSession[]> => {
    const response = await api.get<ApiResponse<TrainingSession[]>>(`/api/workers/${workerId}/training-sessions`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch training sessions');
  },
};

export const milestoneApi = {
  getAll: async (workerId: number): Promise<Milestone[]> => {
    const response = await api.get<ApiResponse<Milestone[]>>(`/api/workers/${workerId}/milestones`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch milestones');
  },

  create: async (milestone: Milestone): Promise<Milestone> => {
    const response = await api.post<ApiResponse<Milestone>>(
      `/api/workers/${milestone.worker_id}/milestones`,
      milestone
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create milestone');
  },
};

export const careerPathApi = {
  getAll: async (workerId: number): Promise<CareerPath[]> => {
    const response = await api.get<ApiResponse<CareerPath[]>>(`/api/workers/${workerId}/career-paths`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch career paths');
  },

  create: async (path: CareerPath): Promise<CareerPath> => {
    const response = await api.post<ApiResponse<CareerPath>>(
      `/api/workers/${path.worker_id}/career-paths`,
      path
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create career path');
  },
};

export const integratedDashboardApi = {
  get: async (workerId: number): Promise<IntegratedDashboardData> => {
    try {
      const response = await api.get<ApiResponse<IntegratedDashboardData>>(`/api/workers/${workerId}/dashboard/integrated`);
      if (response.data.success && response.data.data) {
        // デフォルト値を設定して、不完全なレスポンスに対応
        // 配列であることを確認し、そうでない場合は空配列を設定
        const data = response.data.data;
        return {
          kpi_timeline: Array.isArray(data.kpi_timeline) ? data.kpi_timeline : [],
          japanese_proficiency: Array.isArray(data.japanese_proficiency) ? data.japanese_proficiency : [],
        };
      }
    } catch (error) {
      console.error('Failed to fetch integrated dashboard data:', error);
    }
    // エラー時も空のデータを返す（エラー表示はコンポーネント側で処理）
    return {
      kpi_timeline: [],
      japanese_proficiency: [],
    };
  },
};

export interface AdminSummary {
  summary: Array<{
    worker_id: number;
    worker_name: string;
    japanese_level?: string;
    current_status?: string;
    latest_kpi?: {
      safety_score?: number;
      error_count?: number;
      overall_score?: number;
    };
    latest_proficiency?: {
      test_type?: string;
      level?: string;
      passed?: boolean;
    };
    milestones: {
      achieved: number;
      total: number;
      achievement_rate: number;
    };
  }>;
  alerts: Array<{
    worker_id: number;
    worker_name: string;
    type: string;
    message: string;
    priority: string;
  }>;
  total_workers: number;
  workers_with_low_kpi: number;
  workers_with_high_errors: number;
}

export const evidenceReportApi = {
  downloadPDF: async (workerId: number, periodStart?: string, periodEnd?: string): Promise<void> => {
    let url = `/api/workers/${workerId}/evidence-report?format=pdf`;
    if (periodStart) url += `&period_start=${periodStart}`;
    if (periodEnd) url += `&period_end=${periodEnd}`;
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}${url}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error('Failed to download PDF report');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `evidence_report_${workerId}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  downloadCSV: async (workerId: number, periodStart?: string, periodEnd?: string): Promise<void> => {
    let url = `/api/workers/${workerId}/evidence-report?format=csv`;
    if (periodStart) url += `&period_start=${periodStart}`;
    if (periodEnd) url += `&period_end=${periodEnd}`;
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}${url}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error('Failed to download CSV report');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `evidence_report_${workerId}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};

export const adminSummaryApi = {
  get: async (): Promise<AdminSummary> => {
    try {
      const response = await api.get<ApiResponse<AdminSummary>>('/api/admin/summary');
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        // 安全にデータを返す（配列が存在しない場合は空配列を設定）
        return {
          total_workers: data.total_workers || 0,
          active_workers: data.active_workers || 0,
          total_trainings: data.total_trainings || 0,
          active_trainings: data.active_trainings || 0,
          workers_with_low_kpi: data.workers_with_low_kpi || 0,
          workers_with_high_errors: data.workers_with_high_errors || 0,
          alerts: Array.isArray(data.alerts) ? data.alerts : [],
          summary: Array.isArray(data.summary) ? data.summary : [],
        };
      }
    } catch (error) {
      console.error('Failed to fetch admin summary:', error);
    }
    // エラー時も空のデータを返す
    return {
      total_workers: 0,
      active_workers: 0,
      total_trainings: 0,
      active_trainings: 0,
      workers_with_low_kpi: 0,
      workers_with_high_errors: 0,
      alerts: [],
      summary: [],
    };
  },
};

// 建設機械シミュレーター訓練管理API
export interface ConstructionSimulatorTraining {
  id?: number;
  worker_id: number;
  machine_type: string;
  simulator_model?: string;
  training_start_date: string;
  training_end_date?: string;
  total_training_hours?: number;
  training_location?: string;
  instructor?: string;
  status?: string;
  completion_rate?: number;
  evaluation_score?: number;
  safety_score?: number;
  efficiency_score?: number;
  accuracy_score?: number;
  certificate_issued?: boolean;
  certificate_number?: string;
  notes?: string;
}

export const constructionSimulatorTrainingApi = {
  getAll: async (workerId: number): Promise<ConstructionSimulatorTraining[]> => {
    const response = await api.get<ApiResponse<ConstructionSimulatorTraining[]>>(`/api/workers/${workerId}/simulator-training`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch simulator trainings');
  },

  create: async (workerId: number, training: Omit<ConstructionSimulatorTraining, 'id' | 'worker_id'>): Promise<ConstructionSimulatorTraining> => {
    const response = await api.post<ApiResponse<ConstructionSimulatorTraining>>(`/api/workers/${workerId}/simulator-training`, training);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create simulator training');
  },

  update: async (workerId: number, trainingId: number, training: Partial<ConstructionSimulatorTraining>): Promise<ConstructionSimulatorTraining> => {
    const response = await api.put<ApiResponse<ConstructionSimulatorTraining>>(`/api/workers/${workerId}/simulator-training/${trainingId}`, training);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to update simulator training');
  },

  delete: async (workerId: number, trainingId: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/api/workers/${workerId}/simulator-training/${trainingId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete simulator training');
    }
  },
};

// 統合成長管理API
export interface IntegratedGrowth {
  id?: number;
  worker_id: number;
  assessment_date: string;
  japanese_level?: string;
  japanese_score?: number;
  skill_level?: string;
  skill_score?: number;
  simulator_score?: number;
  overall_growth_score?: number;
  growth_trend?: string;
  readiness_for_transition?: string;
  target_achievement_rate?: number;
  next_milestone?: string;
  notes?: string;
}

export const integratedGrowthApi = {
  getAll: async (workerId: number): Promise<IntegratedGrowth[]> => {
    const response = await api.get<ApiResponse<IntegratedGrowth[]>>(`/api/workers/${workerId}/integrated-growth`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch integrated growth');
  },

  create: async (workerId: number, growth: Omit<IntegratedGrowth, 'id' | 'worker_id'>): Promise<IntegratedGrowth> => {
    const response = await api.post<ApiResponse<IntegratedGrowth>>(`/api/workers/${workerId}/integrated-growth`, growth);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create integrated growth');
  },
};

// 特定技能移行支援API
export interface SpecificSkillTransition {
  id?: number;
  worker_id: number;
  transition_type: string;
  target_transition_date?: string;
  actual_transition_date?: string;
  status?: string;
  required_japanese_level?: string;
  required_skill_level?: string;
  current_japanese_level?: string;
  current_skill_level?: string;
  readiness_assessment?: string;
  required_documents?: string;
  documents_submitted?: boolean;
  application_submitted?: boolean;
  application_date?: string;
  approval_date?: string;
  support_staff?: string;
  notes?: string;
}

export const specificSkillTransitionApi = {
  getAll: async (workerId: number): Promise<SpecificSkillTransition[]> => {
    const response = await api.get<ApiResponse<SpecificSkillTransition[]>>(`/api/workers/${workerId}/specific-skill-transition`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch specific skill transitions');
  },

  create: async (workerId: number, transition: Omit<SpecificSkillTransition, 'id' | 'worker_id'>): Promise<SpecificSkillTransition> => {
    const response = await api.post<ApiResponse<SpecificSkillTransition>>(`/api/workers/${workerId}/specific-skill-transition`, transition);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create specific skill transition');
  },
};

// キャリア目標設定API
export interface CareerGoal {
  id?: number;
  worker_id: number;
  goal_name: string;
  goal_category: string;
  description?: string;
  target_date?: string;
  current_progress?: number;
  status?: string;
  achieved_date?: string;
  milestones_json?: string;
  success_criteria?: string;
  support_resources?: string;
  notes?: string;
}

export const careerGoalApi = {
  getAll: async (workerId: number): Promise<CareerGoal[]> => {
    const response = await api.get<ApiResponse<CareerGoal[]>>(`/api/workers/${workerId}/career-goals`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch career goals');
  },

  create: async (workerId: number, goal: Omit<CareerGoal, 'id' | 'worker_id'>): Promise<CareerGoal> => {
    const response = await api.post<ApiResponse<CareerGoal>>(`/api/workers/${workerId}/career-goals`, goal);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create career goal');
  },
};

// 認証API
export interface User {
  id?: number;
  username: string;
  email: string;
  role: 'trainee' | 'administrator' | 'auditor';
  worker_id?: number;
  is_active?: boolean;
  last_login?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  mfa_code?: string;      // MFAコード（6桁）
  backup_code?: string;  // バックアップコード
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    try {
      // モック実装: localStorageにユーザー情報がある場合、それを検証
      // 注意: これはモック実装であり、本番環境では使用しないでください
      // VercelのServerless Functionsでは、register.tsとlogin.tsが別々の関数として実行されるため、
      // グローバル変数が共有されません。そのため、localStorageに保存されたユーザー情報を使用します。
      // ただし、MFAが有効なユーザーの場合は、常にAPIを呼び出してMFAチェックを行う必要があります。
      let shouldSkipLocalStorage = false;
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser);
            // ユーザー名が一致し、パスワードが一致する場合
            if (user.username === credentials.username && user.password === credentials.password) {
              // 全ユーザーに対してMFAチェックを行う
              // 注意: 本番環境では、ユーザーの設定に応じてMFAを有効/無効にする必要があります
              if (!credentials.mfa_code && !credentials.backup_code) {
                // MFAコードが提供されていない場合、MFAエラーを投げる
                // これにより、MFA画面が表示される
                console.log('MFA code required for all users, throwing MFA error');
                const mfaError = new Error('MFA code or backup code is required');
                (mfaError as any).mfa_required = true;
                throw mfaError;
              }
              // MFAコードが提供されている場合は、APIを呼び出してMFAチェックを行う
              console.log('MFA code provided, calling API for MFA check');
              // この処理は下のAPI呼び出しに続く
              shouldSkipLocalStorage = false; // APIを呼び出す
            }
          } catch (err) {
            // MFAエラーの場合は、そのまま再スロー
            if ((err as any)?.mfa_required === true) {
              throw err;
            }
            console.error('Failed to parse saved user:', err);
            localStorage.removeItem('user');
          }
        }
      }
      
      // APIを呼び出してMFAチェックを行う
      console.log('Calling API for login/MFA check:', {
        username: credentials.username,
        hasMfaCode: !!credentials.mfa_code,
        hasBackupCode: !!credentials.backup_code,
      });
      
      const response = await api.post<ApiResponse<User> & { mfa_required?: boolean }>('/api/auth/login', credentials, {
        withCredentials: true,
      });
      
      console.log('API response received:', {
        success: response.data.success,
        mfa_required: response.data.mfa_required,
        hasData: !!response.data.data,
        error: response.data.error,
        fullResponse: response.data,
      });
      
      // MFAが必要な場合のエラー処理（successがfalseでもチェック）
      if (response.data.mfa_required === true) {
        console.log('MFA required detected in response.data');
        const mfaError = new Error(response.data.error || 'MFA code is required');
        (mfaError as any).mfa_required = true;
        throw mfaError;
      }
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Failed to login');
    } catch (error: any) {
      // エラーレスポンスを確認
      const responseData = error.response?.data;
      const statusCode = error.response?.status;
      
      // MFAが必要かどうかを確認（複数の方法でチェック）
      const isMfaRequired = 
        responseData?.mfa_required === true || 
        error.mfa_required === true ||
        (statusCode === 401 && responseData?.mfa_required === true) ||
        (error instanceof Error && (error as any).mfa_required === true);
      
      // デバッグ用ログ
      console.log('Login error details:', {
        status: statusCode,
        data: responseData,
        isMfaRequired,
        error: error,
        response: error.response,
        mfa_required_in_error: error.mfa_required,
        mfa_required_in_response: responseData?.mfa_required,
      });
      
      // エラーメッセージを取得
      const errorMessage = responseData?.error || error.message || 'Failed to login';
      const loginError = new Error(errorMessage);
      
      // MFAが必要な場合、フラグを設定
      if (isMfaRequired) {
        (loginError as any).mfa_required = true;
        console.log('MFA required flag set on error', {
          isMfaRequired,
          statusCode,
          mfa_required_in_data: responseData?.mfa_required,
          mfa_required_in_error: error.mfa_required,
        });
      }
      
      throw loginError;
    }
  },

  register: async (credentials: RegisterCredentials): Promise<User> => {
    try {
      const response = await api.post<ApiResponse<User>>('/api/auth/register', credentials, {
        withCredentials: true,
      });
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to register');
    } catch (error: any) {
      // エラーメッセージを取得（複数の形式に対応）
      let errorMessage = 'Failed to register';
      
      if (error instanceof Error) {
        // Errorオブジェクトの場合
        errorMessage = error.message;
      } else if (error.response?.data) {
        // レスポンスデータがある場合
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Register error:', error);
      const registerError = new Error(errorMessage);
      throw registerError;
    }
  },

  logout: async (): Promise<void> => {
    const response = await api.post<ApiResponse<void>>('/api/auth/logout', {}, {
      withCredentials: true,
    });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to logout');
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/api/auth/current', {
      withCredentials: true,
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Not authenticated');
  },
};

// ユーザー管理API
export const userApi = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>('/api/users', {
      withCredentials: true,
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch users');
  },

  create: async (user: Omit<User, 'id'> & { password: string }): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/api/users', user, {
      withCredentials: true,
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create user');
  },
};

// リプレイAPI
export interface ReplayData {
  session_id: string;
  worker_id: number | null;
  session_start_time: string;
  session_end_time: string;
  duration_seconds: number;
  operation_logs: Array<{
    timestamp: string;
    operation_type?: string;
    operation_value?: any;
    error_event?: boolean;
    error_description?: string;
    achievement_event?: boolean;
    achievement_description?: string;
    event_type?: 'operation' | 'error' | 'achievement';
    state_log?: {
      position?: {
        x?: number;
        y?: number;
        z?: number;
      };
      velocity?: number;
    };
    equipment_state?: any;
  }>;
  ai_evaluation: any;
  replay_data: any;
  kpi_scores?: {
    safety_score?: number;
    error_count?: number;
    procedure_compliance_rate?: number;
    work_time_seconds?: number;
    achievement_rate?: number;
    accuracy_score?: number;
    efficiency_score?: number;
    overall_score?: number;
  };
  kpi_timeline?: Array<{
    timestamp: string;
    error_event?: boolean;
    error_description?: string;
    achievement_event?: boolean;
    achievement_description?: string;
  }>;
}

export const replayApi = {
  get: async (sessionId: string): Promise<ReplayData> => {
    const response = await api.get<ApiResponse<ReplayData>>(`/api/replay/${sessionId}`, {
      withCredentials: true,
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch replay data');
  },
};

// Unity連携API
export interface UnityTrainingSessionData {
  session_id: string;
  worker_id: number;
  training_menu_id?: number;
  session_start_time: string;
  session_end_time: string;
  duration_seconds: number;
  status?: string;
  operation_logs?: any[];
  ai_evaluation?: any;
  replay_data?: any;
  kpi_scores?: {
    safety_score?: number;
    error_count?: number;
    procedure_compliance_rate?: number;
    work_time_seconds?: number;
    achievement_rate?: number;
    accuracy_score?: number;
    efficiency_score?: number;
    overall_score?: number;
    notes?: string;
  };
}

export const unityApi = {
  submitTrainingSession: async (data: UnityTrainingSessionData): Promise<{ session_id: string; id: number }> => {
    const response = await api.post<ApiResponse<{ session_id: string; id: number }>>('/api/unity/training-session', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to submit training session');
  },
};

