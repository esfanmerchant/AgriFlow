const EMOJIS = {
  Fertilizers: '🌾',
  Pesticides: '🧪',
  Seeds: '🌽',
  'Farm Tools': '🔧',
  Irrigation: '💧',
};

export const productEmoji = (categoryName) => EMOJIS[categoryName] || '📦';

export const stockState = (qty) => {
  if (qty <= 0) return 'out';
  if (qty <= 20) return 'low';
  return 'in';
};

export const stockLabel = (qty) => {
  if (qty <= 0) return 'Out of stock';
  if (qty <= 20) return `${qty} left`;
  return `${qty} in stock`;
};

export const formatRs = (n) => `Rs ${Number(n).toLocaleString()}`;
