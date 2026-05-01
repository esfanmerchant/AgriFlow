import ProductCard from './ProductCard.jsx';

export default {
  title: 'Components/ProductCard',
  component: ProductCard,
  tags: ['autodocs'],
};

const base = {
  category: 'Fertilizers · Nitrogen',
  rating: 4.8,
  reviews: 124,
  price: 4200,
  unit: 'bag',
};

export const InStock = {
  args: { p: { ...base, name: 'Urea (46% N) — 50kg', stockState: 'in', stockLabel: '248 in stock' } },
};
export const Low = {
  args: { p: { ...base, name: 'DAP Fertilizer — 50kg', stockState: 'low', stockLabel: '12 left' } },
};
export const OutOfStock = {
  args: { p: { ...base, name: 'Insecticide Spray — 1L', category: 'Pesticides', stockState: 'out', stockLabel: 'Out of stock' } },
};
