import { Package, Wallet, Heart, Clock } from 'lucide-react';
import StatCard from './StatCard.jsx';

export default {
  title: 'Components/StatCard',
  component: StatCard,
  tags: ['autodocs'],
};

export const Mint = {
  args: {
    icon: Package,
    label: 'Active Orders',
    value: 4,
    trend: { up: true, text: '2 since last week' },
    accent: 'mint',
  },
};
export const Gold = {
  args: { icon: Wallet, label: 'Total Spent', value: 84200, prefix: 'Rs ', trend: { up: true, text: '12% this month' }, accent: 'gold' },
};
export const Forest = {
  args: { icon: Heart, label: 'Saved Suppliers', value: 12, trend: { up: true, text: '3 new this week' }, accent: 'forest' },
};
export const Red = {
  args: { icon: Clock, label: 'Pending Payments', value: 11500, prefix: 'Rs ', trend: { up: false, text: '1 invoice due' }, accent: 'red' },
};
