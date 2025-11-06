'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { trainingMenuApi, type TrainingMenu } from '@/lib/api';

interface TrainingMenuManagementProps {
  workerId?: number;
}

export default function TrainingMenuManagement({ workerId }: TrainingMenuManagementProps) {
  const { t } = useTranslation();
  const [menus, setMenus] = useState<TrainingMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState<TrainingMenu | null>(null);

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await trainingMenuApi.getAll();
      setMenus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load training menus');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenu = () => {
    setEditingMenu({
      menu_name: '',
      scenario_id: '',
      equipment_type: '油圧ショベル',
      difficulty_level: '初級',
      is_active: true,
    });
    setShowForm(true);
  };

  const handleEditMenu = (menu: TrainingMenu) => {
    setEditingMenu(menu);
    setShowForm(true);
  };

  const handleSaveMenu = async (menu: TrainingMenu) => {
    try {
      if (menu.id) {
        await trainingMenuApi.update(menu.id, menu);
      } else {
        await trainingMenuApi.create(menu);
      }
      setShowForm(false);
      setEditingMenu(null);
      loadMenus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save training menu');
    }
  };

  const handleDeleteMenu = async (menuId: number) => {
    if (!confirm('Delete this training menu?')) return;
    
    try {
      await trainingMenuApi.delete(menuId);
      loadMenus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete training menu');
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
      <div className="p-6 bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">{t('trainingMenuManagement')}</h2>
          </div>
          <button
            onClick={handleAddMenu}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 hover:scale-105 active:scale-95 font-semibold"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('add')}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      {showForm && editingMenu && (
        <div className="p-6 border-b bg-gray-50">
          <TrainingMenuForm
            menu={editingMenu}
            onSave={handleSaveMenu}
            onCancel={() => {
              setShowForm(false);
              setEditingMenu(null);
            }}
          />
        </div>
      )}

      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {menus.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No training menus found</p>
          </div>
        ) : (
          menus.map((menu, index) => (
            <div key={menu.id} className="p-5 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{menu.menu_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      menu.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {menu.is_active ? t('active') : t('inactive')}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {menu.difficulty_level}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-2">
                    <div>
                      <span className="text-gray-600">{t('scenarioId')}:</span>
                      <span className="ml-2 font-semibold">{menu.scenario_id}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('equipmentType')}:</span>
                      <span className="ml-2 font-semibold">{menu.equipment_type}</span>
                    </div>
                    {menu.target_safety_score && (
                      <div>
                        <span className="text-gray-600">{t('targetSafetyScore')}:</span>
                        <span className="ml-2 font-semibold">{menu.target_safety_score}%</span>
                      </div>
                    )}
                    {menu.time_limit && (
                      <div>
                        <span className="text-gray-600">{t('timeLimit')}:</span>
                        <span className="ml-2 font-semibold">{menu.time_limit}秒</span>
                      </div>
                    )}
                  </div>
                  {menu.scenario_description && (
                    <div className="text-sm text-gray-600 mt-2">
                      {menu.scenario_description}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditMenu(menu)}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-all"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => menu.id && handleDeleteMenu(menu.id)}
                    className="px-3 py-1 text-sm bg-red-200 text-red-700 rounded hover:bg-red-300 transition-all"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface TrainingMenuFormProps {
  menu: TrainingMenu;
  onSave: (menu: TrainingMenu) => void;
  onCancel: () => void;
}

function TrainingMenuForm({ menu, onSave, onCancel }: TrainingMenuFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<TrainingMenu>(menu);

  const handleChange = (field: keyof TrainingMenu, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('menuName')} *
          </label>
          <input
            type="text"
            required
            value={formData.menu_name}
            onChange={(e) => handleChange('menu_name', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('scenarioId')} *
          </label>
          <input
            type="text"
            required
            value={formData.scenario_id}
            onChange={(e) => handleChange('scenario_id', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('scenarioDescription')}
          </label>
          <textarea
            value={formData.scenario_description || ''}
            onChange={(e) => handleChange('scenario_description', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('equipmentType')} *
          </label>
          <select
            required
            value={formData.equipment_type}
            onChange={(e) => handleChange('equipment_type', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
          >
            <option value="油圧ショベル">油圧ショベル</option>
            <option value="ブルドーザー">ブルドーザー</option>
            <option value="クレーン">クレーン</option>
            <option value="フォークリフト">フォークリフト</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('difficultyLevel')} *
          </label>
          <select
            required
            value={formData.difficulty_level}
            onChange={(e) => handleChange('difficulty_level', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
          >
            <option value="初級">{t('beginner')}</option>
            <option value="中級">{t('intermediate')}</option>
            <option value="上級">{t('advanced')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('targetSafetyScore')}
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.target_safety_score || ''}
            onChange={(e) => handleChange('target_safety_score', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('targetErrorCount')}
          </label>
          <input
            type="number"
            min="0"
            value={formData.target_error_count || ''}
            onChange={(e) => handleChange('target_error_count', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('targetProcedureCompliance')}
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.target_procedure_compliance || ''}
            onChange={(e) => handleChange('target_procedure_compliance', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('timeLimit')} (秒)
          </label>
          <input
            type="number"
            min="0"
            value={formData.time_limit || ''}
            onChange={(e) => handleChange('time_limit', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('status')}
          </label>
          <select
            value={formData.is_active ? 'active' : 'inactive'}
            onChange={(e) => handleChange('is_active', e.target.value === 'active')}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
          >
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-xl hover:shadow-glow-lg transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {t('save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}

