export interface Merchant {
    id: number;
    site_code: string; // 3 uppercase chars
    account: string;
    name: string;
    currency_type: 'TWD' | 'CNY' | 'USD';
    percent: number;
    state: number; // 1=Active, 0=Inactive
    created_at: string;
    // New fields
    walletMode?: 'seamless' | 'transfer';
    secretKey?: string;
    ipWhitelist?: string[];
    baseCurrency?: string;
}

export interface MerchantDetail extends Merchant {
    secret_key: string; // UUID
    wallet_mode: 'transfer' | 'seamless';
    ip_whitelist: string[];
    rtp_level: number;
}
