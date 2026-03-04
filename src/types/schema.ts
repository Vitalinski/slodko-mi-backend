export const productsQuerySchema = {
  type: 'object',
  properties: {
    categories: { type: 'array', items: { type: 'string' } },
    searchValue: { type: 'string' },
    onlyPopular: { type: 'boolean' },
    page: { type: 'number', default: 1 },
    limit: { type: 'number', default: 8 },
  },
};