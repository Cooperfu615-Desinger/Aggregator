# 🌌 Antigravity Aggregator (B2B Game Platform)

![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883?style=flat-square&logo=vue.js)
![Top Language](https://img.shields.io/github/languages/top/Cooperfu615-Desinger/Aggregator?color=blue&style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**Antigravity Aggregator** 是一個現代化、採用雙後台架構的 B2B 遊戲聚合平台原型。專案旨在為系統管理員 (System Admins) 與 商戶營運者 (Merchant Operators) 提供獨立且高度定製化的管理介面。

本專案主要包含兩大核心部分：

* **👑 Master Admin (總控端)**: 負責通路上游/下游管理、全局風控、財務清算與系統配置。
* **💼 Merchant Portal (商戶端)**: 提供給下游運營商，具備獨立的儀表板、財務報表、遊戲管理與下級代理體系。

---

## 🛠️ Tech Stack (技術棧)

本專案採用最前沿的前端技術棧，追求極致的開發體驗與執行效能：

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Core** | **Vue 3** | 使用 `<script setup>` 語法糖與 Composition API。 |
| **Language** | **TypeScript** | 全面採用 TypeScript 進行嚴格的類型檢查。 |
| **Build Tool** | **Vite** | 極速的開發伺服器與構建工具。 |
| **UI Framework** | **Naive UI** | 高度可定制的組件庫，深度整合 Dark Theme (Master) 與 Light Theme (Merchant)。 |
| **Styling** | **Tailwind CSS** | Utility-first CSS 框架，用於快速佈局與響應式設計。 |
| **State Management** | **Pinia** | 輕量且強大的狀態管理庫，支援模組化商店。 |
| **Routing** | **Vue Router** | 管理雙後台路由權限與導航守衛。 |
| **i18n** | **Vue I18n** | 完整的國際化支援 (繁體中文 / English)。 |
| **Visualization** | **ECharts** | 用於繪製高性能的動態數據圖表 (營收趨勢、各種統計)。 |
| **Mocking** | **MSW (Mock Service Worker)** | 攔截網路請求並回傳模擬數據，實現前後端分離開發。 |

---

## 🏗️ System Architecture (系統架構)

### 1. Dual-Role System (雙後台權限隔離)

系統通過路由守衛 (`router.beforeEach`) 與 佈局 (`Layouts`) 實現嚴格的權限隔離：

* **Master Admin**:
  * **路徑**: `/admin/*`
  * **主題**: 深色模式 (Dark Theme)，強調專業與監控感。
  * **權限**: 最高權限，可管理所有商戶、遊戲供應商與系統設定。
* **Merchant Portal**:
  * **路徑**: `/merchant/*`
  * **主題**: 淺色模式 (Light Theme)，強調清晰與操作便捷。
  * **權限**: 僅限訪問自身數據、下級代理與報表。

### 2. Mock Data Strategy (數據模擬策略)

目前專案處於前台原型階段，尚未接與真實後端。所有 API 請求均由 **MSW** 進行攔截。

* `src/handlers.ts`: 定義 **Master Admin** 相關的 API Mock (如 `/api/v2/stats`, `/api/v2/merchants`)。
* `src/mocks/agent.ts`: 定義 **Merchant Portal** 相關的 API Mock (如 `/api/agent/invoices`, `/api/v2/agent/stats`)。
* **優勢**: 開發過程不依賴後端，且能輕易模擬各種邊界情況 (如 API 錯誤、延遲、空數據)。

### 3. i18n & Theming (多語系與主題)

* **多語系**: 字典檔位於 `src/locales/`，分為 `common`, `menu`, `dashboard` 等模組，便於維護。
* **主題切換**: Master 預設強制 Dark Mode，Merchant 預設 Light Mode，透過 Naive UI 的 `NConfigProvider` 進行全局注入。

---

## ✨ Key Features (核心功能)

### 👑 Master Admin

* **戰情中心 (Dashboard)**: 即時監控全平台 GGR、活躍商戶、系統健康度。
* **商戶管理 (Merchant Mgmt)**: 開戶、額度劃轉、配置 API 密鑰。
* **遊戲中心 (Game Center)**: 上游供應商管理、遊戲庫存同步、RTP 設定。
* **財務清算 (Finance & Settlement)**: 對帳單生成、未結算金額報表、注單查詢。

### 💼 Merchant Portal

* **商戶儀表板**: 個人化的營收數據卡片、轉化率分析。
* **我的遊戲 (My Games)**: 自助上下架遊戲、查看遊戲狀態。
* **財務中心 (Finance Center)**: **我的帳單 (Invoices)** (支持 PDF 下載)、充值記錄。
* **報表系統**: 每日營收報表、輸贏報表、下級代理貢獻度。

---

## 📂 Project Structure (目錄結構)

```text
src/
├── assets/             # 靜態資源 (Images, CSS)
├── components/         # 共用組件
│   ├── Common/         # 通用極小組件 (StatusBadge, MoneyText)
│   └── ...
├── layouts/            # 頁面佈局
│   ├── MasterLayout.vue    # 總控端佈局 (Dark Sidebar)
│   ├── MerchantLayout.vue  # 商戶端佈局 (Light Sidebar)
│   └── AppMenu.vue         # 動態側邊選單
├── locales/            # i18n 翻譯檔 (zh-TW, en)
├── mocks/              # Mock Service Worker 設定與數據
│   ├── handlers.ts     # Master API Mocks
│   └── agent.ts        # Merchant API Mocks
├── router/             # 路由配置與權限守衛
├── stores/             # Pinia 狀態管理
│   ├── auth.ts         # Authentication Store
│   └── ...
├── utils/              # 工具函式 (Formatters, Validators)
└── views/              # 頁面視圖
    ├── Auth/           # 登入頁面
    ├── Master/         # 總控端各模組頁面 (Dashboard, Finance, etc.)
    └── Merchant/       # 商戶端各模組頁面 (Dashboard, Reports, Invoices)
```

---

## 🚀 Getting Started (快速開始)

### 1. Installation

本專案使用 `npm` 管理依賴。

```bash
git clone <repository-url>
cd Aggregator
npm install
```

### 2. Development Service

啟動本地開發伺服器：

```bash
npm run dev
```

啟動後，請訪問終端機顯示的 URL (通常為 `http://localhost:5173`)。

### 3. Demo Accounts (測試帳號)

為了方便檢視不同權限的介面，請使用以下預設帳號登入：

| Portal | Username | Password | Role |
| :--- | :--- | :--- | :--- |
| **👑 Master Admin** | `admin` | `admin123` | Super Admin |
| **💼 Merchant Portal** | `merchant` | `123456` | Merchant Agent |

---

## 📝 License

This project is licensed under the MIT License.
