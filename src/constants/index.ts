export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  RESTAURANT_ADMIN: 'RESTAURANT_ADMIN',
  KITCHEN_STAFF: 'KITCHEN_STAFF',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const RESTAURANT_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  BLOCKED: 'BLOCKED',
} as const;

export type RestaurantStatus = (typeof RESTAURANT_STATUS)[keyof typeof RESTAURANT_STATUS];

export const LEAD_STATUS = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  DEMO_SCHEDULED: 'DEMO_SCHEDULED',
  CONVERTED: 'CONVERTED',
  CLOSED: 'CLOSED',
} as const;

export type LeadStatus = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS];

export const ORDER_STATUS = {
  NEW: 'NEW',
  ACCEPTED: 'ACCEPTED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['ACCEPTED', 'PREPARING', 'CANCELLED'],
  ACCEPTED: ['PREPARING'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const PAYMENT_METHOD = {
  CASH: 'CASH',
  UPI: 'UPI',
  CARD: 'CARD',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const SOCKET_EVENTS = {
  NEW_ORDER: 'new-order',
  ORDER_ACCEPTED: 'order-accepted',
  ORDER_PREPARING: 'order-preparing',
  ORDER_READY: 'order-ready',
  ORDER_COMPLETED: 'order-completed',
  ORDER_CANCELLED: 'order-cancelled',
  PAYMENT_UPDATED: 'payment-updated',
} as const;

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  RESTAURANT_SUSPENDED: 'RESTAURANT_SUSPENDED',
  RESTAURANT_BLOCKED: 'RESTAURANT_BLOCKED',
  INVALID_ORDER_TRANSITION: 'INVALID_ORDER_TRANSITION',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
} as const;
