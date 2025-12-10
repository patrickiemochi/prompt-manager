// app.jsx - 主應用程式
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// Supabase 初始化
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 分類配置
const CATEGORIES = {
  '人物': ['年齡', '特徵', '裝扮', '表情'],
  '風景': ['場景', '時間', '氛圍'],
  '畫風': ['藝術風格', '風格流派', '知名畫家'],
  '畫質提升': ['解析度', '細節', '特效'],
  '光影': ['光源', '色溫'],
  '情感&氛圍': ['情緒', '色調'],
  '技術標籤': ['模型', '參數']
};

// Flux 提示詞範本
const FLUX_TEMPLATE = (prompts) => {
  return `${prompts.map(p => p.english_text).join(', ')}`;
};

// SDXL 提示詞範本
const SDXL_TEMPLATE = (prompts) => {
  return `${prompts.map(p => p.english_text).join(', ')} | High quality, detailed, 8k`;
};

// 中文提示詞範本
const CHINESE_TEMPLATE = (prompts) => {
  return prompts.map(p => `${p.chinese_text}（${p.english_text}）`).join(' + ');
};

export default function App() {
  const [prompts, setPrompts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedPrompts, setSelectedPrompts] = useState(new Set());
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubCategory, setFilterSubCategory] = useState('');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [newPrompt, setNewPrompt] = useState({
    english_text: '',
    chinese_text: '',
    category: '',
    sub_category: '',
    image_url: ''
  });

  // 載入資料
  useEffect(() => {
    loadPrompts();
    loadCategories();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error('Error loading prompts:', error);
      alert('無法載入提示詞：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // 新增提示詞
  const handleAddPrompt = async (e) => {
    e.preventDefault();
    
    if (!newPrompt.english_text || !newPrompt.chinese_text || !newPrompt.category) {
      alert('請填寫所有必填欄位');
      return;
    }

    // 檢查重複
    const duplicate = prompts.find(p => 
      p.english_text.toLowerCase() === newPrompt.english_text.toLowerCase() ||
      p.chinese_text === newPrompt.chinese_text
    );

    if (duplicate) {
      const confirmAdd = window.confirm(
        `找到相似的提示詞：${duplicate.chinese_text}\n\n是否仍要新增？`
      );
      if (!confirmAdd) return;
    }

    try {
      const { data, error } = await supabase
        .from('prompts')
        .insert([{
          ...newPrompt,
          source_app: 'web'
        }])
        .select();

      if (error) throw error;
      
      setPrompts([data[0], ...prompts]);
      setNewPrompt({ english_text: '', chinese_text: '', category: '', sub_category: '', image_url: '' });
      setShowAddForm(false);
      alert('提示詞已新增！');
    } catch (error) {
      alert('新增失敗：' + error.message);
    }
  };

  // 刪除提示詞
  const handleDeletePrompt = async (id) => {
    if (!window.confirm('確定要刪除此提示詞嗎？')) return;

    try {
      const { error } = await supabase
        .from('prompts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      setPrompts(prompts.filter(p => p.id !== id));
      setSelectedPrompts(prev => {
        prev.delete(id);
        return new Set(prev);
      });
    } catch (error) {
      alert('刪除失敗：' + error.message);
    }
  };

  // 篩選提示詞
  const filteredPrompts = prompts.filter(prompt => {
    const matchCategory = !filterCategory || prompt.category === filterCategory;
    const matchSubCategory = !filterSubCategory || prompt.sub_category === filterSubCategory;
    const matchSearch = !searchText || 
      prompt.english_text.toLowerCase().includes(searchText.toLowerCase()) ||
      prompt.chinese_text.includes(searchText);
    
    return matchCategory && matchSubCategory && matchSearch;
  });

  // 匯出提示詞
  const exportPrompts = (format) => {
    const selected = Array.from(selectedPrompts).map(id => 
      prompts.find(p => p.id === id)
    );

    if (selected.length === 0) {
      alert('請先勾選提示詞');
      return;
    }

    let exportText = '';
    let filename = '';

    switch (format) {
      case 'flux':
        exportText = FLUX_TEMPLATE(selected);
        filename = 'flux_prompt.txt';
        break;
      case 'sdxl':
        exportText = SDXL_TEMPLATE(selected);
        filename = 'sdxl_prompt.txt';
        break;
      case 'chinese':
        exportText = CHINESE_TEMPLATE(selected);
        filename = 'chinese_prompt.txt';
        break;
      case 'json':
        exportText = JSON.stringify(selected, null, 2);
        filename = 'prompts.json';
        break;
      default:
        return;
    }

    // 複製到剪貼板
    navigator.clipboard.writeText(exportText).then(() => {
      alert('已複製到剪貼板！');
      setShowExportModal(false);

      // 記錄匯出
      supabase.from('export_logs').insert([{
        export_format: format,
        selected_prompts: selected.length,
        exported_text: exportText
      }]).catch(console.error);
    });
  };

  const togglePromptSelection = (id) => {
    const newSelection = new Set(selectedPrompts);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedPrompts(newSelection);
  };

  if (loading) {
    return <div className="loading">載入中...</div>;
  }

  return (
    <div className="container">
      <header className="header">
        <h1>✨ AI 提示詞管理器</h1>
        <p>管理和匯出 Flux / SDXL 提示詞</p>
      </header>

      <div className="main-content">
        {/* 左側：篩選和提示詞庫 */}
        <div className="left-panel">
          {/* 控制按鈕 */}
          <div className="control-buttons">
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? '✕ 關閉' : '+ 新增提示詞'}
            </button>
            {selectedPrompts.size > 0 && (
              <button 
                className="btn btn-success"
                onClick={() => setShowExportModal(true)}
              >
                📤 匯出 ({selectedPrompts.size})
              </button>
            )}
          </div>

          {/* 新增提示詞表單 */}
          {showAddForm && (
            <form className="add-form" onSubmit={handleAddPrompt}>
              <h3>新增提示詞</h3>
              <input
                type="text"
                placeholder="英文提示詞"
                value={newPrompt.english_text}
                onChange={(e) => setNewPrompt({...newPrompt, english_text: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="中文提示詞"
                value={newPrompt.chinese_text}
                onChange={(e) => setNewPrompt({...newPrompt, chinese_text: e.target.value})}
                required
              />
              <select
                value={newPrompt.category}
                onChange={(e) => setNewPrompt({...newPrompt, category: e.target.value, sub_category: ''})}
                required
              >
                <option value="">選擇分類</option>
                {Object.keys(CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {newPrompt.category && (
                <select
                  value={newPrompt.sub_category}
                  onChange={(e) => setNewPrompt({...newPrompt, sub_category: e.target.value})}
                >
                  <option value="">選擇子分類（可選）</option>
                  {CATEGORIES[newPrompt.category].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              )}
              <input
                type="url"
                placeholder="圖片 URL（可選）"
                value={newPrompt.image_url}
                onChange={(e) => setNewPrompt({...newPrompt, image_url: e.target.value})}
              />
              <button type="submit" className="btn btn-primary">新增</button>
            </form>
          )}

          {/* 篩選器 */}
          <div className="filters">
            <h3>篩選</h3>
            <input
              type="text"
              placeholder="搜尋提示詞..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input"
            />
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setFilterSubCategory('');
              }}
              className="filter-select"
            >
              <option value="">所有分類</option>
              {Object.keys(CATEGORIES).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {filterCategory && (
              <select
                value={filterSubCategory}
                onChange={(e) => setFilterSubCategory(e.target.value)}
                className="filter-select"
              >
                <option value="">所有子分類</option>
                {CATEGORIES[filterCategory].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            )}
            <button
              className="btn btn-outline"
              onClick={() => {
                setFilterCategory('');
                setFilterSubCategory('');
                setSearchText('');
              }}
            >
              重置篩選
            </button>
          </div>

          {/* 提示詞列表 */}
          <div className="prompts-list">
            <h3>提示詞庫 ({filteredPrompts.length})</h3>
            {filteredPrompts.length === 0 ? (
              <p className="empty-state">找不到符合條件的提示詞</p>
            ) : (
              filteredPrompts.map(prompt => (
                <div 
                  key={prompt.id}
                  className={`prompt-card ${selectedPrompts.has(prompt.id) ? 'selected' : ''}`}
                  onClick={() => togglePromptSelection(prompt.id)}
                >
                  <div className="prompt-header">
                    <input
                      type="checkbox"
                      checked={selectedPrompts.has(prompt.id)}
                      onChange={() => togglePromptSelection(prompt.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="category-badge">{prompt.category}</span>
                    {prompt.sub_category && (
                      <span className="subcategory-badge">{prompt.sub_category}</span>
                    )}
                  </div>
                  
                  <div className="prompt-content">
                    {prompt.image_url && (
                      <img src={prompt.image_url} alt="" className="prompt-image" />
                    )}
                    <div className="prompt-text">
                      <p className="english">{prompt.english_text}</p>
                      <p className="chinese">{prompt.chinese_text}</p>
                    </div>
                  </div>

                  <div className="prompt-footer">
                    <small>{prompt.created_at ? new Date(prompt.created_at).toLocaleDateString('zh-TW') : ''}</small>
                    <button
                      className="btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePrompt(prompt.id);
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右側：預覽和統計 */}
        <div className="right-panel">
          <div className="preview-panel">
            <h3>已選提示詞預覽</h3>
            {selectedPrompts.size === 0 ? (
              <p className="empty-state">請勾選提示詞查看預覽</p>
            ) : (
              <div className="preview-content">
                <div className="preview-item">
                  <h4>Flux 格式</h4>
                  <div className="preview-text">
                    {FLUX_TEMPLATE(
                      Array.from(selectedPrompts).map(id => prompts.find(p => p.id === id))
                    )}
                  </div>
                </div>
                <div className="preview-item">
                  <h4>中文</h4>
                  <div className="preview-text">
                    {CHINESE_TEMPLATE(
                      Array.from(selectedPrompts).map(id => prompts.find(p => p.id === id))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 統計 */}
          <div className="stats-panel">
            <h3>統計</h3>
            <div className="stat-item">
              <span>總提示詞數</span>
              <strong>{prompts.length}</strong>
            </div>
            <div className="stat-item">
              <span>已勾選</span>
              <strong>{selectedPrompts.size}</strong>
            </div>
            <div className="stat-item">
              <span>已篩選</span>
              <strong>{filteredPrompts.length}</strong>
            </div>
            
            <h4 style={{marginTop: '20px'}}>分類統計</h4>
            {Object.keys(CATEGORIES).map(cat => {
              const count = prompts.filter(p => p.category === cat).length;
              return count > 0 ? (
                <div key={cat} className="stat-item small">
                  <span>{cat}</span>
                  <strong>{count}</strong>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>

      {/* 匯出模態窗 */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>選擇匯出格式</h2>
            <div className="export-options">
              <button 
                className="export-btn"
                onClick={() => exportPrompts('flux')}
              >
                <span>⚡ Flux</span>
                <small>最新模型，推薦</small>
              </button>
              <button 
                className="export-btn"
                onClick={() => exportPrompts('sdxl')}
              >
                <span>🎨 SDXL</span>
                <small>穩定擴散</small>
              </button>
              <button 
                className="export-btn"
                onClick={() => exportPrompts('chinese')}
              >
                <span>🇨🇳 中文</span>
                <small>中英對照</small>
              </button>
              <button 
                className="export-btn"
                onClick={() => exportPrompts('json')}
              >
                <span>📄 JSON</span>
                <small>結構化資料</small>
              </button>
            </div>
            <button 
              className="btn btn-outline"
              onClick={() => setShowExportModal(false)}
              style={{marginTop: '20px', width: '100%'}}
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}