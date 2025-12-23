import {
  uuidSchema,
  dateSchema,
  emailSchema,
  positiveNumberSchema,
  percentageSchema,
  categorySchema,
  createCategoriesSchema,
  updateCategorySchema,
  frequencyEnum,
  paymentMethodEnum,
  createRecurringExpenseSchema,
  createMileageSchema,
  createBudgetSchema,
  createProjectSchema,
  loginSchema,
  signupSchema,
  validate,
  validateQueryParamPure,
} from '@/lib/validations';

describe('Common Schemas', () => {
  describe('uuidSchema', () => {
    it('should accept valid UUID', () => {
      const result = uuidSchema.safeParse('123e4567-e89b-12d3-a456-426614174000');
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = uuidSchema.safeParse('not-a-uuid');
      expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
      const result = uuidSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('dateSchema', () => {
    it('should accept valid date format', () => {
      const result = dateSchema.safeParse('2024-01-15');
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const result = dateSchema.safeParse('01/15/2024');
      expect(result.success).toBe(false);
    });

    it('should reject partial date', () => {
      const result = dateSchema.safeParse('2024-01');
      expect(result.success).toBe(false);
    });
  });

  describe('emailSchema', () => {
    it('should accept valid email', () => {
      const result = emailSchema.safeParse('test@example.com');
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = emailSchema.safeParse('not-an-email');
      expect(result.success).toBe(false);
    });

    it('should reject email without domain', () => {
      const result = emailSchema.safeParse('test@');
      expect(result.success).toBe(false);
    });
  });

  describe('positiveNumberSchema', () => {
    it('should accept positive number', () => {
      const result = positiveNumberSchema.safeParse(100);
      expect(result.success).toBe(true);
    });

    it('should reject zero', () => {
      const result = positiveNumberSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it('should reject negative number', () => {
      const result = positiveNumberSchema.safeParse(-50);
      expect(result.success).toBe(false);
    });
  });

  describe('percentageSchema', () => {
    it('should accept valid percentage', () => {
      const result = percentageSchema.safeParse(50);
      expect(result.success).toBe(true);
    });

    it('should accept 0', () => {
      const result = percentageSchema.safeParse(0);
      expect(result.success).toBe(true);
    });

    it('should accept 100', () => {
      const result = percentageSchema.safeParse(100);
      expect(result.success).toBe(true);
    });

    it('should reject over 100', () => {
      const result = percentageSchema.safeParse(101);
      expect(result.success).toBe(false);
    });
  });
});

describe('Category Schemas', () => {
  describe('categorySchema', () => {
    it('should accept valid category', () => {
      const result = categorySchema.safeParse({
        name: 'Office Supplies',
        icon: 'briefcase',
        color: '#3B82F6',
        deduction_percentage: 100,
      });
      expect(result.success).toBe(true);
    });

    it('should require name', () => {
      const result = categorySchema.safeParse({
        icon: 'briefcase',
      });
      expect(result.success).toBe(false);
    });

    it('should default deduction_percentage to 100', () => {
      const result = categorySchema.safeParse({
        name: 'Test Category',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deduction_percentage).toBe(100);
      }
    });
  });

  describe('createCategoriesSchema', () => {
    it('should accept array of categories', () => {
      const result = createCategoriesSchema.safeParse({
        categories: [
          { name: 'Category 1' },
          { name: 'Category 2' },
        ],
        user_id: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty categories array', () => {
      const result = createCategoriesSchema.safeParse({
        categories: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateCategorySchema', () => {
    it('should accept valid update', () => {
      const result = updateCategorySchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Updated Name',
      });
      expect(result.success).toBe(true);
    });

    it('should require id', () => {
      const result = updateCategorySchema.safeParse({
        name: 'Updated Name',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Recurring Expense Schemas', () => {
  describe('frequencyEnum', () => {
    it('should accept valid frequencies', () => {
      const validFrequencies = ['weekly', 'biweekly', 'monthly', 'quarterly', 'annually'];
      validFrequencies.forEach((freq) => {
        const result = frequencyEnum.safeParse(freq);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid frequency', () => {
      const result = frequencyEnum.safeParse('daily');
      expect(result.success).toBe(false);
    });
  });

  describe('paymentMethodEnum', () => {
    it('should accept valid payment methods', () => {
      const validMethods = ['credit', 'debit', 'cash', 'check', 'bank_transfer', 'other'];
      validMethods.forEach((method) => {
        const result = paymentMethodEnum.safeParse(method);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('createRecurringExpenseSchema', () => {
    const validExpense = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      amount: 50.00,
      description: 'Netflix subscription',
      frequency: 'monthly',
      start_date: '2024-01-01',
    };

    it('should accept valid recurring expense', () => {
      const result = createRecurringExpenseSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
    });

    it('should transform string amount to number', () => {
      const result = createRecurringExpenseSchema.safeParse({
        ...validExpense,
        amount: '99.99',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(99.99);
      }
    });

    it('should require user_id', () => {
      const { user_id, ...expense } = validExpense;
      const result = createRecurringExpenseSchema.safeParse(expense);
      expect(result.success).toBe(false);
    });

    it('should require description', () => {
      const { description, ...expense } = validExpense;
      const result = createRecurringExpenseSchema.safeParse(expense);
      expect(result.success).toBe(false);
    });
  });
});

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('should accept valid login', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject short password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '12345',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'not-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('signupSchema', () => {
    it('should accept valid signup', () => {
      const result = signupSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
        full_name: 'John Doe',
      });
      expect(result.success).toBe(true);
    });

    it('should allow signup without full_name', () => {
      const result = signupSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Project Schemas', () => {
  describe('createProjectSchema', () => {
    it('should accept valid project', () => {
      const result = createProjectSchema.safeParse({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Website Redesign',
        description: 'Complete website overhaul',
        client_name: 'ACME Corp',
        status: 'active',
        budget: 5000,
      });
      expect(result.success).toBe(true);
    });

    it('should require name', () => {
      const result = createProjectSchema.safeParse({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(false);
    });

    it('should default status to active', () => {
      const result = createProjectSchema.safeParse({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Project',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('active');
      }
    });
  });
});

describe('Mileage Schema', () => {
  describe('createMileageSchema', () => {
    it('should accept valid mileage entry', () => {
      const result = createMileageSchema.safeParse({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        date: '2024-01-15',
        miles: 25.5,
        purpose: 'Client meeting',
        start_location: 'Office',
        end_location: 'Client HQ',
      });
      expect(result.success).toBe(true);
    });

    it('should reject zero miles', () => {
      const result = createMileageSchema.safeParse({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        date: '2024-01-15',
        miles: 0,
        purpose: 'Test',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Budget Schema', () => {
  describe('createBudgetSchema', () => {
    it('should accept valid budget', () => {
      const result = createBudgetSchema.safeParse({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        category_id: '123e4567-e89b-12d3-a456-426614174001',
        amount: 1000,
        period: 'monthly',
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative amount', () => {
      const result = createBudgetSchema.safeParse({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        amount: -100,
        period: 'monthly',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Validation Helper', () => {
  describe('validate', () => {
    it('should return success with valid data', () => {
      const result = validate(loginSchema, {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should return errors with invalid data', () => {
      const result = validate(loginSchema, {
        email: 'invalid',
        password: '123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('validateQueryParamPure', () => {
    it('should validate present param', () => {
      const params = new URLSearchParams('id=123e4567-e89b-12d3-a456-426614174000');
      const result = validateQueryParamPure(params, 'id', uuidSchema);
      expect(result.success).toBe(true);
    });

    it('should error on missing param', () => {
      const params = new URLSearchParams('');
      const result = validateQueryParamPure(params, 'id', uuidSchema);
      expect(result.success).toBe(false);
    });

    it('should error on invalid param', () => {
      const params = new URLSearchParams('id=not-a-uuid');
      const result = validateQueryParamPure(params, 'id', uuidSchema);
      expect(result.success).toBe(false);
    });
  });
});
