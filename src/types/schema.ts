export const productsQuerySchema = {
  type: 'object',
  properties: {
    category: { type: 'string' },
    page: { type: 'number', default: 1 },
    limit: { type: 'number', default: 8 },
  },
};