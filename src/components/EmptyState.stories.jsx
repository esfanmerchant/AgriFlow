import { Package, Inbox, ShoppingCart } from 'lucide-react';
import EmptyState from './EmptyState.jsx';

export default {
  title: 'Components/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};

export const Default = {
  args: {
    title: 'Nothing here yet',
    body: 'Once activity arrives it will show up here.',
  },
};
export const NoOrders = {
  args: {
    icon: Package,
    title: 'No orders yet',
    body: "When you place your first order, you'll see its status here.",
  },
};
export const EmptyCart = {
  args: {
    icon: ShoppingCart,
    title: 'Cart is empty',
    body: 'Add some fertilizer or seeds from the marketplace.',
  },
};
