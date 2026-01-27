# 後端技術規格書 (Phase 10.14)

## 1. 概述 (Overview)

本文件定義了 **Aggregator Platform (聚合平台)** 的後端架構、API 規格與資料模型。涵蓋範圍包括 **Master Admin (總控端)** 與 **Merchant Portal (商戶端)** 兩大領域。

## 2. 核心領域與職責 (Core Domains & Responsibilities)

### 2.1 Master Admin 領域 (總控端)

* **商戶管理 (Merchant Management)**：建立、配置與管理商戶帳號。
* **資金管理 (Fund Management)**：審核充值、額度申請及手動調整餘額。
* **遊戲中心 (Game Center)**：管理遊戲庫、維護狀態及 RTP 設定。
* **財務與帳單 (Finance & Invoices)**：生成月度帳單並追蹤付款狀態。

### 2.2 Merchant 領域 (商戶端)

* **儀表板 (Dashboard)**：即時 KPI、趨勢圖與警示通知。
* **遊戲管理 (Game Management)**：檢視可用遊戲及 RTP 設定。
* **報表中心 (Report Center)**：營收報表、投注記錄與交易明細。
* **錢包與財務 (Wallet & Finance)**：檢視餘額、申請額度/充值及支付帳單。
* **代理管理 (Agent Management)**：管理下級代理與佣金結構 (Part 4)。

## 3. 資料模型 (Data Models)

### 3.1 商戶與代理 (`Merchant`, `Agent`)

```typescript
interface Merchant {
    id: number;
    display_id: string;      // 例如："OP-1001"
    name: string;
    currency_type: string;   // "USD", "CNY", "TWD"
    walletMode: 'transfer' | 'seamless';
    revenue_share: number;   // 分潤百分比 (0-100)
    ipWhitelist: string[];
    secretKey: string;
    balance?: string;        // 僅轉帳錢包模式使用 (String for precision)
    credit_limit?: string;   // (String for precision)
}

interface Agent {
    id: number;
    account: string;         // 使用者名稱
    level: number;           // 層級 (1, 2, 3...)
    parent_id: number | null;
    balance: string;         // (String for precision)
    commission_rate: number; // 下級代理佣金率
    state: 'active' | 'disabled';
}
```

### 3.2 資金與財務 (`FundRecord`, `Invoice`)

```typescript
type FundType = 'top-up' | 'credit-limit' | 'manual-adjust';
type FundStatus = 'pending' | 'approved' | 'rejected';

interface FundRecord {
    id: string;
    merchant_id: string;
    type: FundType;          // top-up (充值) | credit-limit (額度) | manual-adjust (手動調整)
    amount: string;          // 充值金額 或 新額度 (String)
    proof?: string;          // 充值證明 (截圖 URL)
    status: FundStatus;
    reviewer?: string;
    created_at: string;
}

interface Invoice {
    id: string;              // 例如："INV-OP1-202510-001"
    period: string;          // "YYYY-MM"
    total_ggr: string;       // (String)
    commission_rate: number;
    amount_due: string;      // 應付金額 (String)
    status: 'pending' | 'paid' | 'verifying';
    payment_proof?: string;  // 付款證明
    breakdown: Array<{ provider: string; ggr: string; amount: string }>;
}
```

## 4. API 合約細節 (API Contracts)

### 4.1 建立商戶 (Create Merchant)

* **Endpoint**: `POST /api/admin/merchants`
* **Request Body**:

    ```json
    {
        "name": "Golden Dragon Casino",
        "currency_type": "USD", // 必填, 預設 USD
        "walletMode": "transfer", // 必填, 'transfer' | 'seamless'
        "revenue_share": 15.0, // 必填, 0-100
        "admin_username": "admin_gd",
        "admin_password": "Password123!" // 至少 8 碼含大小寫
    }
    ```

* **Response Body**:

    ```json
    {
        "code": 0,
        "msg": "success",
        "data": {
            "id": 1001,
            "display_id": "OP-1001",
            "secretKey": "sk_live_..."
        }
    }
    ```

### 4.2 提交充值 (Top-up)

* **Endpoint**: `POST /api/v2/merchant/wallet/top-up`
* **Request Body**:

    ```json
    {
        "amount": "10000.00", // 必填, String, > 0
        "proof": "https://storage.example.com/receipts/txn_123.jpg", // 必填
        "remarks": "Bank Transfer #9988"
    }
    ```

* **Response**: `200 OK` (Payload: `code: 0`)

### 4.3 生成報表 (Generate Report)

* **Endpoint**: `GET /api/v2/merchant/reports/daily`
* **Query Params**:
  * `startDate`: `2025-01-01` (必填)
  * `endDate`: `2025-01-31` (必填)
  * `currency`: `USD` (選填，若商戶支援多幣種)
* **Response Body**:

    ```json
    {
        "code": 0,
        "msg": "success",
        "data": {
            "summary": {
                "total_bet": "500000.00",
                "total_win": "480000.00",
                "ggr": "20000.00"
            },
            "items": [
                {
                    "date": "2025-01-01",
                    "total_bet": "15000.00",
                    "ggr": "1200.00",
                    "children": [...] // 巢狀分類 (Slot, Live)
                }
            ]
        }
    }
    ```

### 4.4 報表查詢通用規範 (Report Query Standards)

所有報表查詢 API (如 `daily`, `games`, `invoices`) 的日期範圍參數 (`startDate`, `endDate`) 必須遵循以下時區規範，以確保資料一致性：

* **時區基準 (Timezone Basis)**:
  * 預設情況下，系統將根據 **商戶設定的時區 (Merchant Timezone)** 解析日期字串 (e.g., `2025-01-01` 視為商戶當地時間 00:00:00)。
  * 若需指定絕對時間，Client 端**必須**使用 **ISO-8601** 格式 (e.g., `2025-01-01T00:00:00+08:00`)。
* **跨日處理**:
  * 查詢區間包含 `startDate` (00:00:00) 與 `endDate` (23:59:59)。
  * 系統內部統一轉換為 UTC 儲存與比對，但在 API 回傳時，日 aggregations (如每日報表) 將依據商戶時區聚合。

## 5. 安全性標準 (Security Standards)

### 5.1 簽章機制 (Signature Scheme)

所有 B2B 介接 (Seamless Wallet, Game Launch) 必須驗證簽章。

* **演算法**: `HMAC-SHA256`
* **規則**:
    1. 將所有參數按字母順序排序 (Key A-Z)。
    2. 將參數串接為 `key=value&key2=value2` 字串。
    3. 在字串末尾附加 Secret Key: `...&keyN=valueN&key=SECRET_KEY`。
    4. 進行 SHA256 Hash。
* **Header**: `X-Signature: <hash_value>`

### 5.2 併發控制 (Concurrency)

* **資金操作**: 所有涉及餘額變動的 API (充值、轉帳、下注、派彩) 必須使用 **資料庫交易 (DB Transaction)**。
* **鎖定策略**: 使用 **悲觀鎖 (SELECT FOR UPDATE)** 鎖定商戶/玩家錢包記錄，防止 Race Condition 導致的雙重花費 (Double Spending)。
* **冪等性 (Idempotency)**: 所有資金 API 需支援 `Idempotency-Key` Header，確保同一請求不被重複執行。

## 6. 資料精確度規範 (Data Precision)

* **儲存 (Storage)**:
  * 資料庫金額欄位一律使用 `DECIMAL(18, 4)` 或 `BIGINT` (單位：分/Cent)。
  * **嚴禁** 使用 `FLOAT` 或 `DOUBLE` 儲存金額。
* **傳輸 (API)**:
  * API JSON payload 中的金額欄位一律使用 **字串 (String)** (例如: `"100.00"`)。
  * 前端接收後再使用 `Big.js` 或 `Decimal.js` 進行運算與顯示。

## 7. 錯誤代碼表 (Business Error Codes)

| Code | Message | 描述 |
| :--- | :--- | :--- |
| `0` | Success | 操作成功。 |
| `1001` | Insufficient Balance | 餘額不足 (錢包操作)。 |
| `1002` | Transaction Not Found | 查無此交易。 |
| `1003` | Duplicate Transaction | 交易 ID 重複 (冪等性擋下)。 |
| `2001` | Invalid Signature | 簽章驗證失敗。 |
| `2002` | Merchant Disabled | 商戶已被停用。 |
| `2003` | IP Not Whitelisted | 來源 IP 不在白名單內。 |
| `3001` | Game Maintenance | 遊戲維護中。 |
| `3002` | Bet Limit Exceeded | 超出單注限額。 |
| `4001` | Invalid Date Range | 日期範圍無效或過長。 |
| `5000` | System Busy | 系統繁忙 (併發鎖定超時)。 |

## 8. 遊戲交易介接規格 (Game Transaction Interfaces)

### 8.1 Provider Callback API (接收遊戲商請求)

此 API 用於接收遊戲供應商 (Provider) 的投注與派彩請求。

* **Endpoint**: `POST /api/v2/webhook/transaction`
* **Request Body**:

    ```json
    {
        "provider_code": "PG_SOFT",
        "action": "bet", // 'bet' | 'win' | 'refund'
        "player_id": "user_1001",
        "round_id": "R123456789",
        "transaction_id": "TX_987654321", // Provider 產生的唯一交易 ID
        "game_code": "mahjong-ways-2",
        "amount": "100.00", // String
        "currency": "USD",
        "timestamp": 1700000000000,
        "signature": "abcdef123456..." // Provider 簽章
    }
    ```

* **冪等性 (Idempotency)**:
  * 系統必須檢查 `provider_code` + `transaction_id` 是否已存在。
  * 若已存在且狀態為成功，直接回傳 `20000` (Success)。
  * 若已存在但處理中，回傳 `50000` (Process Fail) 觸發重試。

### 8.2 Seamless Wallet Specification (商戶需實作的 API)

當商戶錢包模式為 `seamless` 時，Aggregator 將呼叫商戶 API 進行扣款/入款。

* **Endpoint**: `POST /merchant/api/wallet/change` (商戶需提供)
* **Request Body**:

    ```json
    {
        "operator_id": "OP-1001",
        "player_id": "user_1001",
        "transaction_id": "AGG_TX_123456", // Aggregator 產生的唯一 ID
        "round_id": "R123456789",
        "type": "bet", // 'bet' | 'win' | 'refund'
        "amount": "100.00",
        "currency": "USD",
        "game_id": "pg-mahjong-2",
        "signature": "hmac_sha256_hash_value" // 驗證我方請求
    }
    ```

* **Response Specification**:

    ```json
    {
        "code": 0, // 0: Success, Non-zero: Error (e.g. 1001: Insufficient Funds)
        "msg": "success",
        "data": {
            "balance": "9900.00", // 交易後餘額
            "ref_id": "M_TX_556677" // 商戶端交易單號 (可選)
        }
    }
    ```

* **超時處理 (Timeout Handling)**:
  * **Timeout**: 5秒。
  * **策略**:
    * **Bet (扣款)**: 若超時，狀態標記為 `UNSETTLED`，並發起 `Action: Check` 查詢 API (需另實作) 或直接回傳 Provider 失敗 (Fail Safe)。
    * **Win (派彩)**: 若超時，系統將進入重試隊列 (Retry Queue)，每隔 10s/30s/1m/5m 重試，直到成功或人工介入。

### 8.3 餘額查詢接口 (Get Balance)

Aggregator 於特定時機 (如玩家開啟遊戲) 呼叫此 API，以同步最新餘額。

* **Endpoint**: `POST /merchant/api/wallet/balance` (商戶需提供)
* **Request Body**:

    ```json
    {
        "operator_id": "OP-1001",
        "player_id": "user_1001",
        "currency": "USD", // Optional, 若玩家有多幣種錢包
        "signature": "hmac_sha256_hash_value"
    }
    ```

* **Response**:

    ```json
    {
        "code": 0,
        "msg": "success",
        "data": {
            "balance": "1000.00", // String
            "currency": "USD"
        }
    }
    ```

### 8.4 交易狀態反查接口 (Transaction Status Check)

當扣款 (Bet) 或入款 (Win) 請求發生 **Timeout (超時)** 或 **Network Error** 時，Aggregator 排程器將呼叫此接口確認該筆交易在商戶端的最終狀態。

* **Endpoint**: `POST /merchant/api/transaction/status` (商戶需提供)
* **Request Body**:

    ```json
    {
        "operator_id": "OP-1001",
        "transaction_id": "AGG_TX_123456", // Aggregator 的交易 ID
        "signature": "hmac_sha256_hash_value"
    }
    ```

* **Response**:

    ```json
    {
        "code": 0,
        "msg": "success",
        "data": {
            "status": "EXISTS", // 'EXISTS' | 'NOT_FOUND'
            "amount": "100.00", // Optional: Double check amount
            "ref_id": "M_TX_556677" // 商戶端交易單號
        }
    }
    ```

* **邏輯判斷**:
  * **EXISTS**: 代表商戶端已成功處理該筆交易 -> Aggregator 標記為 `SUCCESS`。
  * **NOT_FOUND**: 代表商戶端未收到或已回滾 -> Aggregator 標記為 `FAIL` (針對 Bet 執行退款，針對 Win 重新發送)。
