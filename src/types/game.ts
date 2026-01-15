export interface Game {
    game_id: string;
    name_en: string;
    provider: string; // 'PGSoft' | 'JILI' | 'PragmaticPlay'
    type: string; // 'Slot' | 'Live' | 'Fishing'
    rtp_default: number;
    status: 'active' | 'maintenance';
}

export interface GameListResponse {
    code: number;
    msg: string;
    data: {
        list: Game[];
        total: number;
    };
}
