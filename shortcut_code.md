# iOS/Mac 捷徑代碼

## 📱 如何建立捷徑

### 第一步：開啟「捷徑」App
- iPhone: 設定 → 應用程式 → 捷徑
- Mac: 應用程式 → 捷徑

### 第二步：新增捷徑
1. 點擊「+」建立新捷徑
2. 複製下面的 JSON 到捷徑編輯器

---

## 📋 捷徑 #1：在 iPhone 上分享單詞（推薦）

### 使用方法
1. 在任何 App 中選擇單詞
2. 點擊「分享」→ 選擇「提示詞到 AI」
3. 自動發送到 n8n，等待回應

### 捷徑代碼（複製整個文本）

```
名稱: 提示詞到 AI

動作清單:
1. 詢問文本「輸入提示詞或分享一個單詞」
2. 設定變數 word = 回答文本
3. 設定變數 n8n_webhook = "https://your-n8n-instance.com/webhook/prompt"
4. HTTP 要求
   - 方法: POST
   - URL: 變數 n8n_webhook
   - Headers:
     - Content-Type: application/json
   - Body (Raw):
     {
       "word": "<word>",
       "source": "iPhone"
     }
5. 等待回應
6. 設定變數 response = HTTP 回應結果
7. 顯示結果:
   成功 ✅: "{{response.statusCode}}" 等於 200
   - 顯示警告「成功」
     訊息: "{{response.body.message}}"
   不成功:
   - 顯示警告「錯誤」
     訊息: "{{response.body.message}}"
```

---

## 🔗 捷徑 #2：從選中文字快速分享（Mac）

### 使用方法
- Mac: 選擇文字 → 右鍵 → 「快速動作」→ 「提示詞到 AI」

### 捷徑代碼

```
名稱: 提示詞到 AI (快速動作)

接收類型: 文本

動作清單:
1. 接收來自「快速動作」的文本作為 selectedText
2. 設定變數 webhook_url = "https://your-n8n-instance.com/webhook/prompt"
3. 設定變數 word = selectedText
4. 設定變數 device = "Mac"
5. HTTP 要求
   - 方法: POST
   - URL: 變數 webhook_url
   - Headers:
     - Content-Type: application/json
   - Body:
     {
       "word": "<word>",
       "source": "<device>"
     }
6. 等待 3 秒
7. 顯示結果通知
```

---

## 📲 通用 JSON 代碼（複製到快捷方式 App）

如果上述方法不清楚，直接複製以下 JSON 到你的捷徑編輯器：

```json
{
  "WFWorkflowVersion": 2,
  "WFWorkflowMinimumClientRelease": 1050.0,
  "WFWorkflowMinimumClientReleaseString": "1050.0",
  "WFWorkflowMinimumVersion": 1,
  "WFWorkflowImportQuestions": [],
  "WFWorkflowClientVersion": 2315.2,
  "WFWorkflowClientRelease": "Siri Shortcuts 17.4",
  "shortcutItems": [
    {
      "WFSerializationType": "WFAppStore",
      "string": "com.apple.shortcuts",
      "elementIdentifier": "cf00bcf7-e79a-4236-8b1c-89fb5d5e4e9f"
    }
  ],
  "WFWorkflowActions": [
    {
      "WFSerializationType": "WFAskForTextAction",
      "WFInput": {
        "string": "",
        "string": ""
      }
    },
    {
      "WFSerializationType": "WFSetVariableAction",
      "WFVariableName": "word"
    },
    {
      "WFSerializationType": "WFSetVariableAction",
      "WFVariableName": "webhook_url",
      "WFInput": {
        "string": "https://your-n8n-instance.com/webhook/prompt",
        "string": ""
      }
    },
    {
      "WFSerializationType": "WFGetVariableAction",
      "WFVariableName": "webhook_url"
    },
    {
      "WFSerializationType": "WFHTTPRequest",
      "WFRequest": {
        "WFURL": {
          "string": "https://your-n8n-instance.com/webhook/prompt",
          "string": ""
        },
        "WFHTTPMethod": "POST",
        "WFHTTPHeaders": {
          "Content-Type": "application/json"
        },
        "WFRequestBody": "{\"word\": \"{{word}}\", \"source\": \"iPhone\"}"
      }
    },
    {
      "WFSerializationType": "WFShowResultAction",
      "WFText": {
        "string": "✅ 提示詞已發送到 AI！",
        "string": ""
      }
    }
  ]
}
```

---

## 🛠️ 手動設置指南（如果上面的方法不行）

如果你想從頭開始手動建立捷徑，按照這些步驟：

### 步驟 1：建立提示詞輸入
- **動作**：「詢問文本」
- **問題**：「輸入提示詞」
- **提供預設答案**：勾選
- **預設值**：（留空）

### 步驟 2：建立 HTTP 請求
- **動作**：「HTTP 要求」
- **方法**：POST
- **URL**：`https://your-n8n-instance.com/webhook/prompt`
- **請求正文**：Raw JSON
```json
{
  "word": "{{提問文本的結果}}",
  "source": "iPhone"
}
```

### 步驟 3：處理回應
- **動作**：「詢問是否繼續」
- **問題**：「提示詞已發送！檢查你的資料庫。」

### 步驟 4：完成
- **動作**：「顯示結果」

---

## 🔄 進階：語音輸入版本

想要用語音輸入？添加這個動作在「詢問文本」之前：

```
動作：要求 Siri 聽寫
將結果存到變數 "word"
```

---

## 📍 替換 Webhook URL

⚠️ **重要**：將所有的 `https://your-n8n-instance.com/webhook/prompt` 替換為你的實際 n8n Webhook URL

取得方法：
1. 在 n8n 中，進入你建立的工作流
2. 點擊「Webhook」節點
3. 複製顯示的 URL
4. 粘貼到捷徑中

---

## ✅ 測試捷徑

1. 開啟捷徑 App
2. 點擊「提示詞到 AI」
3. 輸入測試單詞：「貓」
4. 應該看到成功通知
5. 檢查你的 Supabase 資料庫，確認資料已保存

---

## 🐛 常見問題

| 問題 | 原因 | 解決方案 |
|------|------|---------|
| 「無法連接伺服器」 | URL 錯誤或 n8n 不在線 | 驗證 Webhook URL，確保 n8n 運行中 |
| 沒有回應 | Webhook URL 不正確 | 複製完整的 URL，不要遺漏任何部分 |
| 捷徑無法執行 | iPhone 上未開啟快捷方式權限 | 設定 → 快捷方式 → 允許不受信任的捷徑 |
| 中文顯示亂碼 | 編碼問題 | 確保 n8n 返回 UTF-8 編碼 |

---

## 🚀 額外功能

### 自動保存到備忘錄
在捷徑最後添加：
```
動作：添加到「備忘錄」
選擇 App：備忘錄
文本：「{{回應結果}}」
```

### 發送到 Telegram（可選）
如果你想在 Telegram 接收通知：
```
動作：HTTP 要求
URL：https://api.telegram.org/bot{YOUR_BOT_TOKEN}/sendMessage
方法：POST
Body：
{
  "chat_id": "{YOUR_CHAT_ID}",
  "text": "新提示詞: {{word}}"
}
```

---

## 💡 提示

1. **在 iPhone 上分享文本**：長按 → 分享 → 快捷方式 → 「提示詞到 AI」
2. **在 Mac 上使用**：可以設置為快速動作，右鍵即可使用
3. **重複提醒**：如果重複了，捷徑會顯示警告
4. **批量輸入**：可以一次輸入多個詞用逗號分隔，n8n 會逐個處理

