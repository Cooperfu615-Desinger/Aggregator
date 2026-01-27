# 後端技術規格書 (Final Release v1.0.0)

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
* **代理管理 (Agent Management)**：管理下級代理與佣金結構。

## 3. 資料模型 (Data Models)

### 3.1 商戶與代理 (`Merchant`, `Agent`)

```typescript
interface Merchant {
    id: number;
    display_id: string;      // 例如："OP-1001"
    name: string;
    currency_type: string;   // "USD", "CNY", "TWD"
    walletMode: 'transfer' | 'seamless';
    revenue_share: number;   // 分潤百分比 (0-100, Decimal)
    ipWhitelist: string[];
    secretKey: string;
    balance?: string;        // (String for precision)
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
    type: FundType;
    amount: string;          // (String for precision)
    proof?: string;
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
    payment_proof?: string;
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
        "currency_type": "USD",
        "walletMode": "transfer",
        "revenue_share": 15.0,
        "admin_username": "admin_gd",
        "admin_password": "Password123!"
    }
    ```

### 4.2 提交充值 (Top-up)

* **Endpoint**: `POST /api/v2/merchant/wallet/top-up`
* **Request Body**:

    ```json
    {
        "amount": "10000.00", // 必填, String
        "proof": "https://storage.example.com/receipts/txn_123.jpg",
        "remarks": "Bank Transfer #9988"
    }
    ```

### 4.3 生成報表 (Generate Report)

* **Endpoint**: `GET /api/v2/merchant/reports/daily`
* **Query Params**:
  * `startDate`: `2025-01-01` (必填, yyyy-MM-dd)
  * `endDate`: `2025-01-31` (必填, yyyy-MM-dd)
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
                    "children": [...]
                }
            ]
        }
    }
    ```

### 4.4 報表查詢通用規範 (Report Query Standards)

所有報表查詢 API 的日期範圍參數 (`startDate`, `endDate`) 必須遵循以下時區規範：

1. **本地日期格式 (Local Date Format)**: Client 端必須發送 **商戶當地時間的 `yyyy-MM-dd` 字串** (e.g., `2025-01-01`)。
2. **避免 UTC 偏移**: Client 端**禁止**將本地時間轉換為 UTC ISO String (如 `2024-12-31T16:00:00.000Z`) 後傳送，這將導致後端解析錯誤（跨日問題）。
3. **後端處理**: 系統接收到 `yyyy-MM-dd` 後，將根據該商戶配置的時區 (Timezone) 轉換為資料庫查詢區間 (例如 `2025-01-01 00:00:00` 至 `2025-01-01 23:59:59` @ MerchantTZ)。

## 5. 安全性標準 (Security Standards)

* **簽章機制**: 所有 B2B 介接使用 `HMAC-SHA256`。Header: `X-Signature`.
* **併發控制**: 資金操作必須使用 DB Transaction 與悲觀鎖 (SELECT FOR UPDATE)。
* **防重放**: 支援 `Idempotency-Key`。

## 6. 資料精確度規範 (Data Precision)

為確保金融級的精確度，後端與 Client 端 (Frontend/Merchant Server) 必需遵循：

### 6.1 儲存與傳輸

* **資料庫**: 金額欄位一律使用 `DECIMAL(18, 6)` 或 `BIGINT` (單位：分)。嚴禁使用 `FLOAT/DOUBLE`。
* **API Payload**: 金額欄位一律序列化為 **字串 (String)** (例如 `"100.00"`, `"0.05"`)。

### 6.2 Client 端運算要求

* 前端或介接方在接收數據進行二次計算時（如加總、匯率換算），**必須** 使用高精度函式庫 (如 Java 的 `BigDecimal`, JS 的 `big.js` / `decimal.js`)。
* 系統設計假設前端已實作 `src/utils/math.ts` (Big.js) 等級的精度控制。

## 7. 錯誤代碼表 (Business Error Codes)

| Code | Message | 描述 |
| :--- | :--- | :--- |
| `0` | Success | 操作成功。 |
| `1001` | Insufficient Balance | 餘額不足。 |
| `2001` | Invalid Signature | 簽章錯。 |
| `4001` | Invalid Date Format | 日期格式錯誤 (需為 `yyyy-MM-dd`)。 |
| `5000` | System Busy | 系統繁忙。 |

## 8. 遊戲交易介接規格 (Game Transaction Interfaces)

*(保持原樣，僅強調金額為 String)*

* **Webhook Endpoint**: `POST /api/v2/webhook/transaction`
* **Seamless Wallet Endpoint**: `POST /merchant/api/wallet/change`
* **關鍵欄位**: `amount` 必須為 String 格式。
