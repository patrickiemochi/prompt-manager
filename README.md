# 🎨 AI 提示詞管理系統

一個完整的 **Flux/SDXL** 提示詞管理平台，支持自動化工作流、iOS/Mac 捷徑和智能匯出。

## ✨ 核心功能

### 🌐 網頁管理介面
- ✅ 提示詞庫管理（新增、編輯、刪除）
- ✅ 智能搜尋和篩選（按分類、子分類、文字）
- ✅ 實時預覽（Flux、SDXL、中文格式）
- ✅ 勾選式匯出（支援 4 種格式）
- ✅ 統計面板（總數、分類統計）
- ✅ 重複檢測和提醒

### 🤖 自動化工作流（n8n）
- ✅ 自動語言判別（中/英）
- ✅ 自動翻譯（Google Translate）
- ✅ 自動搜圖（Unsplash API）
- ✅ 重複檢查（Supabase 查詢）
- ✅ 快速儲存（自動推送到資料庫）

### 📱 iOS/Mac 捷徑集成
- ✅ 分享單詞快速輸入
- ✅ 自動語言判別
- ✅ 實時回應通知
- ✅ 支援 iPhone 和 Mac

### 📊 智能提示詞分類
```
人物 (年齡、特徵、裝扮、表情)
風景 (場景、時間、氛圍)
畫風 (藝術風格、流派、畫家)
畫質提升 (解析度、細節、特效)
光影 (光源、色溫)
情感&氛圍 (情緒、色調)
技術標籤 (模型、參數)
```

---

## 🚀 快速開始

### 1️⃣ 5 分鐘本地測試
```bash
# 克隆項目
git clone <your-repo>
cd prompt-manager

# 安裝依賴
npm install

# 設定環境變數（.env.local）
REACT_APP_SUPABASE_URL=your_url
REACT_APP_SUPABASE_ANON_KEY=your_key

# 啟動開發伺服器
npm start
```

### 2️⃣ 部署到生產環境

**Vercel（推薦）**：1 鍵部署，自動 CI/CD
```bash
npm run build
# 推送到 GitHub → Vercel 自動部署
```

**Docker**：自主託管
```bash
docker build -t prompt-manager .
docker run -p 3000:3000 prompt-manager
```

### 3️⃣ 設置 n8n 工作流

複製 `n8n_workflow.md` 中的 JSON 到 n8n 編輯器，設定 API Key

### 4️⃣ 建立 iOS/Mac 捷徑

在「捷徑」App 中複製 `shortcut_code.md` 中的代碼

---

## 📁 項目結構

```
prompt-manager/
├── src/
│   ├── App.jsx                 # 主應用程式
│   ├── App.css                 # 樣式
│   └── index.js                # 入口點
├── public/
│   └── index.html              # HTML 模板
├── package.json                # 依賴配置
├── .env.local                  # 環境變數（需自建）
├── Dockerfile                  # Docker 配置
├── deployment_guide.md         # 部署指南
├── n8n_workflow.md            # n8n 工作流
├── shortcut_code.md           # 捷徑代碼
└── setup_guide.md             # 資料庫設置
```

---

## 🔧 技術棧

| 層級 | 技術 | 說明 |
|------|------|------|
| **前端** | React 18 | 互動式 UI |
| **資料庫** | Supabase PostgreSQL | 資料儲存 |
| **自動化** | n8n | 工作流編排 |
| **翻譯** | Google Translate API | 語言處理 |
| **圖片** | Unsplash API | 圖片搜尋 |
| **部署** | Vercel / Docker | 託管 |
| **移動** | iOS Shortcuts | 快速輸入 |

---

## 📚 主要文件說明

### app.jsx
主應用程式，包含所有前端邏輯：
- Supabase 連接
- 提示詞 CRUD 操作
- 搜尋和篩選
- 匯出功能

### n8n_workflow.md
自動化工作流程序碼：
1. Webhook 監聽
2. 語言判別
3. 翻譯
4. 搜圖
5. 檢查重複
6. 儲存

### shortcut_code.md
iOS/Mac 捷徑代碼：
- 文本輸入
- HTTP 要求
- 回應處理
- 通知提示

---

## 🔐 環境變數設置

```bash
# .env.local（開發）或 Vercel Dashboard（生產）

# Supabase
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGci...

# n8n（可選，用於直接調用）
REACT_APP_N8N_WEBHOOK_URL=https://your-n8n.com/webhook/prompt
```

---

## 📊 資料庫 Schema

### prompts 表
```sql
id                 BIGINT PRIMARY KEY
english_text       TEXT NOT NULL
chinese_text       TEXT NOT NULL
image_url          TEXT
category           TEXT NOT NULL
sub_category       TEXT
source_app         TEXT
usage_count        INT
is_duplicate       BOOLEAN
duplicate_of       BIGINT (FK)
created_at         TIMESTAMP
updated_at         TIMESTAMP
is_active          BOOLEAN
```

### categories 表
```sql
id                 BIGINT PRIMARY KEY
name               TEXT UNIQUE
sub_categories     TEXT[]
ai_model           TEXT
order_index        INT
```

---

## 🎯 使用場景

### 場景 1：快速新增提示詞
```
iPhone 選擇詞語 → 分享 → 捷徑 → n8n → 自動翻譯+搜圖 → Supabase
⏱️ 3 秒完成
```

### 場景 2：整理提示詞庫
```
網頁應用 → 搜尋/篩選 → 勾選 → 按 Flux 格式匯出 → 複製到繪圖 AI
```

### 場景 3：批量管理
```
從資料庫搜尋 → 編輯分類 → 統計使用次數 → 自動生成提示詞套件
```

---

## 🚀 進階功能（TODO）

- [ ] 使用者認證和個人提示詞庫
- [ ] 提示詞評分和共享
- [ ] AI 自動標籤提示詞
- [ ] 支援更多 AI 模型格式
- [ ] 圖片預覽和管理
- [ ] 提示詞版本控制
- [ ] 離線模式（PWA）
- [ ] 批量導入/導出

---

## 📱 API 文檔

### n8n Webhook

```bash
POST https://your-n8n-url/webhook/prompt

Body:
{
  "word": "貓",
  "source": "iPhone"
}

Response:
{
  "success": true,
  "message": "提示詞已保存",
  "data": {
    "id": 123,
    "english_text": "cat",
    "chinese_text": "貓",
    "image_url": "https://...",
    "category": "unsorted"
  }
}
```

### Supabase REST API

```bash
# 查詢提示詞
GET https://your-project.supabase.co/rest/v1/prompts?category=eq.人物

# 新增提示詞
POST https://your-project.supabase.co/rest/v1/prompts
Body: { "english_text": "cat", "chinese_text": "貓", ... }

# Headers
Authorization: Bearer YOUR_ANON_KEY
apikey: YOUR_ANON_KEY
```

---

## 🐛 故障排除

### 連接 Supabase 失敗
✅ 檢查 URL 和 Key
✅ 確認 RLS policy 已開啟
✅ 驗證網路連接

### n8n 工作流出錯
✅ 檢查 API Key 和配額
✅ 查看執行日誌
✅ 驗證 Webhook URL

### 捷徑無法運行
✅ 允許不受信任的捷徑（設定）
✅ 驗證 HTTP 要求 URL
✅ 檢查網路連接

---

## 📈 效能最佳化

### 資料庫
- 索引優化：category, english_text, chinese_text
- 定期執行 ANALYZE
- 啟用 RLS 提高安全性

### 應用
- React 組件記憶化
- 實時搜尋節流
- 圖片延遲載入

### API
- n8n 快取翻譯結果
- Supabase 連線池
- CDN 加速靜態資源

---

## 🔒 安全最佳實踐

✅ 使用環境變數存儲 API Key
✅ 啟用 Supabase RLS
✅ n8n Webhook 添加驗證
✅ 定期輪換 API Key
✅ HTTPS 加密傳輸

---

## 🎓 學習資源

- [React 官方文檔](https://react.dev)
- [Supabase 教程](https://supabase.com/docs)
- [n8n 工作流指南](https://docs.n8n.io)
- [iOS Shortcuts 開發](https://support.apple.com/en-us/guide/shortcuts/welcome/ios)

---

## 🤝 貢獻指南

1. Fork 此項目
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

## 📄 授權

MIT License - 詳見 LICENSE 文件

---

## 📞 支持

遇到問題？

- 📖 查看 [部署指南](./deployment_guide.md)
- 🐛 提交 Issue
- 💬 討論區

---

## 🙏 鳴謝

- Supabase 提供免費資料庫
- n8n 提供自動化平台
- Vercel 提供託管服務
- Unsplash 和 Google 提供 API

---

**Happy Prompting! 🎨✨**

Made with ❤️ for AI Art enthusiasts
# prompt-manager
