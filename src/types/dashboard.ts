export interface DashboardStats {
    wallet: {
        balance: number;
        credit_limit: number;
        currency: string;
        exchange_rate: number;
    };
    today_kpi: {
        total_bet: number;
        net_win: number;
        active_players: number;
        tx_count: number;
        comparison: {
            bet_pct: number;
            win_pct: number;
            player_pct: number;
        };
    };
    trend_7d: Array<{
        date: string; // ISO date string
        bet: number;
        net_win: number;
    }>;
    alerts: Array<{
        type: 'invoice' | 'reject';
        message: string;
        count: number;
    }>;
    top_games: Array<{
        name: string;
        bet: number;
        win: number;
    }>;
}
