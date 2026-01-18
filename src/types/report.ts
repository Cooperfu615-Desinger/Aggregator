export interface GameDetail {
    round_id: string;
    matrix: string[][];
    lines_won: { line_id: number; win: number; symbols: string[] }[];
    free_games_triggered: boolean;
    multiplier: number;
    currency: string;
}

export interface BetLog {
    id: string; // Round ID
    created_at: string; // Time
    player_account: string;
    game_name: string;
    bet_amount: number;
    win_amount: number;
    profit: number; // win - bet
    currency: string;
    payout: number; // multiplier
    status: 'win' | 'loss' | 'refund';
    game_detail: GameDetail;
    // New fields
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
