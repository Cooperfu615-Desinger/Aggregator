export interface Agent {
    id: number;
    account: string;
    site_code: string;
    level: number;
    parent_id: number | null;
    balance: number;
    percent: number; // Share percentage
    state: 'active' | 'disabled';
    created_at: string;
    children_count?: number; // Mock helper to indicate if sub-agents exist
}

export interface AgentListResponse {
    code: number;
    msg: string;
    data: {
        list: Agent[];
        total: number;
    };
}
