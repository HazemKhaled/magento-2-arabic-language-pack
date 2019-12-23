export const CreateMembershipValidation = {
  id: { type: 'string', optional: true },
  name: {
    type: 'object',
    props: {
      tr: { type: 'string', optional: true },
      en: { type: 'string' },
      ar: { type: 'string', optional: true },
      $$strict: true
    }
  },
  tagline: {
    type: 'object',
    props: {
      tr: { type: 'string', optional: true },
      en: { type: 'string' },
      ar: { type: 'string', optional: true },
      $$strict: true
    }
  },
  description: {
    type: 'object',
    props: {
      tr: { type: 'string', optional: true },
      en: { type: 'string' },
      ar: { type: 'string', optional: true },
      $$strict: true
    }
  },
  sort: { type: 'number', integer: true, positive: true },
  active: { type: 'boolean' },
  public: { type: 'boolean' },
  cost: [{ type: 'number', positive: true, optional: true }, { type: 'enum', values: [0, "0"], optional: true  }],
  discount: [{ type: 'number', positive: true, optional: true }, { type: 'enum', values: [0, "0"], optional: true  }],
  paymentFrequency: { type: 'number', integer: true, positive: true },
  paymentFrequencyType: { type: 'enum', values: ['month', 'year'] },
  attributes: { type: 'object' },
  isDefault: { type: 'boolean', optional: true },
  $$strict: true
};

export const UpdateMembershipValidation = {
  id: { type: 'string' },
  name: {
    type: 'object',
    props: {
      tr: { type: 'string', optional: true },
      en: { type: 'string', optional: true },
      ar: { type: 'string', optional: true },
      $$strict: true
    },
    optional: true
  },
  tagline: {
    type: 'object',
    props: {
      tr: { type: 'string', optional: true },
      en: { type: 'string', optional: true },
      ar: { type: 'string', optional: true },
      $$strict: true
    },
    optional: true
  },
  description: {
    type: 'object',
    props: {
      tr: { type: 'string', optional: true },
      en: { type: 'string', optional: true },
      ar: { type: 'string', optional: true },
      $$strict: true
    },
    optional: true
  },
  sort: { type: 'number', integer: true, positive: true, optional: true },
  active: { type: 'boolean', optional: true },
  public: { type: 'boolean', optional: true },
  cost: [{ type: 'number', positive: true, optional: true }, { type: 'enum', values: [0, "0"], optional: true  }],
  discount: [{ type: 'number', positive: true, optional: true }, { type: 'enum', values: [0, "0"], optional: true  }],
  paymentFrequency: { type: 'number', integer: true, positive: true, optional: true },
  paymentFrequencyType: { type: 'enum', values: ['month', 'year'], optional: true },
  attributes: { type: 'object', optional: true },
  isDefault: { type: 'boolean', optional: true },
  $$strict: true
};
