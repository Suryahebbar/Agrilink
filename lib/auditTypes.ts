/**
 * auditTypes.ts
 * Centralised enum and type definitions for the AgriLink audit logging system.
 * Imported by AdminAuditLog.ts, auditLogger.ts, and all API routes.
 */

export enum ActivityStatus {
  SUCCESS = 'success',
  FAILED  = 'failed',
  PENDING = 'pending',
}

export enum ActivityAction {
  // Generic CRUD
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  // Auth / Security
  LOGIN          = 'login',
  LOGOUT         = 'logout',
  LOGIN_FAILED   = 'login_failed',
  OTP_REQUEST    = 'otp_request',
  OTP_VERIFY     = 'otp_verify',
  PASSWORD_CHANGE  = 'password_change',
  ROLE_CHANGE      = 'role_change',
  NEW_DEVICE_LOGIN = 'new_device_login',
  // Agreement lifecycle
  AGREEMENT_OPENED         = 'agreement_opened',
  AGREEMENT_SCROLLED       = 'agreement_scrolled',
  AGREEMENT_SIGNED         = 'agreement_signed',
  AGREEMENT_REJECTED       = 'agreement_rejected',
  AGREEMENT_APPROVED       = 'agreement_approved',
  AGREEMENT_STATUS_CHANGED = 'agreement_status_changed',
  AGREEMENT_DOWNLOADED     = 'agreement_downloaded',
  // Signature
  SIGNATURE_METHOD_SELECTED = 'signature_method_selected',
  SIGNATURE_CAPTURED        = 'signature_captured',
  // Blockchain
  BLOCKCHAIN_SEALED  = 'blockchain_sealed',
  CONTRACT_VERIFIED  = 'contract_verified',
  // PDF
  PDF_GENERATED = 'pdf_generated',
  // Documents
  UPLOAD             = 'upload',
  UPLOAD_FAILED      = 'upload_failed',
  DOCUMENT_VERIFIED  = 'document_verified',
  DOCUMENT_REJECTED  = 'document_rejected',
  // Land
  LAND_ADDED         = 'land_added',
  LAND_UPDATED       = 'land_updated',
  POLYGON_UPLOADED   = 'polygon_uploaded',
  BOUNDARY_UPDATED   = 'boundary_updated',
  OWNERSHIP_CHANGED  = 'ownership_changed',
  LEASE_STARTED      = 'lease_started',
  LEASE_ENDED        = 'lease_ended',
  // Financial
  REVENUE_CALCULATED        = 'revenue_calculated',
  PROFIT_SHARE_CALCULATED   = 'profit_share_calculated',
  PAYMENT_GENERATED         = 'payment_generated',
  PAYMENT_COMPLETED         = 'payment_completed',
  PAYMENT_FAILED            = 'payment_failed',
  // System
  EMAIL_SENT                  = 'email_sent',
  SMS_SENT                    = 'sms_sent',
  CLOUDINARY_UPLOAD_SUCCESS   = 'cloudinary_upload_success',
  CLOUDINARY_UPLOAD_FAILED    = 'cloudinary_upload_failed',
  // Legacy kept for compatibility
  APPROVE        = 'approve',
  REJECT         = 'reject',
  VERIFY         = 'verify',
  SUBMIT         = 'submit',
  CANCEL         = 'cancel',
  PAYMENT        = 'payment',
  REFUND         = 'refund',
  STATUS_CHANGE  = 'status_change',
  DOWNLOAD       = 'download',
  EXPORT         = 'export',
  IMPORT         = 'import',
}

export enum ResourceType {
  USER               = 'user',
  FARMER             = 'farmer',
  SUPPLIER           = 'supplier',
  FCO                = 'fco',
  ADMIN              = 'admin',
  FARM_POOL          = 'farm_pool',
  AGREEMENT          = 'agreement',
  AGREEMENT_VERSION  = 'agreement_version',
  SIGNATURE          = 'signature',
  DOCUMENT           = 'document',
  LAND               = 'land',
  POLYGON            = 'polygon',
  FINANCIAL          = 'financial',
  PAYMENT            = 'payment',
  SYSTEM             = 'system',
  SECURITY           = 'security',
  NOTIFICATION       = 'notification',
  // Legacy
  ORDER        = 'order',
  PRODUCT      = 'product',
  INVENTORY    = 'inventory',
  SETTINGS     = 'settings',
  AUDIT_LOG    = 'audit_log',
  MARKETPLACE  = 'marketplace',
}

export enum LogModule {
  AGREEMENT  = 'Agreement',
  SECURITY   = 'Security',
  LAND       = 'Land',
  FINANCIAL  = 'Financial',
  DOCUMENT   = 'Document',
  BLOCKCHAIN = 'Blockchain',
  SYSTEM     = 'System',
  FARMER     = 'Farmer',
  ADMIN      = 'Admin',
}
