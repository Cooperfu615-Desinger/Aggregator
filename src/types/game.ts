export interface Game {
    game_id: string;
    name_en: string;
    name_zh?: string;
    provider: string; // 'PGSoft' | 'JILI' | 'PragmaticPlay'
    providerId?: number;
    type: string; // 'Slot' | 'Live' | 'Fishing'
    rtp_default: number;
    status: 'active' | 'maintenance';
    thumbnail?: string;
}

export interface GameListResponse {
    code: number;
    msg: string;
    data: {
        list: Game[];
        total: number;
    };
}
