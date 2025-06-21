// Utility to map order from DB (OrdersWithDetails) to UI Order type
import type { OrdersWithDetails } from '@/integrations/supabase/dataFetchers';
import type { Order, Address } from '@/types/index';

export function mapOrderFromDb(order: OrdersWithDetails): Order {
  const items = Array.isArray(order.items) ? order.items : [];
  let shippingAddress: Address | undefined = undefined;
  if (typeof order.shipping_address === 'string') {
    try { shippingAddress = JSON.parse(order.shipping_address) as Address; } catch { shippingAddress = undefined; }
  } else if (typeof order.shipping_address === 'object' && order.shipping_address !== null) {
    shippingAddress = order.shipping_address as Address;
  }
  // Infer status and paymentMethod types
  const status = (order.status as Order['status']) || 'pending';
  const paymentMethod = (order.payment_method as Order['paymentMethod']) || 'cash';
  return {
    id: order.id,
    userId: order.user_id || '',
    items: items as Order['items'],
    total: order.total,
    status,
    createdAt: new Date(order.created_at),
    shippingAddress: shippingAddress || ({} as Address),
    paymentMethod,
    notes: order.notes,
  };
}
