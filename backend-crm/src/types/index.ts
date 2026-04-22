// ─────────────────────────────────────────────────────────────────────────
// src/types/index.ts
// Single source of truth for all domain types.
// Import from here everywhere — never redefine inline.
// ─────────────────────────────────────────────────────────────────────────

// ── Enums (mirror PostgreSQL enum values exactly) ────────────────────────

export type UserRole =
  | 'CUSTOMER_CARE'
  | 'TECHNICIAN'
  | 'SUPERVISOR'
  | 'SALES_REPRESENTATIVE'
  | 'HEAD_OF_DEPARTMENT'
  | 'HUMAN_RESOURCES'
  | 'ADMIN';

export type TicketStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'CLOSED_CUST_PICKUP'
  | 'CLOSED'
  | 'REOPENED'
  | 'ESCALATED';

export type JobCardStatus =
  | 'CREATED'
  | 'CHECKLIST_PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PENDING_APPROVAL'
  | 'CLOSED';

export type DeviceCondition = 'GOOD' | 'FAIR' | 'DAMAGED' | 'CRITICAL';

export type RequisitionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type LeaveCategory =
  | 'ANNUAL_LEAVE'
  | 'SICK_LEAVE'
  | 'MATERNITY_LEAVE'
  | 'PATERNITY_LEAVE'
  | 'COMPASSIONATE_LEAVE';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type FundsStatus =
  | 'DRAFT'
  | 'PENDING_SUPERVISOR'
  | 'PENDING_FINANCE'
  | 'APPROVED'
  | 'REJECTED';

// ── Database row types (what pg returns) ─────────────────────────────────

export interface UserRow {
  user_id:       string;
  name:          string;
  email:         string;
  password_hash: string;
  role:          UserRole;
  phone:         string | null;
  is_active:     boolean;
  created_at:    Date;
  updated_at:    Date;
}

export interface CustomerRow {
  customer_id: string;
  name:        string;
  phone:       string | null;
  email:       string | null;
  address:     string | null;
  kra_pin:     string | null;
  qb_customer_id: string | null;
  created_at:  Date;
  updated_at:  Date;
}

export interface DeviceRow {
  device_id:     string;
  customer_id:   string;
  serial_number: string | null;
  brand:         string | null;
  model:         string | null;
  device_type:   string | null;
  created_at:    Date;
  updated_at:    Date;
  // joined fields
  customer_name?: string;
}

export interface TicketRow {
  ticket_id:        string;
  ticket_type:      string | null;
  customer_id:      string;
  device_id:        string | null;
  assigned_user_id: string | null;
  status:           TicketStatus;
  reopen_count:     number;
  escalation_flag:  boolean;
  duplicate_flag:   boolean;
  linked_ticket_id: string | null;
  notes:            string | null;
  created_at:       Date;
  updated_at:       Date;
  closed_at:        Date | null;
  // joined fields
  customer_name?:   string;
  customer_phone?:  string | null;
  customer_email?:  string | null;
  device_brand?:    string | null;
  device_model?:    string | null;
  device_serial?:   string | null;
  device_type?:     string | null;
  assigned_to?:     string | null;
}

export interface JobCardRow {
  job_card_id:       string;
  ticket_id:         string;
  technician_id:     string;
  supervisor_id:     string | null;
  status:            JobCardStatus;
  diagnosis_notes:   string | null;
  repair_notes:      string | null;
  approval_deferred: boolean;
  created_at:        Date;
  updated_at:        Date;
  closed_at:         Date | null;
  // joined fields
  technician_name?:  string;
  supervisor_name?:  string | null;
  ticket_status?:    TicketStatus;
  customer_name?:    string;
}

export interface ChecklistItemRow {
  checklist_id: string;
  job_card_id:  string;
  item_name:    string;
  is_completed: boolean;
  completed_at: Date | null;
  created_at:   Date;
}

export interface TimeLogRow {
  time_log_id:    string;
  job_card_id:    string;
  technician_id:  string;
  start_time:     Date;
  end_time:       Date | null;
  duration_mins:  number | null;
  notes:          string | null;
  created_at:     Date;
  technician_name?: string;
}

export interface InventoryRow {
  inventory_id:  string;
  part_name:     string;
  sku:           string | null;
  quantity:      number;
  reorder_level: number;
  created_at:    Date;
  updated_at:    Date;
}

export interface PartsUsedRow {
  parts_used_id: string;
  job_card_id:   string;
  inventory_id:  string;
  quantity_used: number;
  created_at:    Date;
  part_name?:    string;
  sku?:          string | null;
}

export interface StockRequisitionRow {
  requisition_id:     string;
  job_card_id:        string;
  requested_by:       string;
  approved_by:        string | null;
  inventory_id:       string;
  quantity_requested: number;
  status:             RequisitionStatus;
  created_at:         Date;
  updated_at:         Date;
  requested_by_name?: string;
  approved_by_name?:  string | null;
  part_name?:         string;
}

export interface IncidentLogRow {
  incident_id:       string;
  job_card_id:       string;
  reported_by:       string;
  description:       string;
  created_at:        Date;
  reported_by_name?: string;
}

export interface LeaveRequestRow {
  leave_id:          string;
  user_id:           string;
  category:          LeaveCategory;
  start_date:        Date;
  end_date:          Date;
  duty_resume_date:  Date;
  days_requested:    number;
  reason:            string | null;
  status:            LeaveStatus;
  reviewed_by:       string | null;
  reviewed_at:       Date | null;
  review_notes:      string | null;
  overlap_flag:      boolean;
  sick_certificate:  boolean;
  created_at:        Date;
  updated_at:        Date;
  employee_name?:    string;
  employee_role?:    UserRole;
  reviewed_by_name?: string | null;
}

export interface LeaveBalanceRow {
  balance_id:      string;
  user_id:         string;
  year:            number;
  accrued_days:    number;
  used_days:       number;
  carried_forward: number;
  updated_at:      Date;
  available_days?: number;
}

export interface FundsRequisitionRow {
  requisition_id:       string;
  requisition_number:   string | null;
  requested_by:         string;
  purpose:              string;
  category:             string;
  justification:        string;
  amount_kes:           number;
  amount_words:         string;
  department:           string | null;
  status:               FundsStatus;
  supervisor_id:        string | null;
  supervisor_signed_at: Date | null;
  finance_id:           string | null;
  finance_signed_at:    Date | null;
  final_approver_id:    string | null;
  final_signed_at:      Date | null;
  rejection_reason:     string | null;
  created_at:           Date;
  updated_at:           Date;
  requested_by_name?:   string;
  requested_by_role?:   UserRole;
  supervisor_name?:     string | null;
  finance_name?:        string | null;
  final_approver_name?: string | null;
}

// ── API payload types (what controllers send/receive) ────────────────────

export interface JwtPayload {
  user_id: string;
  name:    string;
  email:   string;
  role:    UserRole;
  iat?:    number;
  exp?:    number;
}

export interface ApiError {
  status:  number;
  message: string;
}

// ── Express augmentation — adds req.user typed as JwtPayload ─────────────
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}