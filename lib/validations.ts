import { z } from 'zod';

// ============= Common Schemas =============

export const uuidSchema = z.string().uuid('Invalid UUID format');
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format');
export const emailSchema = z.string().email('Invalid email format').max(255);
export const positiveNumberSchema = z.number().positive('Amount must be positive');
export const percentageSchema = z.number().min(0).max(100, 'Percentage must be 0-100');

// ============= Category Schemas =============

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  icon: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  deduction_percentage: percentageSchema.optional().default(100),
  is_default: z.boolean().optional().default(false),
  user_id: uuidSchema.optional(),
});

export const createCategoriesSchema = z.object({
  categories: z.array(categorySchema).min(1, 'At least one category is required'),
  user_id: uuidSchema.optional(),
});

export const updateCategorySchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  deduction_percentage: percentageSchema.optional(),
  is_default: z.boolean().optional(),
});

export const deleteCategorySchema = z.object({
  id: uuidSchema,
});

// ============= Recurring Expense Schemas =============

export const frequencyEnum = z.enum([
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'annually',
]);

export const paymentMethodEnum = z.enum([
  'credit',
  'debit',
  'cash',
  'check',
  'bank_transfer',
  'other',
]);

export const createRecurringExpenseSchema = z.object({
  user_id: uuidSchema,
  amount: z.union([z.number(), z.string()]).transform((val) =>
    typeof val === 'string' ? parseFloat(val) : val
  ).refine((val) => val > 0, 'Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(500),
  category_id: uuidSchema.optional().nullable(),
  vendor: z.string().max(200).optional().nullable(),
  payment_method: paymentMethodEnum.optional().default('credit'),
  is_business: z.boolean().optional().default(true),
  notes: z.string().max(1000).optional().nullable(),
  frequency: frequencyEnum,
  start_date: dateSchema,
});

export const updateRecurringExpenseSchema = z.object({
  id: uuidSchema,
  amount: z.union([z.number(), z.string()]).transform((val) =>
    typeof val === 'string' ? parseFloat(val) : val
  ).refine((val) => val > 0, 'Amount must be positive').optional(),
  description: z.string().min(1).max(500).optional(),
  category_id: uuidSchema.optional().nullable(),
  vendor: z.string().max(200).optional().nullable(),
  payment_method: paymentMethodEnum.optional(),
  is_business: z.boolean().optional(),
  notes: z.string().max(1000).optional().nullable(),
  frequency: frequencyEnum.optional(),
  start_date: dateSchema.optional(),
  next_due_date: dateSchema.optional(),
  is_active: z.boolean().optional(),
});

// ============= Expense Schemas =============

export const createExpenseSchema = z.object({
  user_id: uuidSchema,
  amount: z.union([z.number(), z.string()]).transform((val) =>
    typeof val === 'string' ? parseFloat(val) : val
  ).refine((val) => val > 0, 'Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(500),
  category_id: uuidSchema.optional().nullable(),
  vendor: z.string().max(200).optional().nullable(),
  date: dateSchema,
  payment_method: paymentMethodEnum.optional().default('credit'),
  is_business: z.boolean().optional().default(true),
  notes: z.string().max(1000).optional().nullable(),
  receipt_url: z.string().url().optional().nullable(),
  tax_amount: z.number().min(0).optional().nullable(),
  subtotal: z.number().min(0).optional().nullable(),
});

export const updateExpenseSchema = z.object({
  id: uuidSchema,
  amount: z.union([z.number(), z.string()]).transform((val) =>
    typeof val === 'string' ? parseFloat(val) : val
  ).refine((val) => val > 0, 'Amount must be positive').optional(),
  description: z.string().min(1).max(500).optional(),
  category_id: uuidSchema.optional().nullable(),
  vendor: z.string().max(200).optional().nullable(),
  date: dateSchema.optional(),
  payment_method: paymentMethodEnum.optional(),
  is_business: z.boolean().optional(),
  notes: z.string().max(1000).optional().nullable(),
  receipt_url: z.string().url().optional().nullable(),
});

// ============= Mileage Schemas =============

export const createMileageSchema = z.object({
  user_id: uuidSchema,
  date: dateSchema,
  miles: z.number().positive('Miles must be positive'),
  purpose: z.string().min(1, 'Purpose is required').max(500),
  start_location: z.string().max(200).optional().nullable(),
  end_location: z.string().max(200).optional().nullable(),
  is_round_trip: z.boolean().optional().default(false),
  notes: z.string().max(1000).optional().nullable(),
});

// ============= Budget Schemas =============

export const createBudgetSchema = z.object({
  user_id: uuidSchema,
  category_id: uuidSchema.optional().nullable(),
  amount: z.number().positive('Budget amount must be positive'),
  period: z.enum(['weekly', 'monthly', 'quarterly', 'annually']),
  start_date: dateSchema.optional(),
});

// ============= Project Schemas =============

export const createProjectSchema = z.object({
  user_id: uuidSchema,
  name: z.string().min(1, 'Project name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  client_name: z.string().max(200).optional().nullable(),
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']).optional().default('active'),
  budget: z.number().min(0).optional().nullable(),
  start_date: dateSchema.optional().nullable(),
  end_date: dateSchema.optional().nullable(),
});

export const updateProjectSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  client_name: z.string().max(200).optional().nullable(),
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']).optional(),
  budget: z.number().min(0).optional().nullable(),
  start_date: dateSchema.optional().nullable(),
  end_date: dateSchema.optional().nullable(),
});

// ============= Merchant Rule Schemas =============

export const createMerchantRuleSchema = z.object({
  user_id: uuidSchema,
  merchant_pattern: z.string().min(1, 'Merchant pattern is required').max(200),
  category_id: uuidSchema,
  is_business: z.boolean().optional().default(true),
  notes: z.string().max(500).optional().nullable(),
});

// ============= Line Item Schemas =============

export const createLineItemSchema = z.object({
  expense_id: uuidSchema,
  name: z.string().min(1, 'Item name is required').max(200),
  quantity: z.number().positive().optional().default(1),
  unit_price: z.number().min(0),
  line_total: z.number().min(0),
  unit: z.string().max(20).optional().nullable(),
});

// ============= Auth Schemas =============

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(1, 'Name is required').max(100).optional(),
});

// ============= Subscription Schemas =============

export const createSubscriptionSchema = z.object({
  user_id: uuidSchema,
  name: z.string().min(1, 'Subscription name is required').max(200),
  amount: z.number().positive('Amount must be positive'),
  frequency: frequencyEnum,
  category_id: uuidSchema.optional().nullable(),
  next_billing_date: dateSchema,
  vendor: z.string().max(200).optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

// ============= Estimate Schemas =============

export const sendEstimateSchema = z.object({
  estimateId: uuidSchema,
  recipientEmail: emailSchema,
  recipientName: z.string().min(1).max(100),
  message: z.string().max(2000).optional(),
});

// ============= Pure Validation Helpers (No Next.js dependencies) =============

export type ValidationError = {
  field: string;
  message: string;
};

export type PureValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): PureValidationResult<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    // Zod v4 uses 'issues'
    const errors = result.error.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

export function validateQueryParamPure(
  searchParams: URLSearchParams,
  param: string,
  schema: z.ZodSchema
): PureValidationResult<unknown> {
  const value = searchParams.get(param);

  if (value === null) {
    return {
      success: false,
      errors: [{ field: param, message: `${param} is required` }],
    };
  }

  const result = schema.safeParse(value);

  if (!result.success) {
    // Zod v4 uses 'issues'
    return {
      success: false,
      errors: result.error.issues.map((e) => ({
        field: param,
        message: e.message,
      })),
    };
  }

  return { success: true, data: result.data };
}
