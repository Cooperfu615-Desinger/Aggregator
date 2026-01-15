# BackendServer 規格書

**版本**: 2.0
**建立日期**: 2026-01-14
**用途**: 代理後台系統開發規格
**架構模式**: DDD (Domain-Driven Design) / Clean Architecture

---

## 目錄

1. [專案概述](#1-專案概述)
2. [DDD 架構設計](#2-ddd-架構設計)
3. [PostgreSQL 資料表設計](#3-postgresql-資料表設計)
4. [ClickHouse 報表資料表設計](#4-clickhouse-報表資料表設計)
5. [業務流程定義](#5-業務流程定義)
6. [API 規格定義](#6-api-規格定義)
7. [認證與授權](#7-認證與授權)
8. [錯誤碼規範](#8-錯誤碼規範)

---

## 1. 專案概述

### 1.1 系統目的

代理後台系統 (BackendServer) 是遊戲平台的核心管理服務，提供：

| 服務對象 | API 類別 | 認證方式 | 核心功能 |
|---------|---------|---------|---------|
| 第三方平台 | Platform API | SecretKey (Header) | 用戶管理、金流轉帳、下注查詢 |
| 代理商 | Agent API | Cookie Token | 後台管理、報表查詢、玩家管理 |
| 系統管理員 | CMD API | 內部 Token | 系統控制、遊戲風控、跑馬燈 |

### 1.2 核心業務指標

| 指標 | 目標值 | 說明 |
|-----|-------|-----|
| API 回應時間 | < 200ms | P95 響應時間 |
| 報表查詢時間 | < 500ms | ClickHouse 聚合查詢 |
| 可用性 | 99.9% | 年度 SLA |
| 金流準確性 | 100% | 零誤差，支援冪等操作 |

### 1.3 資料庫策略

| 資料庫 | 用途 | 特性 |
|-------|-----|-----|
| PostgreSQL | OLTP 主資料庫 | 事務處理、業務資料、即時查詢 |
| ClickHouse | OLAP 報表資料庫 | 聚合分析、歷史報表、大數據查詢 |
| Redis | 快取與 Session | Token 管理、熱點資料快取 |

---

## 2. DDD 架構設計

### 2.1 分層架構

```
┌─────────────────────────────────────────────────────────────────┐
│                      Presentation Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Platform    │  │ Agent       │  │ CMD                     │  │
│  │ Handler     │  │ Handler     │  │ Handler                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ User        │  │ Finance     │  │ Report                  │  │
│  │ Service     │  │ Service     │  │ Service                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Agent       │  │ Activity    │  │ Game                    │  │
│  │ Service     │  │ Service     │  │ Service                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Domain Layer                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Aggregate Roots                          ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐   ││
│  │  │ Agent   │ │ Player  │ │ BetLog  │ │ Activity        │   ││
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Domain Services                          ││
│  │  ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐  ││
│  │  │ Permission   │ │ CashFlow     │ │ Report             │  ││
│  │  │ Service      │ │ Service      │ │ Aggregator         │  ││
│  │  └──────────────┘ └──────────────┘ └────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ PostgreSQL  │  │ ClickHouse  │  │ Redis                   │  │
│  │ Repository  │  │ Repository  │  │ Repository              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 目錄結構

```
backend-server/
├── cmd/
│   └── server/
│       └── main.go                    # 程式進入點
├── internal/
│   ├── domain/                        # 領域層
│   │   ├── entity/                    # 實體定義
│   │   │   ├── agent.go
│   │   │   ├── player.go
│   │   │   ├── bet_log.go
│   │   │   └── activity.go
│   │   ├── valueobject/               # 值物件
│   │   │   ├── money.go
│   │   │   ├── permission.go
│   │   │   └── time_range.go
│   │   ├── repository/                # Repository 介面
│   │   │   ├── agent_repository.go
│   │   │   ├── player_repository.go
│   │   │   └── bet_log_repository.go
│   │   └── service/                   # 領域服務
│   │       ├── permission_service.go
│   │       └── cashflow_service.go
│   ├── application/                   # 應用層
│   │   ├── dto/                       # 資料傳輸物件
│   │   │   ├── request/
│   │   │   └── response/
│   │   ├── service/                   # 應用服務
│   │   │   ├── user_service.go
│   │   │   ├── finance_service.go
│   │   │   ├── agent_service.go
│   │   │   └── report_service.go
│   │   └── usecase/                   # 使用案例
│   │       ├── credit_usecase.go
│   │       └── login_usecase.go
│   ├── infrastructure/                # 基礎設施層
│   │   ├── persistence/
│   │   │   ├── postgres/              # PostgreSQL 實作
│   │   │   │   ├── agent_repo.go
│   │   │   │   └── player_repo.go
│   │   │   ├── clickhouse/            # ClickHouse 實作
│   │   │   │   └── report_repo.go
│   │   │   └── redis/                 # Redis 實作
│   │   │       └── cache_repo.go
│   │   └── external/                  # 外部服務
│   │       └── rpc_client.go
│   └── interfaces/                    # 介面層
│       ├── http/
│       │   ├── handler/               # HTTP 處理器
│       │   │   ├── platform/
│       │   │   ├── agent/
│       │   │   └── cmd/
│       │   ├── middleware/            # 中間件
│       │   │   ├── auth.go
│       │   │   ├── permission.go
│       │   │   └── ratelimit.go
│       │   └── router/                # 路由
│       │       └── router.go
│       └── dto/                       # 介面 DTO
├── pkg/                               # 共用套件
│   ├── errcode/
│   ├── response/
│   └── validator/
└── tests/
    ├── unit/
    └── integration/
```

### 2.3 聚合根 (Aggregate Root) 設計

#### Agent 聚合根
```
Agent (Aggregate Root)
├── AgentID (Identity)
├── Account
├── Name
├── SiteCode
├── ParentID
├── Level
├── Percent
├── CurrencyType
├── SecretKey
├── State
├── Permissions[] (Value Object)
├── SubAccounts[] (Entity)
└── LimitSettings (Entity)
```

#### Player 聚合根
```
Player (Aggregate Root)
├── PlayerID (Identity)
├── Account
├── DisplayName
├── Balance (Value Object: Money)
├── AgentID
├── State
├── CurrencyType
└── LoginRecords[] (Entity)
```

#### BetLog 聚合根
```
BetLog (Aggregate Root)
├── BetLogID (Identity)
├── SID (Session ID)
├── PlayerID
├── AgentID
├── GameInfo (Value Object)
│   ├── GameModuleType
│   ├── GameType
│   ├── RoomID
│   └── TableID
├── BetAmount (Value Object: Money)
├── WinAmount (Value Object: Money)
├── ValidBetAmount (Value Object: Money)
├── TimeInfo (Value Object)
│   ├── BetTime
│   └── SettlementTime
└── GameDetail (JSON)
```

### 2.4 CQRS 模式應用

```
寫入路徑 (Command):
┌─────────┐    ┌─────────────┐    ┌─────────────┐
│ Command │───▶│ Application │───▶│ PostgreSQL  │
│ Handler │    │ Service     │    │ (Write DB)  │
└─────────┘    └─────────────┘    └─────────────┘

讀取路徑 (Query):
┌─────────┐    ┌─────────────┐    ┌─────────────┐
│ Query   │───▶│ Report      │───▶│ ClickHouse  │
│ Handler │    │ Service     │    │ (Read DB)   │
└─────────┘    └─────────────┘    └─────────────┘
                                        ▲
                                        │ ETL 同步
                                  ┌─────────────┐
                                  │ PostgreSQL  │
                                  └─────────────┘
```

---

## 3. PostgreSQL 資料表設計

### 3.1 代理相關資料表

#### agents (代理帳號)

**用途**: 儲存代理商帳號資訊，支援多層級代理結構

```sql
CREATE TABLE agents (
    id              SERIAL PRIMARY KEY,
    parent_id       INTEGER REFERENCES agents(id),
    web_id          INTEGER NOT NULL,
    site_code       VARCHAR(10) NOT NULL UNIQUE,
    account         VARCHAR(50) NOT NULL,
    password        VARCHAR(255) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(100),
    icon            VARCHAR(255),
    level           SMALLINT NOT NULL DEFAULT 1,
    agent_type      SMALLINT NOT NULL DEFAULT 1,  -- 1=代理, 2=子帳號
    percent         DECIMAL(5,2) NOT NULL DEFAULT 0,
    currency_type   VARCHAR(10) NOT NULL DEFAULT 'TWD',
    secret_key      VARCHAR(100) UNIQUE,
    agent_limit     DECIMAL(18,2) DEFAULT 0,
    default_client_language VARCHAR(10) DEFAULT 'zh-TW',
    is_delete       SMALLINT NOT NULL DEFAULT 0,
    state           SMALLINT NOT NULL DEFAULT 1,  -- 0=停用, 1=啟用
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_level CHECK (level BETWEEN 1 AND 4),
    CONSTRAINT chk_percent CHECK (percent BETWEEN 0 AND 100)
);

CREATE INDEX idx_agents_parent_id ON agents(parent_id);
CREATE INDEX idx_agents_web_id ON agents(web_id);
CREATE INDEX idx_agents_secret_key ON agents(secret_key);
CREATE INDEX idx_agents_account ON agents(account);
```

#### agent_permissions (代理權限)

**用途**: 代理權限設定，支援 RBAC 權限控制

```sql
CREATE TABLE agent_permissions (
    id              SERIAL PRIMARY KEY,
    agent_id        INTEGER NOT NULL REFERENCES agents(id),
    permission_code VARCHAR(50) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(agent_id, permission_code)
);

CREATE INDEX idx_agent_permissions_agent_id ON agent_permissions(agent_id);
```

#### agent_game_settings (代理遊戲設定)

**用途**: 代理可開放的遊戲列表設定

```sql
CREATE TABLE agent_game_settings (
    id              SERIAL PRIMARY KEY,
    agent_id        INTEGER NOT NULL REFERENCES agents(id),
    game_type       INTEGER NOT NULL,
    is_enabled      BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(agent_id, game_type)
);

CREATE INDEX idx_agent_game_settings_agent_id ON agent_game_settings(agent_id);
```

#### agent_ip_rules (代理 IP 規則)

**用途**: IP 白名單/黑名單設定

```sql
CREATE TABLE agent_ip_rules (
    id              SERIAL PRIMARY KEY,
    agent_id        INTEGER NOT NULL REFERENCES agents(id),
    ip_address      VARCHAR(50) NOT NULL,  -- 支援 CIDR 格式
    allow_type      SMALLINT NOT NULL,     -- 1=允許, 2=禁止
    description     VARCHAR(200),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(agent_id, ip_address)
);

CREATE INDEX idx_agent_ip_rules_agent_id ON agent_ip_rules(agent_id);
```

### 3.2 玩家相關資料表

#### players (玩家帳號)

**用途**: 儲存玩家帳號資訊

```sql
CREATE TABLE players (
    id              SERIAL PRIMARY KEY,
    agent_id        INTEGER NOT NULL REFERENCES agents(id),
    web_id          INTEGER NOT NULL,
    account         VARCHAR(100) NOT NULL UNIQUE,  -- 格式: {account}@{site_code}
    display_name    VARCHAR(100) NOT NULL,
    password        VARCHAR(255),
    balance         DECIMAL(18,4) NOT NULL DEFAULT 0,
    currency_type   VARCHAR(10) NOT NULL DEFAULT 'TWD',
    state           SMALLINT NOT NULL DEFAULT 1,  -- 0=停用, 1=啟用
    last_login_at   TIMESTAMP,
    last_login_ip   VARCHAR(50),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_players_agent_id ON players(agent_id);
CREATE INDEX idx_players_web_id ON players(web_id);
CREATE INDEX idx_players_account ON players(account);
```

#### player_login_records (玩家登入紀錄)

**用途**: 記錄玩家登入歷史

```sql
CREATE TABLE player_login_records (
    id              BIGSERIAL PRIMARY KEY,
    player_id       INTEGER NOT NULL REFERENCES players(id),
    agent_id        INTEGER NOT NULL,
    web_id          INTEGER NOT NULL,
    login_ip        VARCHAR(50) NOT NULL,
    device_type     VARCHAR(50),
    user_agent      TEXT,
    login_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_player_login_records_player_id ON player_login_records(player_id);
CREATE INDEX idx_player_login_records_login_at ON player_login_records(login_at);
```

### 3.3 金流相關資料表

#### cash_operations (現金操作紀錄)

**用途**: 記錄所有金流操作 (轉入/轉出)

```sql
CREATE TABLE cash_operations (
    id              BIGSERIAL PRIMARY KEY,
    player_id       INTEGER NOT NULL REFERENCES players(id),
    agent_id        INTEGER NOT NULL,
    web_id          INTEGER NOT NULL,
    order_id        VARCHAR(100) UNIQUE,
    main_code       SMALLINT NOT NULL,  -- 1=遊戲, 2=平台, 3=活動
    sub_code        SMALLINT NOT NULL,  -- 1=下注, 2=派獎, 3=紅包, 4=轉入, 5=轉出
    amount          DECIMAL(18,4) NOT NULL,
    before_balance  DECIMAL(18,4) NOT NULL,
    after_balance   DECIMAL(18,4) NOT NULL,
    currency_rate   DECIMAL(10,4) DEFAULT 1,
    currency_name   VARCHAR(10),
    status          SMALLINT NOT NULL DEFAULT 1,  -- 1=成功, 2=失敗, 3=處理中
    remark          VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cash_operations_player_id ON cash_operations(player_id);
CREATE INDEX idx_cash_operations_agent_id ON cash_operations(agent_id);
CREATE INDEX idx_cash_operations_order_id ON cash_operations(order_id);
CREATE INDEX idx_cash_operations_created_at ON cash_operations(created_at);
```

### 3.4 下注相關資料表

#### bet_logs (統一下注紀錄)

**用途**: 統一儲存所有遊戲類型的下注紀錄

```sql
CREATE TABLE bet_logs (
    id              BIGSERIAL PRIMARY KEY,
    sid             VARCHAR(100) NOT NULL UNIQUE,  -- Session ID
    player_id       INTEGER NOT NULL,
    player_account  VARCHAR(100) NOT NULL,
    agent_id        INTEGER NOT NULL,
    web_id          INTEGER NOT NULL,
    game_module_type INTEGER NOT NULL,  -- 1=百人, 2=PK, 3=Slot, 4=Fish
    game_type       INTEGER NOT NULL,
    game_round      VARCHAR(100),
    room_id         INTEGER,
    table_id        INTEGER,
    bet_point       DECIMAL(18,4) NOT NULL,
    valid_bet_point DECIMAL(18,4) NOT NULL,
    win_point       DECIMAL(18,4) NOT NULL,
    profit          DECIMAL(18,4) NOT NULL,  -- bet - win (平台盈虧)
    before_point    DECIMAL(18,4) NOT NULL,
    after_point     DECIMAL(18,4) NOT NULL,
    currency_rate   DECIMAL(10,4) DEFAULT 1,
    currency_name   VARCHAR(10),
    bet_area        JSONB,
    game_detail     JSONB,
    bet_time        TIMESTAMP NOT NULL,
    settlement_time TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bet_logs_player_id ON bet_logs(player_id);
CREATE INDEX idx_bet_logs_agent_id ON bet_logs(agent_id);
CREATE INDEX idx_bet_logs_game_type ON bet_logs(game_type);
CREATE INDEX idx_bet_logs_bet_time ON bet_logs(bet_time);
CREATE INDEX idx_bet_logs_settlement_time ON bet_logs(settlement_time);

-- 分區建議 (按月分區)
-- CREATE TABLE bet_logs_202601 PARTITION OF bet_logs
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

### 3.5 遊戲相關資料表

#### game_types (遊戲類型)

**用途**: 遊戲類型設定

```sql
CREATE TABLE game_types (
    id              INTEGER PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    module_type     SMALLINT NOT NULL,  -- 1=百人, 2=PK, 3=Slot, 4=Fish
    is_open         SMALLINT NOT NULL DEFAULT 1,
    weight          INTEGER DEFAULT 0,
    is_hot          SMALLINT DEFAULT 0,  -- 0=一般, 1=熱門, 2=新進, 3=新且熱
    game_setting    JSONB,
    front_setting   JSONB,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### game_rounds (遊戲局號)

**用途**: 記錄遊戲局號資訊

```sql
CREATE TABLE game_rounds (
    id              BIGSERIAL PRIMARY KEY,
    room_id         INTEGER NOT NULL,
    table_id        INTEGER NOT NULL,
    game_type       INTEGER NOT NULL,
    game_data       BYTEA,
    game_result     VARCHAR(500),
    state           VARCHAR(20) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_game_rounds_room_table ON game_rounds(room_id, table_id);
CREATE INDEX idx_game_rounds_created_at ON game_rounds(created_at);
```

### 3.6 活動相關資料表

#### activities (活動設定)

**用途**: 活動設定與配置

```sql
CREATE TABLE activities (
    id              SERIAL PRIMARY KEY,
    activity_key    VARCHAR(100) NOT NULL,
    activity_value  JSONB NOT NULL,
    weight          INTEGER DEFAULT 0,
    is_open         SMALLINT NOT NULL DEFAULT 0,  -- 0=關閉, 1=開啟, 2=全關
    auto_open       BOOLEAN DEFAULT false,
    loading_state   SMALLINT DEFAULT 0,
    loading_start_time TIMESTAMP,
    start_time      TIMESTAMP NOT NULL,
    end_time        TIMESTAMP NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_activity_key ON activities(activity_key);
CREATE INDEX idx_activities_is_open ON activities(is_open);
```

#### activity_agent_configs (代理活動設定)

**用途**: 代理專屬活動設定覆蓋

```sql
CREATE TABLE activity_agent_configs (
    id              SERIAL PRIMARY KEY,
    agent_id        INTEGER NOT NULL REFERENCES agents(id),
    activity_id     INTEGER NOT NULL REFERENCES activities(id),
    activity_value  JSONB NOT NULL,
    weight          INTEGER DEFAULT 0,
    is_open         SMALLINT NOT NULL DEFAULT 0,
    auto_open       BOOLEAN DEFAULT false,
    start_time      TIMESTAMP NOT NULL,
    end_time        TIMESTAMP NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(agent_id, activity_id)
);
```

#### activity_logs (活動紀錄)

**用途**: 活動參與紀錄

```sql
CREATE TABLE activity_logs (
    id              BIGSERIAL PRIMARY KEY,
    player_id       INTEGER NOT NULL,
    agent_id        INTEGER NOT NULL,
    web_id          INTEGER NOT NULL,
    activity_id     INTEGER NOT NULL,
    activity_key    VARCHAR(100) NOT NULL,
    reward_amount   DECIMAL(18,4) DEFAULT 0,
    detail          JSONB,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_player_id ON activity_logs(player_id);
CREATE INDEX idx_activity_logs_activity_id ON activity_logs(activity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
```

### 3.7 系統相關資料表

#### marquees (跑馬燈)

**用途**: 跑馬燈訊息設定

```sql
CREATE TABLE marquees (
    id              SERIAL PRIMARY KEY,
    agent_id        INTEGER,
    is_tree         SMALLINT DEFAULT 0,  -- 0=非樹狀, 1=樹狀
    content         JSONB NOT NULL,      -- 多語系內容
    type            SMALLINT NOT NULL,   -- 1=一次性, 2=循環
    time_space_second INTEGER DEFAULT 60,
    start_time      TIMESTAMP NOT NULL,
    end_time        TIMESTAMP NOT NULL,
    next_send_time  TIMESTAMP,
    state           SMALLINT NOT NULL DEFAULT 1,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_marquees_state ON marquees(state);
CREATE INDEX idx_marquees_start_end ON marquees(start_time, end_time);
```

#### operation_logs (操作日誌)

**用途**: 記錄後台操作日誌

```sql
CREATE TABLE operation_logs (
    id              BIGSERIAL PRIMARY KEY,
    operator_id     INTEGER NOT NULL,
    operator_type   VARCHAR(20) NOT NULL,  -- agent, admin
    web_id          INTEGER NOT NULL,
    action          VARCHAR(100) NOT NULL,
    target_type     VARCHAR(50),
    target_id       INTEGER,
    before_data     JSONB,
    after_data      JSONB,
    ip_address      VARCHAR(50),
    user_agent      TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_operation_logs_operator ON operation_logs(operator_id, operator_type);
CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at);
```

#### alert_logs (警示日誌)

**用途**: IP 異常等警示紀錄

```sql
CREATE TABLE alert_logs (
    id              BIGSERIAL PRIMARY KEY,
    agent_id        INTEGER,
    player_id       INTEGER,
    web_id          INTEGER NOT NULL,
    alert_type      VARCHAR(50) NOT NULL,
    ip_address      VARCHAR(50),
    detail          JSONB,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alert_logs_agent_id ON alert_logs(agent_id);
CREATE INDEX idx_alert_logs_created_at ON alert_logs(created_at);
```

---

## 4. ClickHouse 報表資料表設計

### 4.1 設計原則

- **列式存儲**: 針對聚合查詢優化
- **數據分區**: 按日期分區，加速時間範圍查詢
- **物化視圖**: 預聚合常用報表數據
- **ETL 同步**: 從 PostgreSQL 定期同步數據

### 4.2 下注分析資料表

#### bet_log_analytics (下注分析表)

**用途**: 從 PostgreSQL 同步的下注紀錄，用於報表查詢

```sql
CREATE TABLE bet_log_analytics (
    id              UInt64,
    sid             String,
    player_id       UInt32,
    player_account  String,
    agent_id        UInt32,
    web_id          UInt32,
    game_module_type UInt8,
    game_type       UInt16,
    game_round      String,
    room_id         UInt16,
    table_id        UInt16,
    bet_point       Decimal(18, 4),
    valid_bet_point Decimal(18, 4),
    win_point       Decimal(18, 4),
    profit          Decimal(18, 4),
    currency_name   LowCardinality(String),
    bet_date        Date,
    bet_time        DateTime,
    settlement_time DateTime
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(bet_date)
ORDER BY (web_id, agent_id, bet_date, player_id)
SETTINGS index_granularity = 8192;
```

### 4.3 每日聚合報表

#### daily_agent_report (代理每日報表)

**用途**: 預聚合的代理每日統計，加速報表查詢

```sql
CREATE TABLE daily_agent_report (
    report_date     Date,
    agent_id        UInt32,
    web_id          UInt32,
    game_module_type UInt8,
    game_type       UInt16,
    currency_name   LowCardinality(String),
    player_count    UInt32,
    bet_count       UInt64,
    total_bet       Decimal(18, 4),
    total_valid_bet Decimal(18, 4),
    total_win       Decimal(18, 4),
    total_profit    Decimal(18, 4)
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(report_date)
ORDER BY (web_id, agent_id, report_date, game_module_type, game_type, currency_name)
SETTINGS index_granularity = 8192;
```

#### daily_player_report (玩家每日報表)

**用途**: 預聚合的玩家每日統計

```sql
CREATE TABLE daily_player_report (
    report_date     Date,
    player_id       UInt32,
    player_account  String,
    agent_id        UInt32,
    web_id          UInt32,
    game_module_type UInt8,
    currency_name   LowCardinality(String),
    bet_count       UInt64,
    total_bet       Decimal(18, 4),
    total_valid_bet Decimal(18, 4),
    total_win       Decimal(18, 4),
    total_profit    Decimal(18, 4)
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(report_date)
ORDER BY (web_id, agent_id, report_date, player_id, game_module_type, currency_name)
SETTINGS index_granularity = 8192;
```

### 4.4 物化視圖

#### mv_daily_agent_report (代理報表物化視圖)

**用途**: 自動從 bet_log_analytics 聚合到 daily_agent_report

```sql
CREATE MATERIALIZED VIEW mv_daily_agent_report
TO daily_agent_report
AS SELECT
    toDate(bet_time) AS report_date,
    agent_id,
    web_id,
    game_module_type,
    game_type,
    currency_name,
    uniqExact(player_id) AS player_count,
    count() AS bet_count,
    sum(bet_point) AS total_bet,
    sum(valid_bet_point) AS total_valid_bet,
    sum(win_point) AS total_win,
    sum(profit) AS total_profit
FROM bet_log_analytics
GROUP BY report_date, agent_id, web_id, game_module_type, game_type, currency_name;
```

#### mv_daily_player_report (玩家報表物化視圖)

```sql
CREATE MATERIALIZED VIEW mv_daily_player_report
TO daily_player_report
AS SELECT
    toDate(bet_time) AS report_date,
    player_id,
    any(player_account) AS player_account,
    agent_id,
    web_id,
    game_module_type,
    currency_name,
    count() AS bet_count,
    sum(bet_point) AS total_bet,
    sum(valid_bet_point) AS total_valid_bet,
    sum(win_point) AS total_win,
    sum(profit) AS total_profit
FROM bet_log_analytics
GROUP BY report_date, player_id, agent_id, web_id, game_module_type, currency_name;
```

### 4.5 RTP 分析報表

#### game_rtp_analytics (遊戲 RTP 分析)

**用途**: 遊戲回報率分析

```sql
CREATE TABLE game_rtp_analytics (
    report_date     Date,
    web_id          UInt32,
    agent_id        UInt32,
    game_type       UInt16,
    game_module_type UInt8,
    total_bet       Decimal(18, 4),
    total_win       Decimal(18, 4),
    rtp_percent     Decimal(8, 4),  -- win / bet * 100
    bet_count       UInt64,
    player_count    UInt32
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(report_date)
ORDER BY (web_id, agent_id, report_date, game_type)
SETTINGS index_granularity = 8192;
```

### 4.6 金流分析報表

#### cash_flow_analytics (金流分析)

**用途**: 金流操作統計分析

```sql
CREATE TABLE cash_flow_analytics (
    report_date     Date,
    agent_id        UInt32,
    web_id          UInt32,
    main_code       UInt8,
    sub_code        UInt8,
    currency_name   LowCardinality(String),
    transaction_count UInt64,
    total_amount    Decimal(18, 4),
    player_count    UInt32
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(report_date)
ORDER BY (web_id, agent_id, report_date, main_code, sub_code, currency_name)
SETTINGS index_granularity = 8192;
```

### 4.7 常用查詢範例

#### 代理輸贏報表查詢

```sql
SELECT
    agent_id,
    sum(total_bet) AS total_bet,
    sum(total_valid_bet) AS total_valid_bet,
    sum(total_win) AS total_win,
    sum(total_profit) AS total_profit,
    sum(player_count) AS player_count,
    sum(bet_count) AS bet_count
FROM daily_agent_report
WHERE web_id = 1
  AND agent_id = 100
  AND report_date BETWEEN '2026-01-01' AND '2026-01-14'
GROUP BY agent_id;
```

#### 玩家每日報表查詢

```sql
SELECT
    report_date,
    player_account,
    sum(total_bet) AS total_bet,
    sum(total_valid_bet) AS total_valid_bet,
    sum(total_win) AS total_win,
    sum(total_profit) AS total_profit
FROM daily_player_report
WHERE web_id = 1
  AND player_account = 'player001@ABC'
  AND report_date BETWEEN '2026-01-01' AND '2026-01-14'
GROUP BY report_date, player_account
ORDER BY report_date;
```

#### 遊戲 RTP 分析查詢

```sql
SELECT
    game_type,
    sum(total_bet) AS total_bet,
    sum(total_win) AS total_win,
    round(sum(total_win) / sum(total_bet) * 100, 2) AS rtp_percent,
    sum(bet_count) AS bet_count
FROM game_rtp_analytics
WHERE web_id = 1
  AND report_date BETWEEN '2026-01-01' AND '2026-01-14'
GROUP BY game_type
ORDER BY total_bet DESC;
```

---

## 5. 業務流程定義

### 5.1 金流轉入 (Credit) 流程

**業務場景**: 第三方平台將點數轉入玩家帳戶

```
┌─────────────────────────────────────────────────────────────────────┐
│                     金流轉入 (Credit) 流程                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────┐                                                     │
│  │ 1. 接收   │ 驗證 SecretKey, 解析 Request                        │
│  │    請求   │ account, order_id, credit_amount                    │
│  └─────┬─────┘                                                     │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 2. 參數   │ ● 金額 > 0                                          │
│  │    驗證   │ ● order_id 長度 <= 50                               │
│  └─────┬─────┘ ● account 格式正確                                  │
│        │                                                           │
│        ▼ 驗證失敗 → 回傳錯誤碼                                     │
│  ┌───────────┐                                                     │
│  │ 3. 冪等性 │ 查詢 order_id 是否已存在                            │
│  │    檢查   │ 若存在 → 回傳原交易結果                             │
│  └─────┬─────┘                                                     │
│        │                                                           │
│        ▼ 不存在                                                    │
│  ┌───────────┐                                                     │
│  │ 4. 玩家   │ ● 查詢玩家是否存在                                  │
│  │    查詢   │ ● 不存在 → 自動建立 (RPC)                           │
│  └─────┬─────┘                                                     │
│        │                                                           │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 5. 代理   │ ● 若啟用額度控制                                    │
│  │  額度檢查 │ ● 檢查代理額度是否足夠                              │
│  └─────┬─────┘ ● 不足 → 回傳 112280001                             │
│        │                                                           │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 6. 執行   │ ● 開始事務                                          │
│  │    轉帳   │ ● 更新玩家餘額                                      │
│  └─────┬─────┘ ● 扣減代理額度 (若啟用)                             │
│        │                                                           │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 7. 記錄   │ ● main_code = 2 (平台)                              │
│  │  CashOp   │ ● sub_code = 4 (轉入)                               │
│  └─────┬─────┘ ● 記錄前後餘額                                      │
│        │                                                           │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 8. 提交   │ 提交事務，回傳成功結果                              │
│  │    回傳   │ balance, order_id, credit_amount                    │
│  └───────────┘                                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**業務規則**:
1. **冪等性保證**: 相同 order_id 重複請求，返回相同結果
2. **自動建立玩家**: 若玩家不存在，透過 RPC 自動建立
3. **額度控制**: 可選功能，若啟用需檢查代理額度
4. **事務一致性**: 餘額更新與 CashOp 記錄在同一事務

### 5.2 金流轉出 (Debit) 流程

**業務場景**: 第三方平台從玩家帳戶轉出點數

```
┌─────────────────────────────────────────────────────────────────────┐
│                     金流轉出 (Debit) 流程                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────┐                                                     │
│  │ 1. 接收   │ 驗證 SecretKey, 解析 Request                        │
│  │    請求   │                                                     │
│  └─────┬─────┘                                                     │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 2. 參數   │ ● 金額 > 0                                          │
│  │    驗證   │ ● 玩家帳號存在                                      │
│  └─────┬─────┘                                                     │
│        │                                                           │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 3. 冪等性 │ 查詢 order_id 是否已存在                            │
│  │    檢查   │                                                     │
│  └─────┬─────┘                                                     │
│        │                                                           │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 4. 遊戲   │ ● 檢查玩家是否在遊戲中                              │
│  │  狀態檢查 │ ● 在遊戲中 → 回傳 112240001                         │
│  └─────┬─────┘ ● 有未結算注單 → 禁止轉出                           │
│        │                                                           │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 5. 餘額   │ ● 查詢當前餘額                                      │
│  │    檢查   │ ● 餘額不足 → 回傳錯誤                               │
│  └─────┬─────┘                                                     │
│        │                                                           │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 6. 執行   │ ● 開始事務                                          │
│  │    轉帳   │ ● 扣減玩家餘額                                      │
│  └─────┬─────┘ ● 增加代理額度 (若啟用)                             │
│        │                                                           │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 7. 記錄   │ ● main_code = 2 (平台)                              │
│  │  CashOp   │ ● sub_code = 5 (轉出)                               │
│  └─────┬─────┘                                                     │
│        │                                                           │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 8. 提交   │ 提交事務，回傳成功結果                              │
│  │    回傳   │                                                     │
│  └───────────┘                                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**業務規則**:
1. **遊戲中禁止轉出**: 玩家在遊戲中或有未結算注單時不可轉出
2. **餘額充足檢查**: 轉出金額不可超過當前餘額
3. **額度回補**: 若啟用額度控制，轉出時回補代理額度

### 5.3 代理登入流程

**業務場景**: 代理商登入後台管理系統

```
┌─────────────────────────────────────────────────────────────────────┐
│                       代理登入流程                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────┐                                                     │
│  │ 1. 接收   │ account, password                                   │
│  │    請求   │                                                     │
│  └─────┬─────┘                                                     │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 2. 鎖定   │ Redis Key: {account}:login_fail_count               │
│  │    檢查   │ 若 >= 5 → 回傳 113010004 (帳號鎖定)                 │
│  └─────┬─────┘                                                     │
│        │                                                           │
│        ▼ 未鎖定                                                    │
│  ┌───────────┐                                                     │
│  │ 3. 帳密   │ ● 查詢代理帳號                                      │
│  │    驗證   │ ● 密碼比對 (bcrypt)                                 │
│  └─────┬─────┘                                                     │
│        │                                                           │
│   ┌────┴────┐                                                      │
│   │         │                                                      │
│   ▼ 失敗    ▼ 成功                                                 │
│ ┌─────────┐ ┌───────────┐                                         │
│ │ 增加    │ │ 4. 重設   │                                         │
│ │ 失敗次數│ │   失敗次數│ Redis DEL {account}:login_fail_count    │
│ └─────────┘ └─────┬─────┘                                         │
│                   ▼                                                │
│             ┌───────────┐                                          │
│             │ 5. 產生   │ Token = UUID                             │
│             │   Token   │                                          │
│             └─────┬─────┘                                          │
│                   ▼                                                │
│             ┌───────────┐                                          │
│             │ 6. 存入   │ Redis Key: {WebID}:AgentUserToken:{Token}│
│             │   Redis   │ TTL: 10 分鐘                             │
│             └─────┬─────┘                                          │
│                   ▼                                                │
│             ┌───────────┐                                          │
│             │ 7. 設定   │ Cookie: agent_user_token                 │
│             │   Cookie  │ HttpOnly, Secure                         │
│             └─────┬─────┘                                          │
│                   ▼                                                │
│             ┌───────────┐                                          │
│             │ 8. 記錄   │ IP, 時間, User-Agent                     │
│             │  登入日誌 │                                          │
│             └─────┬─────┘                                          │
│                   ▼                                                │
│             ┌───────────┐                                          │
│             │ 9. 回傳   │ 使用者資訊, 權限列表                     │
│             │   結果    │                                          │
│             └───────────┘                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**業務規則**:
1. **登入鎖定**: 連續失敗 5 次後鎖定帳號
2. **Token 管理**: 使用 UUID 產生 Token，存入 Redis
3. **自動延長**: 每次有效請求自動延長 Token 有效期
4. **安全設定**: Cookie 設定 HttpOnly 和 Secure 屬性

### 5.4 下注紀錄查詢流程

**業務場景**: 查詢玩家的下注歷史紀錄

```
┌─────────────────────────────────────────────────────────────────────┐
│                    下注紀錄查詢流程                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────┐                                                     │
│  │ 1. 接收   │ account, start_time, end_time, page_index,         │
│  │    請求   │ page_size, game_module_type                         │
│  └─────┬─────┘                                                     │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 2. 參數   │ ● 時間格式驗證                                      │
│  │    驗證   │ ● start_time <= end_time                            │
│  └─────┬─────┘ ● 時間範圍 <= 7 天                                  │
│        │       ● page_size <= 1000                                 │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 3. 資料源 │ ● 即時查詢 (< 3天) → PostgreSQL                     │
│  │    路由   │ ● 歷史報表 (>= 3天) → ClickHouse                    │
│  └─────┬─────┘                                                     │
│        │                                                           │
│   ┌────┴────────────┐                                              │
│   ▼                 ▼                                              │
│ ┌─────────┐   ┌─────────┐                                          │
│ │PostgreSQL│   │ClickHouse│                                         │
│ │ 即時查詢 │   │ 報表查詢 │                                         │
│ └────┬────┘   └────┬────┘                                          │
│      │             │                                               │
│      └──────┬──────┘                                               │
│             ▼                                                      │
│       ┌───────────┐                                                │
│       │ 4. 組合   │ ● WebID 過濾                                   │
│       │  查詢條件 │ ● AgentID 過濾 (若有)                          │
│       └─────┬─────┘ ● 時間範圍過濾                                 │
│             ▼                                                      │
│       ┌───────────┐                                                │
│       │ 5. 分頁   │ OFFSET = (page_index - 1) * page_size          │
│       │    查詢   │ LIMIT = page_size                              │
│       └─────┬─────┘                                                │
│             ▼                                                      │
│       ┌───────────┐                                                │
│       │ 6. 統計   │ COUNT(*) for total_elements                    │
│       │   總筆數  │ total_pages = ceil(total / page_size)          │
│       └─────┬─────┘                                                │
│             ▼                                                      │
│       ┌───────────┐                                                │
│       │ 7. 格式化 │ 轉換為 API Response 格式                       │
│       │    回傳   │                                                │
│       └───────────┘                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**業務規則**:
1. **資料源路由**: 近期資料從 PostgreSQL 查詢，歷史資料從 ClickHouse 查詢
2. **時間範圍限制**: 單次查詢最多 7 天
3. **分頁限制**: 單頁最多 1000 筆
4. **WebID 隔離**: 所有查詢都必須包含 WebID 過濾

### 5.5 代理階層管理流程

**業務場景**: 建立新代理、管理代理層級關係

```
┌─────────────────────────────────────────────────────────────────────┐
│                    代理建立流程                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────┐                                                     │
│  │ 1. 權限   │ ● 需要 admin 或 agent 權限                          │
│  │    檢查   │ ● 子帳號不可建立代理                                │
│  └─────┬─────┘                                                     │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 2. 層級   │ ● 取得當前代理層級                                  │
│  │    檢查   │ ● 若已是第 4 層 → 禁止建立下層                      │
│  └─────┬─────┘                                                     │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 3. 唯一性 │ ● site_code 不可重複                                │
│  │    檢查   │ ● account 不可重複                                  │
│  └─────┬─────┘                                                     │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 4. 佔成   │ ● percent <= 父代理可分配佔成                       │
│  │    驗證   │ ● 可分配 = 父佔成 - 已分配給其他子代理              │
│  └─────┬─────┘                                                     │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 5. 遊戲   │ ● 子代理遊戲列表 ⊆ 父代理遊戲列表                   │
│  │  列表驗證 │                                                     │
│  └─────┬─────┘                                                     │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 6. 建立   │ ● 產生 SecretKey (UUID)                             │
│  │    代理   │ ● 密碼加密 (bcrypt)                                 │
│  └─────┬─────┘ ● level = parent.level + 1                          │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 7. 初始化 │ ● 建立預設權限                                      │
│  │    設定   │ ● 建立遊戲設定                                      │
│  └─────┬─────┘ ● 建立限額設定                                      │
│        ▼                                                           │
│  ┌───────────┐                                                     │
│  │ 8. 回傳   │ agent_id, account, site_code                        │
│  │    結果   │                                                     │
│  └───────────┘                                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**業務規則**:
1. **層級限制**: 最多 4 層代理
2. **佔成繼承**: 子代理佔成不可超過父代理可分配額度
3. **遊戲繼承**: 子代理遊戲列表必須是父代理的子集
4. **唯一性**: site_code 和 account 必須唯一

---

## 6. API 規格定義

### 6.1 統一回應格式

```json
{
  "code": "string",      // 錯誤碼 (成功時為空字串 "")
  "status": "success | fail",
  "data": {},            // 回應資料 (失敗時為 null)
  "message": "string"    // 錯誤訊息 (成功時為空字串)
}
```

### 6.2 Platform API

#### 6.2.1 POST `/api/v2/platform/users/register`

**功能**: 註冊新使用者
**應用場景**: 第三方平台新增玩家帳號

**Headers**:
| 欄位 | 類型 | 必填 | 說明 |
|-----|-----|-----|-----|
| Secret-Key | string | 是 | 平台金鑰 |

**Request**:
```json
{
  "account": "player001",
  "display_name": "玩家一號",
  "site_code": "ABC"
}
```

**Response (成功)**:
```json
{
  "code": "",
  "status": "success",
  "data": {
    "account": "player001@ABC",
    "display_name": "玩家一號",
    "currency_type": "TWD",
    "create_time": "2026-01-14 10:30:00"
  },
  "message": ""
}
```

**Response (失敗)**:
```json
{
  "code": "112100008",
  "status": "fail",
  "data": null,
  "message": "帳號已存在"
}
```

---

#### 6.2.2 POST `/api/v2/platform/finance/credit`

**功能**: 轉入點數 (充值)
**應用場景**: 第三方平台為玩家充值遊戲點數

**Request**:
```json
{
  "account": "player001@ABC",
  "order_id": "EXT_ORDER_12345",
  "credit_amount": 1000.00,
  "delay_sec": 0
}
```

**Response (成功)**:
```json
{
  "code": "",
  "status": "success",
  "data": {
    "account": "player001@ABC",
    "balance": 1500.00,
    "order_id": "EXT_ORDER_12345",
    "credit_amount": 1000.00,
    "c_type": "real"
  },
  "message": ""
}
```

---

#### 6.2.3 POST `/api/v2/platform/finance/debit`

**功能**: 轉出點數 (提款)
**應用場景**: 第三方平台從玩家帳戶提取點數

**Request**:
```json
{
  "account": "player001@ABC",
  "order_id": "EXT_ORDER_12346",
  "debit_amount": 500.00,
  "delay_sec": 0
}
```

**Response (成功)**:
```json
{
  "code": "",
  "status": "success",
  "data": {
    "account": "player001@ABC",
    "balance": 1000.00,
    "order_id": "EXT_ORDER_12346",
    "debit_amount": 500.00,
    "c_type": "real"
  },
  "message": ""
}
```

**Response (失敗 - 玩家在遊戲中)**:
```json
{
  "code": "112240001",
  "status": "fail",
  "data": null,
  "message": "使用者在遊戲中不能轉出"
}
```

---

#### 6.2.4 POST `/api/v2/platform/finance/balance`

**功能**: 查詢餘額
**應用場景**: 第三方平台查詢玩家當前餘額

**Request**:
```json
{
  "account": "player001@ABC"
}
```

**Response**:
```json
{
  "code": "",
  "status": "success",
  "data": {
    "balance": 1500.00,
    "account": "player001@ABC",
    "c_type": "real"
  },
  "message": ""
}
```

---

#### 6.2.5 POST `/api/v2/platform/betting/history`

**功能**: 查詢下注歷史
**應用場景**: 第三方平台查詢玩家下注紀錄

**Request**:
```json
{
  "account": "player001@ABC",
  "start_time": "2026-01-01 00:00:00",
  "end_time": "2026-01-14 23:59:59",
  "page_index": 1,
  "page_size": 20,
  "game_module_type": 0
}
```

**Response**:
```json
{
  "code": "",
  "status": "success",
  "data": {
    "bet_details": [
      {
        "id_str": "123456789",
        "sid": "SID_123456",
        "game_module_type": 101,
        "game_type": 1,
        "game_round": "GR202601140001",
        "bet_point": 100.00,
        "valid_bet_point": 100.00,
        "win_point": 200.00,
        "before_point": 1000.00,
        "after_point": 1100.00,
        "bet_time": "2026-01-14 10:30:00",
        "settlement_time": "2026-01-14 10:31:00",
        "game_detail": "{...}"
      }
    ],
    "page_index": 1,
    "page_size": 20,
    "total_pages": 5,
    "total_elements": 100
  },
  "message": ""
}
```

---

### 6.3 Agent API

#### 6.3.1 POST `/api/v2/agent/auth/login`

**功能**: 代理登入
**應用場景**: 代理商登入後台管理系統

**Request**:
```json
{
  "account": "agent001",
  "password": "password123"
}
```

**Response (成功)**:
```json
{
  "code": "",
  "status": "success",
  "data": {
    "id": 100,
    "name": "代理商名稱",
    "account": "agent001",
    "email": "agent@example.com",
    "icon": "avatar.png",
    "permissions": ["admin", "agentList", "playerList", "betLogList"],
    "default_client_language": "zh-TW"
  },
  "message": ""
}
```

**Response (失敗 - 帳號鎖定)**:
```json
{
  "code": "113010004",
  "status": "fail",
  "data": null,
  "message": "帳號驗證失敗超過5次"
}
```

---

#### 6.3.2 POST `/api/v2/agent/management/agents`

**功能**: 新增代理
**應用場景**: 上層代理建立下層代理帳號
**權限需求**: `admin` 或 `agent`

**Request**:
```json
{
  "site_code": "XYZ",
  "parent_id": 1,
  "name": "新代理商",
  "account": "newagent001",
  "password": "password123",
  "email": "newagent@example.com",
  "percent": 50.00,
  "currency_type": "TWD",
  "default_client_language": "zh-TW",
  "agent_limit": 100000,
  "game_id_list": [101, 102, 10001]
}
```

**Response**:
```json
{
  "code": "",
  "status": "success",
  "data": {
    "agent_id": 101,
    "account": "newagent001",
    "site_code": "XYZ"
  },
  "message": ""
}
```

---

#### 6.3.3 POST `/api/v2/agent/reports/profit`

**功能**: 查詢輸贏報表
**應用場景**: 代理查詢指定時間範圍內的輸贏統計
**權限需求**: `reportProfit`

**Request**:
```json
{
  "agent_id": 100,
  "start_time": "2026-01-01",
  "end_time": "2026-01-14",
  "game_module_type": 0,
  "currency_type": "TWD"
}
```

**Response**:
```json
{
  "code": "",
  "status": "success",
  "data": {
    "total_bet": 1000000.00,
    "valid_bet": 950000.00,
    "win_or_lost": 50000.00,
    "player_count": 100,
    "bet_count": 5000
  },
  "message": ""
}
```

---

#### 6.3.4 POST `/api/v2/agent/reports/daily`

**功能**: 查詢每日報表
**應用場景**: 代理查詢每日下注統計
**權限需求**: `dailyBetReport`

**Request**:
```json
{
  "agent_id": 100,
  "start_time": "2026-01-01",
  "end_time": "2026-01-14",
  "page_index": 1,
  "page_size": 20
}
```

**Response**:
```json
{
  "code": "",
  "status": "success",
  "data": {
    "reports": [
      {
        "date": "2026-01-14",
        "total_bet": 100000.00,
        "valid_bet": 95000.00,
        "win_or_lost": 5000.00,
        "player_count": 50,
        "bet_count": 500
      }
    ],
    "page_index": 1,
    "page_size": 20,
    "total_pages": 1,
    "total_elements": 14
  },
  "message": ""
}
```

---

### 6.4 CMD API

#### 6.4.1 POST `/api/v2/cmd/system/kick-user`

**功能**: 踢出指定使用者
**應用場景**: 管理員強制踢出線上玩家

**Request**:
```json
{
  "uid": 12345
}
```

**Response**:
```json
{
  "code": "",
  "status": "success",
  "data": null,
  "message": ""
}
```

---

#### 6.4.2 POST `/api/v2/cmd/game/control`

**功能**: 取得遊戲控制狀態
**應用場景**: 查詢遊戲桌的風控設定

**Request**:
```json
{
  "game_type": 101
}
```

**Response**:
```json
{
  "code": "",
  "status": "success",
  "data": {
    "tables": [
      {
        "table_id": 1,
        "room_id": 1,
        "game_data": "{\"control_type\":0}"
      }
    ]
  },
  "message": ""
}
```

---

#### 6.4.3 POST `/api/v2/cmd/system/marquee`

**功能**: 推送跑馬燈
**應用場景**: 管理員發送系統公告

**Request**:
```json
{
  "msg_tw": "系統維護公告",
  "msg_en": "System maintenance notice",
  "msg_cn": "系统维护公告",
  "start_time": "2026-01-14 10:00:00",
  "end_time": "2026-01-14 12:00:00",
  "time_space_second": 60,
  "type": 2
}
```

**Response**:
```json
{
  "code": "",
  "status": "success",
  "data": {
    "marquee_id": 1
  },
  "message": ""
}
```

---

## 7. 認證與授權

### 7.1 認證方式

#### 7.1.1 Platform API - SecretKey 認證

```
認證流程:
┌─────────────────────────────────────────────────────────────┐
│ 1. 從 HTTP Header 取得 Secret-Key                          │
│ 2. Redis 快取查詢 (TTL: 5分鐘)                              │
│ 3. 若快取未命中, 查詢 PostgreSQL                            │
│ 4. 驗證 SecretKey 匹配                                      │
│ 5. 設定 Context: agent_id, web_id                           │
└─────────────────────────────────────────────────────────────┘

Redis Key 格式: {WebID}:SecretKey:{SecretKey}
快取內容: { agent_id, web_id, currency_type }
```

#### 7.1.2 Agent API - Cookie Token 認證

```
認證流程:
┌─────────────────────────────────────────────────────────────┐
│ 1. 從 Cookie 取得 agent_user_token                          │
│ 2. Redis 查詢 Token 是否存在                                │
│ 3. 若存在, 延長 Token 有效期 (10分鐘)                       │
│ 4. 設定 Context: agent_user_id, web_id, permissions         │
│ 5. 若不存在, 回傳 Token 過期錯誤 (111090007)                │
└─────────────────────────────────────────────────────────────┘

Redis Key 格式: {WebID}:AgentUserToken:{Token}
快取內容: { agent_id, web_id, account, permissions[] }
Token TTL: 10 分鐘 (每次有效請求自動延長)
```

### 7.2 權限系統 (RBAC)

#### 7.2.1 權限碼列表

| 權限碼 | 說明 | 適用功能 |
|-------|-----|---------|
| `admin` | 系統管理員 | 最高權限，可執行所有操作 |
| `agent` | 代理商 | 代理管理、下層管理 |
| `subAccount` | 子帳號 | 受限代理功能 |
| `agentList` | 代理列表 | 查看代理層級結構 |
| `subAccountList` | 子帳號列表 | 查看子帳號 |
| `playerList` | 玩家列表 | 查看玩家資料 |
| `reportProfit` | 輸贏報表 | 查看收益統計報表 |
| `gameRoundList` | 局號列表 | 查看遊戲局號 |
| `betLogList` | 下注紀錄 | 查看下注歷史 |
| `onlinePlayerList` | 線上玩家 | 查看當前在線玩家 |
| `dailyBetReport` | 每日報表 | 每日統計分析 |
| `cashOp` | 現金操作 | 查看轉帳交易紀錄 |
| `userLoginRecord` | 登入紀錄 | 查看玩家登入歷史 |
| `activity` | 活動管理 | 活動設定與報表 |
| `excelExport` | Excel 匯出 | 報表匯出功能 |
| `alertLogList` | 警示列表 | IP 異常警示 |
| `agentAllowList` | 白名單管理 | IP 白名單設定 |
| `rtpReport` | RTP 報表 | 遊戲回報率分析 |
| `getHedgingTransaction` | 對沖交易 | 對沖查詢統計 |

#### 7.2.2 權限驗證邏輯

```go
// OR 邏輯: 只要符合其中一個權限即可通過
func CheckPermission(required []string, userPermissions []string) bool {
    for _, req := range required {
        for _, perm := range userPermissions {
            if req == perm {
                return true
            }
        }
    }
    return false
}

// 範例: 需要 admin 或 agent 權限
requiredPermissions := []string{"admin", "agent"}
```

### 7.3 IP 過濾

```
IP 過濾機制:
┌─────────────────────────────────────────────────────────────┐
│ 支援格式:                                                    │
│ ● 精確 IP: 192.168.1.100                                    │
│ ● CIDR 格式: 192.168.1.0/24                                 │
│                                                              │
│ 過濾類型:                                                    │
│ ● allow_type = 1: 允許 (白名單)                             │
│ ● allow_type = 2: 禁止 (黑名單)                             │
│                                                              │
│ 處理邏輯:                                                    │
│ 1. 優先檢查黑名單，若匹配則拒絕                             │
│ 2. 若白名單非空，必須在白名單中才允許                       │
│ 3. 被拒絕的請求記錄到 alert_logs                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. 錯誤碼規範

### 8.1 錯誤碼結構

```
錯誤碼格式: 1XX YY ZZZZ
├── 1XX: 系統代碼
│   ├── 111: 共用錯誤
│   ├── 112: Platform API
│   └── 113: Agent API
├── YY: 模組代碼
│   ├── 09: 共用模組
│   ├── 10: 使用者模組
│   ├── 11: 金流模組
│   └── 24: 遊戲狀態模組
└── ZZZZ: 錯誤序號
```

### 8.2 共用錯誤碼

| 錯誤碼 | 訊息 | 說明 |
|-------|-----|-----|
| 0 | OK | 成功 |
| 111090001 | DNS錯誤 | 未登入 |
| 111090004 | 傳入參數錯誤 | 請求參數格式錯誤 |
| 111090006 | 檢查Token時發生錯誤 | Token 驗證失敗 |
| 111090007 | Token已到期 | Session 過期 |
| 111090010 | 沒有權限 | 權限不足 |
| 111090014 | 維護中 | 系統維護 |

### 8.3 Platform API 錯誤碼

| 錯誤碼 | 訊息 | 說明 |
|-------|-----|-----|
| 112090001 | 時間格式錯誤 | 時間格式不正確 |
| 112090002 | 起始時間不能在結束時間之後 | 時間範圍錯誤 |
| 112100001 | 建立使用者失敗 | 使用者註冊失敗 |
| 112100002 | 代理帳號不存在 | 找不到指定代理 |
| 112100003 | 帳號格式錯誤 | 帳號僅能是數字或英文 |
| 112100004 | 後綴碼格式錯誤 | site_code 格式不正確 |
| 112100008 | 帳號已存在 | 重複帳號 |
| 112110001 | 改變使用者餘額失敗 | 金流操作失敗 |
| 112110002 | 輸入金額不能為負或零 | 金額驗證錯誤 |
| 112240001 | 使用者在遊戲中不能轉出 | 遊戲中禁止轉出 |
| 112260001 | OrderID 長度超過50 | 訂單號過長 |
| 112280001 | 代理額度不足 | 額度不足 |
| 112280002 | 代理被鎖定 | 代理帳號被停用 |

### 8.4 Agent API 錯誤碼

| 錯誤碼 | 訊息 | 說明 |
|-------|-----|-----|
| 113010001 | 帳號密碼錯誤 | 登入失敗 |
| 113010004 | 驗證失敗超過5次 | 帳號鎖定 |
| 113110001 | 代理帳號已存在 | 重複帳號 |
| 113110005 | 代理層級最多四層 | 層級限制 |
| 113110008 | 後綴碼已存在 | 重複 site_code |
| 113110009 | 佔成比例超過限制 | 佔成驗證失敗 |
| 113110010 | 遊戲列表超過父代理範圍 | 遊戲繼承驗證失敗 |

---

## 附錄

### A. 遊戲模組代碼對照表

| 代碼範圍 | 類型 | game_module_type | 說明 |
|---------|-----|------------------|-----|
| 101-199 | 百人遊戲 | 1 | 百家樂、龍虎等 |
| 201-299 | 對戰遊戲 | 2 | 二八槓、德州等 |
| 10001-19999 | 老虎機 | 3 | 各類 Slot 遊戲 |
| 20001-29999 | 魚機 | 4 | 捕魚遊戲 |

### B. 幣別代碼

| 代碼 | 幣別 |
|-----|-----|
| TWD | 新台幣 |
| CNY | 人民幣 |
| USD | 美元 |
| VND | 越南盾 |
| THB | 泰銖 |

### C. CashOp 操作代碼

| main_code | 說明 |
|-----------|-----|
| 1 | 遊戲 |
| 2 | 平台 |
| 3 | 活動 |

| sub_code | 說明 |
|----------|-----|
| 1 | 下注 |
| 2 | 派獎 |
| 3 | 紅包 |
| 4 | 轉入 |
| 5 | 轉出 |

### D. 相關文件

- [API 文檔 (含完整範例)](./BACKENDSERVER_API.md)
- [系統架構追蹤](./ARCHITECTURE_TRACE.md)

---

*文檔版本: 2.0*
*建立日期: 2026-01-14*
*架構模式: DDD / Clean Architecture*
*資料庫: PostgreSQL (OLTP) + ClickHouse (OLAP)*
