export interface Provider {
    id: number;
    code: string;
    name: string;
    status: 'active' | 'maintenance';
    apiConfig: {
        apiUrl?: string;
        merchantCode?: string;
        secretKey?: string;
        revenueShare?: number;
        currency?: string;
        [key: string]: any;
    };
    type?: string;
}

export interface ProviderListResponse {
    code: number;
    msg: string;
    data: {
        list: Provider[];
        total: number;
    };
}
