// app.jsx - 主應用程式
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// Supabase 初始化
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// 分類配置（暫時先保留，之後可以換成吃資料庫）
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
  return `${prompts.map(p => p?.english_text || '').filter(Boolean).join(', ')}`;
};

// SDXL 提示詞範本
const SDXL_TEMPLATE = (prompts) => {
  return `${prompts.map(p => p?.english_text || '').filter(Boolean).join(', ')} | High quality, detailed, 8k`;
};

// 中文提示詞範本
const CHINESE_TEMPLATE = (prompts) => {
  return prompts
    .map(p => p ? `${p.chinese_text}（${p.english_text}）` : '')
    .filter(Boolean)
    .join(' + ');
};

export default function App() {
  // 原本的 state
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

  // ★ 新增分類用的 state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState(""); // 空字串 = 新的大分類
  const [categoriesFromDb, setCategoriesFromDb] = useState([]); // 從 Supabase 撈回來的 categories

  // 載入資料
  useEffect(() => {
    loadPrompts();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    if (!supabase) {
      console.warn('Supabase not initialized - skipping loadPrompts');
      setLoading(false);
      return;
    }
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
      alert('無法載入提示詞：' + (error?.message || error));
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!supabase) {
      console.warn('Supabase not initialized - skipping loadCategories');
      return;
    }
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Error loading categories:", error);
        return;
      }
      setCategoriesFromDb(data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    if (!supabase) {
      alert('無法新增分類：Supabase 尚未設定');
      return;
    }

    const level = parentCategoryId ? 2 : 1;

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: newCategoryName.trim(),
          parent_id: parentCategoryId || null,
          level,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding category:", error);
        alert("新增分類失敗：" + (error?.message || error));
        return;
      }

      // 清空輸入、重載分類
      setNewCategoryName("");
      setParentCategoryId("");
      await loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('新增分類失敗：' + (error?.message || error));
    }
  };

  // 新增提示詞處理（插入 supabase 並更新本地狀態）
  const handleAddPrompt = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // 簡單驗證
    if (!newPrompt?.english_text?.trim() || !newPrompt?.chinese_text?.trim() || !newPrompt?.category) {
      alert('請填寫必要欄位');
      return;
    }

    if (!supabase) {
      alert('無法新增提示詞：Supabase 尚未設定');
      return;
    }

    try {
      const insertPayload = {
        ...newPrompt,
        english_text: newPrompt.english_text.trim(),
        chinese_text: newPrompt.chinese_text.trim(),
        is_active: true,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('prompts')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;

      setPrompts(prev => [data, ...(prev || [])]);
      setNewPrompt({
        english_text: '',
        chinese_text: '',
        category: '',
        sub_category: '',
        image_url: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding prompt:', error);
      alert('新增提示詞失敗：' + (error?.message || error));
    }
  };

  // 刪除提示詞（建議使用軟刪除，將 is_active 設為 false）
  const handleDeletePrompt = async (id) => {
    if (!id) return;
    if (!window.confirm('確定要刪除這個提示詞嗎？')) return;

    if (!supabase) {
      alert('無法刪除提示詞：Supabase 尚未設定');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('prompts')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 從本地狀態移除
      setPrompts(prev => (prev || []).filter(p => p.id !== id));
      // 也從已選集合移除
      setSelectedPrompts(prev => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    } catch (error) {
      console.error('Error deleting prompt:', error);
      alert('刪除失敗：' + (error?.message || error));
    }
  };

  // 計算篩選後的提示詞
  const filteredPrompts = useMemo(() => {
    const q = (searchText || '').trim().toLowerCase();
    return (prompts || []).filter(p => {
      if (!p) return false;
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterSubCategory && p.sub_category !== filterSubCategory) return false;
      if (q) {
        const hay = `${p.english_text || ''} ${p.chinese_text || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [prompts, filterCategory, filterSubCategory, searchText]);

  const togglePromptSelection = (id) => {
    if (!id) return;
    setSelectedPrompts(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  };

  // 匯出提示詞
  const exportPrompts = async (format) => {
    const selected = Array.from((selectedPrompts || new Set()))
      .map(id => (prompts || []).find(p => p.id === id))
      .filter(Boolean);

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

    const safeExport = String(exportText || '');

    // 優先嘗試使用 Clipboard API
    try {
      if (navigator?.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(safeExport);
        alert('已複製到剪貼簿！');
        setShowExportModal(false);
      } else {
        // fallback: 建立暫時 textarea，選取並複製
        const textarea = document.createElement('textarea');
        textarea.value = safeExport;
        // 避免畫面跳動
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          const ok = document.execCommand('copy');
          if (ok) {
            alert('已複製到剪貼簿（備援方法）！');
            setShowExportModal(false);
          } else {
            throw new Error('execCommand copy failed');
          }
        } finally {
          document.body.removeChild(textarea);
        }
      }
    } catch (err) {
      console.error('Clipboard write failed, falling back to download', err);
      // fallback: 下載檔案
      try {
        const blob = new Blob([safeExport], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'export.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowExportModal(false);
      } catch (downloadErr) {
        console.error('Download fallback failed', downloadErr);
        alert('匯出失敗：' + (downloadErr?.message || downloadErr));
      }
    }

    // 記錄匯出（非阻塞，但加上存在性檢查）
    if (supabase) {
      supabase.from('export_logs').insert([{ export_format: format, selected_prompts: selected.length, exported_text: safeExport }]).catch(console.error);
    }
  };

  if (loading) {
    return <div className="loading">載入中...</div>;
  }

  return (
    <div className="container">
      <header className="header">
        <h3>✨ AI 提示詞管理器</h3>
        <p>管理和匯出 Flux / SDXL 提示詞</p>
      </header>

      <div className="add-category-panel">
        <h3>新增分類 / 子分類</h3>

        <input
          type="text"
          placeholder="分類名稱"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
        />

        <select
          value={parentCategoryId}
          onChange={(e) => setParentCategoryId(e.target.value)}
        >
          <option value="">（建立新的大分類）</option>
          {categoriesFromDb
            .filter((c) => !c.parent_id) // 只列出大分類當作可選的 parent
            .map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
        </select>

        <button onClick={handleAddCategory}>新增</button>
      </div>

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
              {newPrompt.category && CATEGORIES[newPrompt.category] && (
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
            {filterCategory && CATEGORIES[filterCategory] && (
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
                      Array.from(selectedPrompts).map(id => (prompts || []).find(p => p.id === id)).filter(Boolean)
                    )}
                  </div>
                </div>
                <div className="preview-item">
                  <h4>中文</h4>
                  <div className="preview-text">
                    {CHINESE_TEMPLATE(
                      Array.from(selectedPrompts).map(id => (prompts || []).find(p => p.id === id)).filter(Boolean)
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
              const count = (prompts || []).filter(p => p.category === cat).length;
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
