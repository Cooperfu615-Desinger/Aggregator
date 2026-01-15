# Project Manifest: Game Provider B2B Backend

> **Type**: B2B Game Provider Management System (SaaS)
> **Target Audience**: Operators (包網商), Internal Admins, Math Engineers
> **Role**: PM / Product Owner
> **Last Updated**: 2026-01-12

## 1. 核心定位 (Mission)
本系統為「遊戲供應商（Game Provider）」專用後台。
- **Strictly B2B**: 我們只服務 B 端商戶 (Operators)，不直接面對 C 端玩家。
- **No Player Wallet**: 不處理玩家充提款，只處理 B2B 額度授權。
- **Focus**: 遊戲數學配置 (RTP)、行銷活動 API 配置、資料對帳。

## 2. 功能模組 (Modules Scope)

### 🟢 Phase 1: 核心基礎 (Priority)
1.  **Dashboard (B2B)**: 監控 GGR、API 延遲、活躍商戶數。
2.  **Merchant Center (商戶管理)**:
    - 管理 `Merchant_ID` 與 `Secret_Key`。
    - 設定錢包模式 (Transfer / Seamless)。
    - 設定幣別與 IP 白名單。
3.  **Game Configuration (遊戲配置)**:
    - **RTP Selector**: 針對商戶設定不同 RTP 檔位 (90% - 98%)。
    - **Feature Toggle**: 開關「購買特色 (Buy Feature)」功能。
4.  **Data Center (數據對帳)**:
    - **Round Explorer**: 輸入 Round ID 查詢單局詳情 (JSON Log)。
    - 匯出月結單 (Settlement Report)。

### 🟡 Phase 2: 行銷與擴充
1.  **Marketing Engine**:
    - **Free Rounds API**: 設定免費旋轉活動 (Game ID, Count, Bet Level)。
    - **Tournaments**: 設定錦標賽參數。
2.  **Math Simulation**: (預留介面) 上傳 PAR Sheet 進行模擬。

## 3. 關鍵業務邏輯 (Business Rules)
- **多租戶隔離**: Merchant A 的數據絕對不可被 Merchant B 看見。
- **不可竄改性**: 所有的 Game Log (下注紀錄) 只能讀取，不可修改。
- **權限繼承**: 系統管理員 > 商戶管理員 > 商戶唯讀帳號。