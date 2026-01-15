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
}

export interface BetLogSearchResponse {
    code: number;
    msg: string;
    data: {
        list: BetLog[];
        total: number;
    };
}
