export interface Merchant {
    id: number;
    display_id: string; // OP-xxxx
    site_code: string; // 3 uppercase chars - now acts as "Merchant Name"
    account: string;
    // name field is repurposed as remarks or we use remarks explicitly
    name: string; // Keeping for compatibility, but conceptualized as Remarks? Or just add remarks.
    remarks?: string; // Explicit remarks field
    currency_type: 'TWD' | 'CNY' | 'USD';
    percent: number; // Keep for backend compat, but UI uses revenue_share
    revenue_share?: number;
    state: number; // 1=Active, 0=Inactive
    created_at: string;
    // Extended fields
    walletMode?: 'seamless' | 'transfer';
    secretKey?: string;
    ipWhitelist?: string[];
    baseCurrency?: string;
    balance?: number; // Transfer wallet balance
}

export interface MerchantDetail extends Merchant {
    secret_key: string; // UUID
    wallet_mode: 'transfer' | 'seamless';
    ip_whitelist: string[];
    rtp_level: number;
}
