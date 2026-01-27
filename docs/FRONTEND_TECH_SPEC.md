# 前端技術規格書 (Phase 10.14)

## 1. 概述 (Overview)

本文件概述了 **Aggregator Platform (聚合平台)** 的前端架構、UI 標準與元件規格。專案基於 **Vue 3**、**TypeScript**、**Naive UI** 與 **Tailwind CSS** 建構。

## 2. 架構與技術堆疊 (Architecture & Tech Stack)

* **框架 (Framework)**：Vue 3 (Composition API, `<script setup>`)
* **建構工具 (Build Tool)**：Vite
* **UI 函式庫 (UI Library)**：Naive UI
* **CSS 框架**：Tailwind CSS
* **狀態管理 (State Management)**：Pinia
* **路由 (Router)**：Vue Router
* **國際化 (I18n)**：Vue I18n

## 3. 狀態管理結構 (Pinia Store Structure)

### 3.1 `useAuthStore`

* **職責**: 管理使用者登入狀態與權限。
* **State**:
  * `token`: string | null
  * `user`: UserInfo (Name, Role, Permissions[])
  * `isAuthenticated`: boolean
* **Actions**: `login()`, `logout()`, `checkPermission(code)`

### 3.2 `useConfigStore`

* **職責**: 管理全域 UI 配置。
* **State**:
  * `locale`: 'en' | 'zh-TW' | 'zh-CN'
  * `theme`: 'light' | 'dark'
  * `serverTime`: Date (用於校正倒數計時)

### 3.3 `useMerchantStore` (Master端專用)

* **職責**: 管理總控端當前操作的目標商戶 (Context)。
* **State**:
  * `currentMerchantId`: string
  * `merchantDetail`: MerchantConfig (Wallet Mode, Currency)
* **Actions**: `switchMerchant(id)`, `loadMerchantConfig()`

## 4. 關鍵業務流程 (Critical Flows)

### 4.1 遊戲啟動流程 (Game Launch)

1. **使用者點擊**：在遊戲列表點擊 "Play Now"。
2. **API 請求**：前端呼叫 `POST /api/v2/game/launch`，帶上 `game_id` 與 `merchant_id`。
3. **回應處理**：後端回傳 `{ url: 'https://provider.com/launch?token=...' }`。
4. **Iframe 載入**：
    * 若是 PC 版：開啟模態框 (Modal) 並嵌入 Iframe。
    * 若是 Mobile 版：`window.location.href` 跳轉至遊戲 URL。
5. **訊息監聽 (Message Listener)**：
    * 前端必須監聽 `window.postMessage` 事件以處理遊戲視窗內的請求。
    * **支援事件 (Supported Events)**:
        * `GAME_CLOSE`: 玩家點擊遊戲內關閉按鈕 -> 前端關閉 Iframe/Modal 並觸發餘額刷新。
        * `OPEN_CASHIER`: 玩家點擊充值 -> 前端導向充值頁面或開啟錢包 Modal (並暫停/隱藏遊戲)。

### 4.2 權限路由守衛 (RBAC Guards)

* **全域守衛 (`router.beforeEach`)**：
  * 驗證 Token 是否存在。
  * 驗證 Token 是否過期。
* **角色守衛**：
  * Master Routes (`/admin/*`) 僅允許 `role === 'MASTER'`。
  * Merchant Routes (`/merchant/*`) 僅允許 `role === 'MERCHANT'`。
* **功能守衛**：
  * 使用 `v-permission="'finance:view'"` 指令控制按鈕顯示。
  * 無權限路由導向 `403 Forbidden` 頁面。

## 5. UI/UX 標準 (UI/UX Standards)

### 5.1 共用元件 (Common Components)

* **MoneyText**: 顯示金額的標準元件。
  * Props: `value` (數值/字串), `currency` (字串)。
  * 行為：自動千分位格式化與顏色標示 (正數綠色，負數紅色)。
* **StatusBadge / StatusTag**: 狀態欄位的視覺指標。
  * Props: `status` (字串), `type` (success/warning/error/info)。
  * 行為：將狀態代碼映射為本地化標籤與顏色。
* **DateRangePicker**: 標準化日期選擇器。
  * 行為：回傳時間戳陣列 `[start, end]`。

### 5.2 互動模式 (Interaction Patterns)

* **表格 (`NDataTable`)**：
  * 必須支援伺服器端分頁 (Server-side Pagination) 與排序。
  * 操作欄位應使用帶有 Tooltip 的圖示 (編輯、刪除、檢視)。
  * 必須優雅地處理空狀態 (Empty States)。
* **抽屜 (`NDrawer`)**：
  * 用於詳細視圖 (例如：交易明細、帳單詳情)，以保持在當前頁面脈絡中。
* **模態框 (`NModal`)**：
  * 用於簡單操作 (表單、確認對話框)。
  * 模態框內的表單必須具備驗證功能。

## 6. 表單驗證規則 (Validation Rules)

### 6.1 核心欄位規則

* **商戶代碼 (Merchant Code)**: `^[A-Z0-9]{3,6}$` (3-6 碼大寫英數)。
* **密碼 (Password)**: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$` (至少 8 碼，含大小寫與數字)。
* **金額 (Amount)**:
  * 必須大於 0。
  * 提款/轉出時，必須 `<=` 當前餘額。
  * 充值時，必須 `<=` 單筆限額 (如配置)。
* **IP 白名單**: 必須符合標準 IPv4 格式 (CIDR 可選)。

### 6.2 錯誤提示UX

* **即時驗證**: 輸入框 `blur` 或 `input` 時觸發單一欄位驗證。
* **提交驗證**: 按下 Submit 時觸發全表單驗證，並 Scroll 至第一個錯誤欄位。
* **後端錯誤**: 若 API 回傳 `400/409`，顯示 Toast Message (例如: "商戶代碼已存在")。

## 7. 整合指南 (Integration Guidelines)

* **API 呼叫**：使用標準 `fetch` 封裝或 Axios 實例。
* **錯誤處理**：全域處理 401/403/500 錯誤。
* **Mocking**：優先針對 `src/mocks/` handlers 進行開發 (TDD 模式)。

## 8. 錯誤處理策略 (Error Handling Strategy)

應由全域攔截器 (Global Interceptor) 統一處理 API 錯誤，避免在每個 Component 重複撰寫 `try-catch`。

1. **攔截層級**: `Axios Interceptor` 或 `fetch wrapper`。
2. **邏輯判斷**:
    * **HTTP 錯誤 (401/403/500)**: 顯示通用錯誤頁面或重新登入 Modal。
    * **業務錯誤 (Code != 0)**:
        * 讀取 `response.data.code` (e.g., `1001`)。
        * 查找 i18n key: `errors.code_1001` (例如 "餘額不足")。
        * 若找不到對應 Key，顯示 `response.data.msg`。
        * 使用 `message.error()` (Toast) 顯示錯誤訊息。

## 9. 儀表板輪詢策略 (Dashboard Polling)

即時監控使用「短輪詢 (Short Polling)」機制，兼顧即時性與伺服器負載。

1. **頻率**: 每 **15 秒** 呼叫一次 `/api/v2/merchant/dashboard/stats`。
2. **生命週期管理**:
    * `onMounted`: 啟動 `setInterval`。
    * `onUnmounted`: 清除 `clearInterval`。
3. **頁面可見性優化 (Visibility Optimization)**:
    * 監聽 `document.visibilitychange` 事件。
    * 當 `document.hidden === true` (使用者切換分頁) 時，**暫停輪詢**。
    * 當 `document.hidden === false` (使用者切回) 時，**立即觸發一次更新** 並恢復輪詢。
