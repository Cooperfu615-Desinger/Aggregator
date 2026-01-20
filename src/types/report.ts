export interface GameDetail {
    round_id: string;
    matrix: string[][];
    lines_won: { line_id: number; win: number; symbols: string[] }[];
    free_games_triggered: boolean;
    multiplier: number;
    currency: string;
}

export interface BetLog {
    // Core identifiers
    round_id: string; // e.g., "R-882190..."
    id: string; // Platform internal ID
    created_at: string; // ISO timestamp

    // Merchant information
    merchant_display_id: string; // e.g., "OP-1001"
    merchant_name: string; // e.g., "Golden Dragon"

    // Game information
    provider_name: string; // e.g., "PG Soft"
    game_name: string;

    // Player identifiers (dual-layer)
    agg_player_id: string; // Platform player ID, e.g., "PL-9988"
    merchant_member_id: string; // Merchant's member ID, e.g., "mem_user_01"

    // Financial data
    bet_amount: number;
    payout_amount: number;
    net_win: number; // Computed: payout_amount - bet_amount
    currency: string;

    // Status
    status: 'settled' | 'unsettled' | 'cancelled';

    // Detail payload
    game_detail?: GameDetail;

    // Legacy fields (for backward compatibility)
    player_account?: string;
    player_id?: string;
    win_amount?: number;
    profit?: number;
    payout?: number;
    merchant_code?: string;
    providerCode?: string;
    providerName?: string;
    originalBet?: number;
    originalWin?: number;
    exchangeRate?: number;
    providerId?: number;
    txId?: string;
    currencyBaseAmount?: number;
}

export interface BetLogSearchResponse {
    code: number;
    msg: string;
    data: {
        list: BetLog[];
        total: number;
    };
}

export interface FinancialReportItem {
    key: string; // Date (YYYY-MM-DD) or Agent Name
    total_bet: number;
    total_win: number;
    ggr: number; // bet - win
    rtp: number; // (win / bet) * 100
    round_count: number;
}
