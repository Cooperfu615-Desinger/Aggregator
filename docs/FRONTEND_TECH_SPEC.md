# 前端技術規格書 (Final Release v1.0.0)

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
* **工具庫 (Utils)**：
  * **Date**: `date-fns` (必用)
  * **State Persistence**: `@vueuse/core` (`useSessionStorage`) (必用)
  * **Math**: `big.js` (封裝於 `src/utils/math.ts`) (必用)

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

系統實作嚴格的 **四層防護機制**：

1. **白名單檢查**: 若目標路徑為 `/login` 或 `/404` 且未登入，直接放行；若已登入則強制導向 Dashboard。
2. **Token 驗證**: 檢查 `localStorage` 中是否存在有效 Token，否則強制導向登入頁。
3. **角色隔離 (Role Isolation)**:
   * **Master Role**: 可訪問所有 `/admin/*` 與 `/merchant/*` 路徑 (God Mode)。
   * **Merchant Role**: 僅可訪問 `/merchant/*` 路徑；若嘗試訪問 `/admin/*`，強制導向 `/merchant/dashboard`。
4. **功能守衛**:
   * 使用 `v-permission="'finance:view'"` 指令控制按鈕細微性權限。
   * 無權限 API 呼叫將被 Global Interceptor 攔截並提示 403。

## 5. UI/UX 標準 (UI/UX Standards)

### 5.1 共用元件 (Common Components)

* **MoneyText**: 顯示金額的唯一標準元件。
  * **Props**: `value` (數值/字串), `currency` (字串), `compact` (是否縮略顯示)。
  * **邏輯**: 使用 `Intl.NumberFormat` 進行千分位與小數點 (2位) 格式化。
  * **視覺**: 正數為綠色 (`text-green-500`)，負數為紅色 (`text-red-500`)，零為灰色。
* **StatusBadge / StatusTag**: 狀態欄位的視覺指標。
  * Props: `status` (字串), `type` (success/warning/error/info)。
  * 行為：將狀態代碼映射為本地化標籤與顏色。
* **DateRangePicker**: 標準化日期選擇器。
  * 行為：回傳時間戳陣列 `[start, end]`。
  * **輸出**: 配合 `date-fns` 透過事件 `change` 發送 ISO String 或 yyyy-MM-dd 格式字串。

### 5.2 狀態保存 (State Persistence)

所有報表類頁面 (如 `BetQuery`, `RevenueReport`, `BetLog`) 的篩選條件必須具備 **刷新不丟失** 特性。

* **實作**: 使用 `@vueuse/core` 的 `useSessionStorage`。
* **命名規範**: Key 必須具備命名空間，例如 `merchant-bet-query-filter`, `master-bet-log-search`。
* **範圍**: 僅限 Session Storage (瀏覽器關閉後清除)，不使用 Local Storage 以避免過期狀態干擾。

## 6. 財務精度與資料處理 (Financial Precision & Data Handling)

### 6.1 數值運算 (`src/utils/math.ts`)

所有涉及金額的加減乘除 **嚴禁** 使用原生 JavaScript 運算符 (`+`, `-`, `*`, `/`)。必須使用 `src/utils/math.ts` (基於 `Big.js`)：

* `math.add(a, b)`: 精確加法
* `math.sub(a, b)`: 精確減法
* `math.mul(a, b)`: 精確乘法
* `math.div(a, b)`: 精確除法 (預設 四捨五入)
* `math.toPercent(val)`: 轉換為百分比字串

### 6.2 時區處理 (Timezone Handling)

前端向後端發送日期區間查詢時，為避免 UTC 時間偏移 (Time Shift) 導致的資料誤差，**必須** 遵循：

* **API Payload**: 一律將日期轉換為 **商戶當地時間的 `yyyy-MM-dd` 字串** (例如 `2025-01-01`)。
* **工具**: 使用 `date-fns` 的 `format(date, 'yyyy-MM-dd')` 進行轉換。
* **禁止**: 直接發送 `Date` 物件或未經處理的 UTC Timestamp。

## 7. 整合指南 (Integration Guidelines)

* **API 呼叫**：使用標準 `fetch` 封裝或 Axios 實例。
* **錯誤處理**：全域處理 401/403/500 錯誤。
* **Mocking**：優先針對 `src/mocks/` handlers 進行開發 (TDD 模式)。
* **型別定義**: 必須使用 `src/types/` 下定義的 Interface，盡量避免使用 `any`。

## 8. 儀表板輪詢策略 (Dashboard Polling)

即時監控使用「短輪詢 (Short Polling)」機制，兼顧即時性與伺服器負載。

1. **頻率**: 每 **15 秒** 呼叫一次 `/api/v2/merchant/dashboard/stats`。
2. **生命週期管理**:
    * `onMounted`: 啟動 `setInterval`。
    * `onUnmounted`: 清除 `clearInterval`。
3. **頁面可見性優化 (Visibility Optimization)**:
    * 監聽 `document.visibilitychange` 事件。
    * 當 `document.hidden === true` (使用者切換分頁) 時，**暫停輪詢**。
    * 當 `document.hidden === false` (使用者切回) 時，**立即觸發一次更新** 並恢復輪詢。
