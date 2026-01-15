# Antigravity Project: Game Provider Omni-Backend

> **Type**: B2B Game Provider Management System (SaaS)  
> **Target Audience**: Operators (包網/現金網), Internal Admins, Math Engineers  
> **Tech Stack**: Vue 3, TypeScript, Vite, Naive UI, Tailwind CSS, Pinia, MSW  
> **Last Updated**: 2026-01-12

---

## 1. 核心定位 Core Philosophy
本系統為「遊戲供應商（Game Provider）」專用後台，非傳統包網後台。
- **不處理**：C 端玩家註冊、C 端金流充提、C 端代理推廣。
- **專注於**：B2B 商戶管理、遊戲數學配置 (RTP)、行銷活動 API 配置、資料對帳。

---

## 2. 目錄結構 Directory Structure

```bash
src/
├── api/                      # API 定義 (與後端對接的合約)
│   ├── merchant.ts           # 商戶/租戶管理
│   ├── game-config.ts        # 遊戲參數 (RTP, 限紅)
│   ├── marketing.ts          # 免費旋轉與活動
│   └── report.ts             # 報表數據
├── components/
│   ├── Business/             # 業務組件
│   │   ├── RTPSelector.vue   # [獨家] RTP 檔位選擇器
│   │   ├── CurrencyInput.vue # 多幣別輸入框
│   │   └── GamePicker.vue    # 遊戲選擇彈窗 (含圖示)
│   └── Charts/               # ECharts 封裝
├── mocks/                    # MSW 模擬數據 (Prototyping Core)
│   ├── handlers.ts           # API 攔截規則
│   └── data/                 # 靜態 JSON 資料 (Games, Merchants)
├── stores/                   # Pinia 狀態
│   └── user.ts               # 當前登入的管理員權限
├── views/
│   ├── Dashboard/            # 戰情中心 (B2B 視角)
│   ├── Merchant/             # 商戶管理 (Operators)
│   │   ├── List.vue          # 商戶列表 (API Key, Wallet Mode)
│   │   └── Configuration.vue # 該商戶的遊戲開關/抽水設定
│   ├── GameCenter/           # 遊戲庫管理
│   │   ├── Slots/            # 老虎機配置 (RTP, Volatility)
│   │   ├── Tables/           # 棋牌配置 (Room, Rake)
│   │   └── Crash/            # 爆點遊戲 (Seeds, Monitoring)
│   ├── Marketing/            # 行銷工具 (API Trigger)
│   │   ├── FreeRounds.vue    # 免費旋轉發送設定
│   │   └── Tournaments.vue   # 錦標賽排行榜配置
│   ├── DataCenter/           # 數據與對帳
│   │   ├── RoundSearch.vue   # [核心] 單局詳情查詢 (Log Replay)
│   │   └── Reconciliation.vue# B2B 對帳單
│   └── System/               # 系統設定
└── types/                    # TypeScript 介面定義
    └── game.ts               # 核心資料結構