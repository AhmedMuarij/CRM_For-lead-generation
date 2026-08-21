// ─── Enums ────────────────────────────────────────────────────

export type UserRole = "MANAGER" | "EMPLOYEE";

export type LeadStatus =
    | "NEW"
    | "CONTACTED"
    | "FOLLOW_UP"
    | "PENDING"
    | "NO_RESPONSE"
    | "WON"
    | "LOST";

export type CallOutcome =
    | "INTERESTED"
    | "NOT_INTERESTED"
    | "FOLLOW_UP_REQUIRED"
    | "PENDING"
    | "NO_ANSWER"
    | "BUSY"
    | "WRONG_NUMBER"
    | "OTHER";

export type FollowUpStatus =
    | "SCHEDULED"
    | "COMPLETED"
    | "OVERDUE"
    | "CANCELLED";

// ─── Models ───────────────────────────────────────────────────

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    active: boolean;
    created_at: string;
    assigned_leads_count?: number;
    active_leads_count?: number;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    role: UserRole;
    user_id: number;
    name: string;
}

export interface Lead {
    id: number;
    external_lead_id?: string;
    customer_name: string;
    phone: string;
    email?: string;
    city?: string;
    country?: string;
    gender?: string;
    vehicle_interest?: string;
    vehicle_version?: string;
    vehicle_variant?: string;
    lead_type?: string;
    units?: string;
    operation_type?: string;
    preferred_call_time?: string;
    source?: string;
    campaign?: string;
    raw_source_data?: Record<string, string>;
    status: LeadStatus;
    assigned_employee_id?: number;
    assigned_employee_name?: string;
    contact_attempt_count: number;
    last_call_at?: string;
    next_follow_up_at?: string;
    internal_notes?: string;
    source_created_at?: string;
    created_at: string;
    updated_at: string;
}

export interface LeadListItem {
    id: number;
    external_lead_id?: string;
    customer_name: string;
    phone: string;
    city?: string;
    vehicle_interest?: string;
    units?: string;
    operation_type?: string;
    status: LeadStatus;
    assigned_employee_id?: number;
    assigned_employee_name?: string;
    contact_attempt_count: number;
    next_follow_up_at?: string;
    created_at: string;
}

export interface PaginatedLeads {
    items: LeadListItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface CallLog {
    id: number;
    lead_id: number;
    employee_id: number;
    employee_name?: string;
    call_datetime: string;
    outcome: CallOutcome;
    notes?: string;
    attempt_number: number;
    created_at: string;
}

export interface FollowUp {
    id: number;
    lead_id: number;
    employee_id: number;
    scheduled_at: string;
    completed_at?: string;
    status: FollowUpStatus;
    notes?: string;
    created_at: string;
    updated_at: string;
    customer_name?: string;
    phone?: string;
    vehicle_interest?: string;
    lead_status?: LeadStatus;
    last_call_at?: string;
    assigned_employee_name?: string;
}

export interface LeadNote {
    id: number;
    lead_id: number;
    employee_id: number;
    employee_name?: string;
    content: string;
    created_at: string;
}

export interface AuditLog {
    id: number;
    lead_id: number;
    user_id: number | null;
    user_name?: string;
    action: string;
    field_name?: string;
    old_value?: string;
    new_value?: string;
    description?: string;
    created_at: string;
}

// ─── Dashboard Types ──────────────────────────────────────────

export interface EmployeeDashboard {
    stats: {
        total: number;
        new: number;
        contacted: number;
        follow_up: number;
        pending: number;
        no_response: number;
        won: number;
        lost: number;
        overdue: number;
        today_follow_ups: number;
        upcoming: number;
    };
    overdue_follow_ups: FollowUpSummary[];
    today_follow_ups: FollowUpSummary[];
    new_leads: LeadSummary[];
}

export interface FollowUpSummary {
    follow_up_id: number;
    lead_id: number;
    customer_name: string;
    phone: string;
    vehicle_interest?: string;
    scheduled_at: string;
    notes?: string;
}

export interface LeadSummary {
    lead_id: number;
    customer_name: string;
    phone: string;
    city?: string;
    vehicle_interest?: string;
    status: LeadStatus;
    created_at: string;
}

export interface EmployeePerf {
    employee_id: number;
    employee_name: string;
    assigned: number;
    new: number;
    contacted: number;
    follow_up: number;
    pending: number;
    no_response: number;
    won: number;
    lost: number;
    overdue: number;
}

export interface ManagerDashboard {
    stats: Record<string, number> & {
        total_leads: number;
        overdue_follow_ups: number;
        today_follow_ups: number;
    };
    employee_performance: EmployeePerf[];
}
