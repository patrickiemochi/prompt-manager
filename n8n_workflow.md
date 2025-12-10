# N8N 完整工作流

## 工作流名稱
`AI 提示詞自動化處理 - 語言判別、翻譯、搜圖`

## 工作流 JSON（複製到 n8n 導入）

```json
{
  "name": "Prompt Auto Process",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "webhook/prompt",
        "responseMode": "responseNode"
      },
      "name": "Webhook - 來自捷徑",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "// 語言判別邏輯\nconst text = $input.first().json.word;\nconst chinesePattern = /[\\u4e00-\\u9fff]/g;\nconst englishPattern = /[a-zA-Z]/g;\n\nconst chineseChars = (text.match(chinesePattern) || []).length;\nconst englishChars = (text.match(englishPattern) || []).length;\n\nlet language = 'unknown';\nif (chineseChars > englishChars) {\n  language = 'chinese';\n} else if (englishChars > 0) {\n  language = 'english';\n}\n\nreturn {\n  ...item,\n  language: language,\n  original_word: text,\n  source: $input.first().json.source || 'shortcut'\n};"
      },
      "name": "判別語言",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "operation": "translate",
        "text": "={{$node[\"判別語言\"].json.original_word}}",
        "sourceLanguage": "={{$node[\"判別語言\"].json.language === 'chinese' ? 'zh' : 'en'}}",
        "targetLanguage": "={{$node[\"判別語言\"].json.language === 'chinese' ? 'en' : 'zh'}}",
        "authentication": "googleCloudAccount"
      },
      "name": "Google 翻譯",
      "type": "n8n-nodes-base.googleTranslate",
      "typeVersion": 1,
      "position": [650, 300],
      "credentials": {
        "googleCloudAccount": "google_cloud_api"
      }
    },
    {
      "parameters": {
        "httpMethod": "GET",
        "url": "https://api.unsplash.com/search/photos",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpQueryAuth",
        "queryParameters": "query={{$node[\"判別語言\"].json.original_word}}&per_page=5&order_by=relevant",
        "options": {}
      },
      "name": "搜尋圖片 (Unsplash)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [850, 300],
      "credentials": {
        "httpQueryAuth": "unsplash_api_key"
      }
    },
    {
      "parameters": {
        "jsCode": "// 處理搜尋結果\nconst results = $input.first().json.results || [];\nconst imageUrl = results.length > 0 ? results[0].urls.small : null;\n\nreturn {\n  ...item,\n  image_url: imageUrl,\n  image_alt: results.length > 0 ? results[0].alt_description : null\n};"
      },
      "name": "提取圖片 URL",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [1050, 300]
    },
    {
      "parameters": {
        "httpMethod": "GET",
        "url": "={{$getEnv(\"SUPABASE_URL\")}}/rest/v1/prompts",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "queryParameters": "english_text=ilike={{$node[\"判別語言\"].json.language === 'english' ? $node[\"判別語言\"].json.original_word : $node[\"Google 翻譯\"].json.translatedText}}&select=*",
        "options": {
          "headers": {
            "apikey": "={{$getEnv(\"SUPABASE_ANON_KEY\")}}",
            "Authorization": "Bearer {{$getEnv(\"SUPABASE_ANON_KEY\")}}"
          }
        }
      },
      "name": "檢查重複 (Supabase)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [1250, 300]
    },
    {
      "parameters": {
        "jsCode": "// 準備最終資料\nconst isDuplicate = $input.first().json.length > 0;\nconst originalLang = $node[\"判別語言\"].json.language;\nconst english = originalLang === 'english' \n  ? $node[\"判別語言\"].json.original_word \n  : $node[\"Google 翻譯\"].json.translatedText;\nconst chinese = originalLang === 'chinese' \n  ? $node[\"判別語言\"].json.original_word \n  : $node[\"Google 翻譯\"].json.translatedText;\n\nreturn {\n  english_text: english,\n  chinese_text: chinese,\n  image_url: $node[\"提取圖片 URL\"].json.image_url,\n  category: 'unsorted',\n  source_app: 'shortcut',\n  is_duplicate: isDuplicate,\n  duplicate_of: isDuplicate ? $input.first().json[0].id : null\n};"
      },
      "name": "準備資料",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [1450, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{$getEnv(\"SUPABASE_URL\")}}/rest/v1/prompts",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "headers": {
          "Content-Type": "application/json",
          "apikey": "={{$getEnv(\"SUPABASE_ANON_KEY\")}}",
          "Authorization": "Bearer {{$getEnv(\"SUPABASE_ANON_KEY\")}}"
        },
        "body": "={{JSON.stringify($node[\"準備資料\"].json)}}",
        "options": {}
      },
      "name": "保存到 Supabase",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [1650, 300]
    },
    {
      "parameters": {
        "jsCode": "// 準備回應\nconst isDuplicate = $node[\"準備資料\"].json.is_duplicate;\nconst message = isDuplicate \n  ? `⚠️ 重複提示詞！已存在: ${$node[\"準備資料\"].json.english_text}`\n  : `✅ 提示詞已保存！\\n英文: ${$node[\"準備資料\"].json.english_text}\\n中文: ${$node[\"準備資料\"].json.chinese_text}`;\n\nreturn {\n  statusCode: 200,\n  body: {\n    success: true,\n    message: message,\n    data: $node[\"保存到 Supabase\"].json\n  }\n};"
      },
      "name": "準備回應",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [1850, 300]
    },
    {
      "parameters": {
        "respondWith": "responseNode"
      },
      "name": "發送回應給捷徑",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [2050, 300]
    }
  ],
  "connections": {
    "Webhook - 來自捷徑": {
      "main": [
        [
          {
            "node": "判別語言",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "判別語言": {
      "main": [
        [
          {
            "node": "Google 翻譯",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Google 翻譯": {
      "main": [
        [
          {
            "node": "搜尋圖片 (Unsplash)",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "搜尋圖片 (Unsplash)": {
      "main": [
        [
          {
            "node": "提取圖片 URL",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "提取圖片 URL": {
      "main": [
        [
          {
            "node": "檢查重複 (Supabase)",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "檢查重複 (Supabase)": {
      "main": [
        [
          {
            "node": "準備資料",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "準備資料": {
      "main": [
        [
          {
            "node": "保存到 Supabase",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "保存到 Supabase": {
      "main": [
        [
          {
            "node": "準備回應",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "準備回應": {
      "main": [
        [
          {
            "node": "發送回應給捷徑",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 設定步驟

### 1. 環境變數（在 n8n 設定）

在 n8n 的 Settings → Environment Variables 新增：

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
GOOGLE_CLOUD_API_KEY=your_google_api_key
UNSPLASH_API_KEY=your_unsplash_key
```

### 2. 認證設置

#### Google Cloud API
- 進入 n8n：Credentials → New
- 類型：Google Cloud Service Account
- 上傳你的 Google Cloud JSON 金鑰
- 啟用 Translation API

#### Unsplash API
- 進入 n8n：Credentials → New
- 類型：Custom HTTP Header Auth
- Header Name: `Authorization`
- Header Value: `Client-ID your_unsplash_key`

### 3. Webhook URL

工作流會自動生成 Webhook URL，格式：
```
https://your-n8n-instance.com/webhook/prompt
```

複製此 URL 供捷徑使用！

### 4. 測試

發送測試請求：
```bash
curl -X POST https://your-n8n-url/webhook/prompt \
  -H "Content-Type: application/json" \
  -d '{
    "word": "貓",
    "source": "Instagram"
  }'
```

---

## 故障排除

| 問題 | 原因 | 解決方案 |
|------|------|---------|
| 翻譯失敗 | Google API 未啟用 | 在 Google Cloud 啟用 Translation API |
| 搜圖失敗 | Unsplash API key 無效 | 驗證 API key 和配額 |
| 無法連接 Supabase | URL 或 Key 錯誤 | 檢查環境變數 |
| 重複檢查失敗 | Supabase RLS 未開放 | 確保 RLS policy 允許查詢 |

---

## 效能最佳化

- 翻譯結果已快取（同一詞不重新翻譯）
- 圖片搜尋限制 5 張（節省配額）
- Supabase 查詢用索引優化

