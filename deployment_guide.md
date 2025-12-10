# 🚀 完整部署指南

這個指南將幫助你在 30 分鐘內部署整個系統！

---

## 📋 前置準備（10 分鐘）

### 1. 建立 Supabase 帳戶
```
https://supabase.com
用 GitHub 登入 → 建立新 Project → Free Plan
```

### 2. 取得 API Keys
- **Supabase**: Project URL + Anon Key（Settings → API）
- **Google Cloud**: 啟用 Translation API，下載 JSON 金鑰
- **Unsplash**: 申請 Free Developer 帳戶，取得 Access Key

### 3. 建立 Supabase 資料庫
在 Supabase SQL Editor 中執行 `setup_guide.md` 中的 SQL

---

## 🌐 方案 A：Vercel 部署（最簡單，推薦）

### 步驟 1：準備 GitHub Repo

```bash
# 1. 新建文件夾
mkdir prompt-manager
cd prompt-manager

# 2. 初始化 Git
git init
git add .
git commit -m "Initial commit"

# 3. 推送到 GitHub
# 在 GitHub 建立新 repo，然後：
git remote add origin https://github.com/YOUR_USERNAME/prompt-manager.git
git branch -M main
git push -u origin main
```

### 步驟 2：Vercel 部署

```
1. 進入 https://vercel.com
2. 用 GitHub 帳戶登入
3. 點擊「Import Project」
4. 選擇你的 prompt-manager repo
5. 在環境變數中設定：
   - REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   - REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
6. 點擊「Deploy」
```

**完成！** 你的網站會在 `https://prompt-manager.vercel.app` 上線

---

## 🐳 方案 B：Docker 部署（自己的服務器）

### 步驟 1：建立 Dockerfile

```dockerfile
# 複製下面的內容到 Dockerfile（項目根目錄）

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/build ./build
EXPOSE 3000

ENV REACT_APP_SUPABASE_URL=${REACT_APP_SUPABASE_URL}
ENV REACT_APP_SUPABASE_ANON_KEY=${REACT_APP_SUPABASE_ANON_KEY}

CMD ["serve", "-s", "build", "-l", "3000"]
```

### 步驟 2：在 Mac mini 上部署

```bash
# 1. 確保已安裝 Docker
# 如果沒有：brew install docker

# 2. 進入項目目錄
cd /path/to/prompt-manager

# 3. 構建 Docker 映像
docker build \
  --build-arg REACT_APP_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg REACT_APP_SUPABASE_ANON_KEY=your_key \
  -t prompt-manager:latest .

# 4. 運行容器
docker run -d \
  -p 3000:3000 \
  -e REACT_APP_SUPABASE_URL=https://your-project.supabase.co \
  -e REACT_APP_SUPABASE_ANON_KEY=your_key \
  --name prompt-manager \
  prompt-manager:latest

# 5. 驗證
curl http://localhost:3000
```

**完成！** 訪問 `http://localhost:3000` 查看應用

---

## 🔧 n8n 工作流部署（15 分鐘）

### 選項 1：n8n Cloud（最簡單）

```
1. 進入 https://n8n.cloud
2. 登錄或註冊
3. 建立新工作流
4. 複製 n8n_workflow.md 中的 JSON
5. 在 n8n Editor 中：
   - 點擊「Import」
   - 粘貼 JSON
   - 設定環境變數（見下方）
   - 點擊「Save」和「Activate」
```

### 選項 2：自建 n8n（Docker）

```bash
# 在 Mac mini 上
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e NODE_ENV=production \
  n8nio/n8n

# 訪問 http://localhost:5678
# 建立帳戶 → 匯入工作流 JSON
```

### 設定環境變數

在 n8n Dashboard → Settings → Environment Variables：

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
GOOGLE_CLOUD_API_KEY=your_google_key
UNSPLASH_API_KEY=your_unsplash_key
```

### 設定認證

1. **Google Cloud**
   - n8n → Credentials → New
   - Type: Google Cloud Service Account
   - 上傳 JSON 金鑰

2. **Unsplash**
   - n8n → Credentials → New
   - Type: Custom API Key
   - Header Name: Authorization
   - Value: Client-ID your_key

---

## 📱 iOS/Mac 捷徑設置（5 分鐘）

### 快速方法

1. 打開 iPhone/Mac 的「捷徑」App
2. 創建新捷徑
3. 複製 `shortcut_code.md` 中的代碼
4. **重要**：將 Webhook URL 替換為你的 n8n Webhook URL
5. 保存並測試

### 取得 n8n Webhook URL

```
在 n8n 中：
1. 進入你的工作流
2. 點擊「Webhook」節點
3. 複製「Webhook URL」
4. 粘貼到捷徑中
```

---

## ✅ 整個系統測試清單

### 資料庫測試
```bash
# Supabase 中執行
SELECT * FROM prompts LIMIT 1;
```

### API 測試
```bash
curl -X POST https://your-n8n-url/webhook/prompt \
  -H "Content-Type: application/json" \
  -d '{"word":"test","source":"cli"}'
```

### 網頁應用測試
```
1. 訪問 https://your-app.vercel.app
2. 新增一個提示詞
3. 勾選並匯出
4. 確認格式正確
```

### 捷徑測試
```
1. 打開捷徑 App
2. 執行「提示詞到 AI」
3. 輸入「貓」
4. 等待回應
5. 檢查 Supabase 資料庫確認資料已保存
```

---

## 🔒 安全性建議

### 1. Supabase 行級安全（RLS）

```sql
-- 添加使用者認證（可選）
CREATE POLICY "Users can view own prompts" ON prompts
  FOR SELECT USING (
    auth.uid() = user_id OR TRUE
  );
```

### 2. n8n 認證

- 設定強密碼
- 啟用雙因素認證
- 限制 Webhook 訪問（使用 IP 白名單）

### 3. API 密鑰管理

- 不要在代碼中硬編碼密鑰
- 使用環境變數
- 定期輪換 API 密鑰
- 使用 Supabase 的限制權限

---

## 📊 監控和維護

### 查看 n8n 日誌
```bash
# Docker
docker logs -f n8n

# 或在 n8n UI 中查看執行歷史
```

### Supabase 監控
- 進入 Supabase Dashboard
- 檢查 Database → Logs
- 查看執行統計

### 應用監控
- Vercel: 進入 Dashboard → Analytics
- Docker: 使用 `docker stats`

---

## 🐛 常見問題排除

| 問題 | 解決方案 |
|------|---------|
| "Cannot find module '@supabase/supabase-js'" | 運行 `npm install` |
| Webhook URL 不正確 | 確認 n8n 已啟動，複製完整 URL |
| 連接 Supabase 失敗 | 檢查 URL 和 Key，確認 RLS policy |
| Docker 無法啟動 | 檢查端口 3000 是否被佔用 |
| 翻譯失敗 | 驗證 Google API Key 和配額 |

---

## 📈 性能最佳化

### 資料庫優化
```sql
-- 已添加索引（在 setup_guide.md 中）
-- 確保 RLS policy 高效

-- 定期執行統計
ANALYZE;
```

### Supabase 緩存
```
在 Vercel 環境變數中添加：
REACT_APP_CACHE_TIME=3600
```

### n8n 優化
- 啟用「保存執行資料」選項（節省存儲）
- 設定定期清理舊日誌

---

## 🚀 下一步

### 功能擴展
1. 添加使用者認證
2. 建立提示詞分享功能
3. 支援 Midjourney、Stable Diffusion 等格式
4. 添加提示詞評分系統

### 效能改進
1. 啟用 Redis 緩存
2. 實現圖片壓縮
3. 添加 CDN

### 自動化增強
1. 定期備份 Supabase
2. 添加錯誤告警（Slack/Telegram）
3. 統計和分析

---

## 📞 需要幫助？

如果在部署過程中遇到問題：

1. **檢查日誌**
   - Vercel: Deployments → Logs
   - Docker: `docker logs container_name`
   - n8n: 檢查執行歷史

2. **驗證配置**
   - 所有環境變數已正確設定
   - API Keys 有效且未過期
   - Webhook URL 正確

3. **測試連接**
   - Ping Supabase
   - 測試 n8n Webhook
   - 驗證捷徑 HTTP 請求

---

**恭喜！系統已完成部署 🎉**

現在你可以：
- 在 iPhone/Mac 快速新增提示詞
- 自動翻譯和搜尋圖片
- 在網頁上管理和匯出
- 支援 Flux、SDXL 等 AI 模型
