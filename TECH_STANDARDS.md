# Technical Standards & Developer Guidelines

> **Tech Stack**: Vue 3, TypeScript, Vite, Naive UI, Tailwind CSS, Pinia
> **Code Quality**: Production-Ready Prototype
> **Platform**: Vercel (SPA Mode)
> **Last Updated**: 2026-01-14

## 1. 技術棧選型 (Strict Enforcement)
- **Core**: Vue 3 (Script Setup) + TypeScript (Strict Mode).
- **UI Framework**: **Naive UI** (Must use for all complex components).
    - Use `<n-data-table>` for reports.
    - Use `<n-tree>` for game categories/menus.
    - Theme: **Dark Mode** default (`#18181c` background).
- **Styling**: **Tailwind CSS** for layout, spacing, and sizing.
    - *Rule*: Do NOT write custom CSS in `<style>` tags unless absolutely necessary.
- **State Management**: **Pinia**.
- **Mocking**: **MSW (Mock Service Worker)**.
    - *Critical*: Must be enabled in BOTH Development and Production (for Vercel Prototype).

## 2. 架構規範 (Architecture)
- **Logic Separation**: 嚴禁將大量業務邏輯寫在 `.vue` 檔案中。資料獲取與計算邏輯必須抽離至 `src/composables/` (e.g., `useMerchantList.ts`)。
- **File Structure**:
  src/
  ├── api/             # API Definitions
  ├── components/      # Shared Components
  ├── composables/     # Business Logic
  ├── layouts/         # App Layouts
  ├── stores/          # Pinia Stores
  ├── types/           # TypeScript Interfaces
  └── views/           # Page Views

## 3. 防呆與一致性規範 (Consistency Guardrails) [CRITICAL]
為了避免跑版與路由不同步，請嚴格遵守：

### A. 嚴禁手寫樣式 (No Magic Styles)
1.  **Global Theme Only**: 嚴禁在 Component 內手寫顏色 hex code。所有顏色必須來自 Naive UI Theme 或 Tailwind 標準色 (e.g., `text-primary`)。
2.  **No Custom CSS**: 禁止使用 `<style scoped>` 撰寫佈局 (width, margin)。排版必須使用 Tailwind Utility Classes (e.g., `w-full`, `mt-4`)。
3.  **Component Standards**:
    - **Buttons**: 一律使用 `<n-button>`。禁止使用 `div` 手刻按鈕。
    - **Inputs**: 一律使用 `<n-input>`。

### B. 路由與狀態同步 (URL as Source of Truth)
1.  **No Hidden States**: 嚴禁使用單純的 `ref` 變數來切換主要頁面內容（如 Tabs）。狀態必須反映在 URL Query 上 (e.g., `/games?tab=list`)。
2.  **Menu Sync**: Sidebar 的 `active-key` 必須 `watch` 路由變化，確保重整網頁後選單高亮正確。

### C. 佈局穩定性 (Layout Stability)
1.  **Grid System**: 列表頁必須使用 `<n-grid>` 或 Tailwind `grid-cols-12`。嚴禁使用 `flex` 加固定像素寬度排版表格。
2.  **Fixed Height**: Dashboard Widget 必須指定統一高度 (e.g., `h-[300px]`)，避免資料載入時畫面跳動。

## 4. 資料模擬 (Mocking Strategy)
- 使用 **FakerJS** 生成擬真資料。
- 必須測試 **Empty State** (無資料顯示空狀態元件) 與 **Long Text** (超長文字跑版測試)。

## 5. 部署與發布規範 (Deployment & Vercel Strategy) [NEW]
本專案將部署至 **Vercel** 作為公開展示的原型，請務必執行以下設定：

### A. MSW 強制啟動 (Force Mock in Prod)
- **Objective**: 為了讓外部使用者能體驗資料流，Mock Data 必須在 Vercel 線上環境運作。
- **Implementation**:
    - 在 `main.ts` 中，**移除** `if (import.meta.env.DEV)` 的限制。
    - 修改為：只要無法連接真實 API，或環境變數 `VITE_USE_MOCK=true`，就啟動 MSW Worker。
    - 確保 `mockServiceWorker.js` 位於 `public/` 目錄下並被 Git 追蹤。

### B. Vercel 設定
- **Build Command**: `vue-tsc && vite build`
- **Output Directory**: `dist`
- **Routing**: Vercel 會自動處理 SPA Rewrite，無需額外設定 `vercel.json`。