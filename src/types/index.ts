export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "SITE_VISIT"
  | "QUALIFIED"
  | "NEGOTIATION"
  | "CONVERTED"
  | "LOST";

export type UnitStatus = "AVAILABLE" | "HOLD" | "BOOKED" | "SOLD" | "BLOCKED";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export type PaymentStatus = "PAID" | "PARTIAL" | "PENDING" | "OVERDUE" | "FAILED";

export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_TRACK" | "DELAYED" | "COMPLETED";

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type AgreementStatus = "DRAFT" | "GENERATED" | "SENT" | "SIGNED" | "CANCELLED";

export type SiteVisitStatus = "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";

export type FollowUpStatus = "OPEN" | "COMPLETED" | "CANCELLED";

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type MilestoneStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "ON_TRACK"
  | "DELAYED"
  | "COMPLETED";

export type CommissionStatus = "PENDING" | "ELIGIBLE" | "APPROVED" | "PAID" | "CANCELLED";

export type PaymentMode =
  | "BANK_TRANSFER"
  | "UPI"
  | "CHEQUE"
  | "CASH"
  | "CARD"
  | "NEFT"
  | "RTGS"
  | "OTHER";

export type LeadSource =
  | "WEBSITE"
  | "WALK_IN"
  | "REFERRAL"
  | "CHANNEL_PARTNER"
  | "FACEBOOK"
  | "GOOGLE_ADS"
  | "PROPERTY_PORTAL"
  | "EXHIBITION";

export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SALES_MANAGER"
  | "SALES_EXECUTIVE"
  | "ACCOUNTS"
  | "PROJECT_MANAGER";

export type DocumentType =
  | "PAN"
  | "AADHAAR"
  | "KYC"
  | "AGREEMENT"
  | "BOOKING_FORM"
  | "DEMAND_LETTER"
  | "INVOICE"
  | "PAYMENT_RECEIPT"
  | "POSSESSION_LETTER"
  | "OTHER";

export type EntityKind =
  | "LEAD"
  | "CUSTOMER"
  | "PROJECT"
  | "UNIT"
  | "BOOKING"
  | "AGREEMENT"
  | "INVOICE"
  | "PAYMENT";

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
}

export interface Lead extends BaseEntity {
  code: string;
  name: string;
  phone: string;
  email: string;
  source: LeadSource;
  projectId: string | null;
  budget: number;
  status: LeadStatus;
  assignedToId: string;
  channelPartnerId: string | null;
  nextFollowUpAt: string | null;
  requirement: string;
  notes: string;
}

export interface FollowUp extends BaseEntity {
  code: string;
  leadId: string | null;
  customerId: string | null;
  title: string;
  dueAt: string;
  assignedToId: string;
  priority: Priority;
  status: FollowUpStatus;
  notes: string;
}

export interface SiteVisit extends BaseEntity {
  code: string;
  leadId: string | null;
  customerId: string | null;
  projectId: string;
  visitAt: string;
  assignedToId: string;
  visitors: number;
  status: SiteVisitStatus;
  notes: string;
}

export interface Customer extends BaseEntity {
  code: string;
  name: string;
  phone: string;
  email: string;
  pan: string;
  address: string;
  city: string;
  source: LeadSource;
  assignedToId: string;
  leadId: string | null;
}

export interface Project extends BaseEntity {
  code: string;
  name: string;
  city: string;
  address: string;
  developer: string;
  reraNumber: string;
  startDate: string;
  completionDate: string;
  status: ProjectStatus;
  description: string;
  archived: boolean;
}

export interface Tower extends BaseEntity {
  code: string;
  name: string;
  projectId: string;
  floors: number;
  unitsPerFloor: number;
  status: ProjectStatus;
}

export interface Unit extends BaseEntity {
  code: string;
  projectId: string;
  towerId: string;
  floor: number;
  bhk: number;
  carpetArea: number;
  facing: string;
  basePrice: number;
  plc: number;
  parking: number;
  floorRise: number;
  otherCharges: number;
  status: UnitStatus;
  holdCustomerId: string | null;
  holdSalespersonId: string | null;
  holdUntil: string | null;
  holdReason: string | null;
}

export interface Booking extends BaseEntity {
  code: string;
  customerId: string;
  projectId: string;
  towerId: string;
  unitId: string;
  bookingDate: string;
  bookingAmount: number;
  agreementValue: number;
  status: BookingStatus;
  salespersonId: string;
  channelPartnerId: string | null;
  paymentPlanId: string | null;
  notes: string;
}

export interface Agreement extends BaseEntity {
  code: string;
  bookingId: string;
  agreementDate: string;
  agreementValue: number;
  status: AgreementStatus;
  notes: string;
}

export interface PaymentPlanMilestone {
  id: string;
  name: string;
  percentage: number;
  dueType: "BOOKING" | "DATE" | "CONSTRUCTION";
  dueDate: string | null;
  constructionMilestone: string | null;
}

export interface PaymentPlan extends BaseEntity {
  code: string;
  name: string;
  projectId: string | null;
  description: string;
  milestones: PaymentPlanMilestone[];
}

export interface Invoice extends BaseEntity {
  code: string;
  bookingId: string;
  customerId: string;
  unitId: string;
  demandType: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  taxRate: number;
  status: InvoiceStatus;
  notes: string;
}

export interface Payment extends BaseEntity {
  code: string;
  invoiceId: string | null;
  bookingId: string;
  customerId: string;
  paymentDate: string;
  amount: number;
  mode: PaymentMode;
  reference: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  notes: string;
}

export interface ChannelPartner extends BaseEntity {
  code: string;
  company: string;
  contactPerson: string;
  phone: string;
  email: string;
  reraNumber: string;
  commissionPct: number;
  city: string;
  active: boolean;
}

export interface Commission extends BaseEntity {
  code: string;
  bookingId: string;
  channelPartnerId: string;
  percentage: number;
  amount: number;
  status: CommissionStatus;
  paidAmount: number;
}

export interface ConstructionMilestone extends BaseEntity {
  projectId: string;
  name: string;
  sequence: number;
  startDate: string;
  expectedDate: string;
  actualDate: string | null;
  progress: number;
  status: MilestoneStatus;
  notes: string;
}

export interface DocumentRecord extends BaseEntity {
  name: string;
  type: DocumentType;
  entityKind: EntityKind;
  entityId: string;
  uploadedById: string;
  sizeKb: number;
  status: "PENDING" | "VERIFIED" | "REJECTED";
}

export interface Activity {
  id: string;
  entityKind: EntityKind;
  entityId: string;
  at: string;
  title: string;
  description: string;
  actorId: string;
}

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  filters?: Record<string, string | undefined>;
}

export interface ListResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
