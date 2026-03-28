import { router } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { StatusBadge } from '@/components/StatusBadge';
import {
  BrandColor,
  BrandColorLight,
  CardShadow,
  Colors,
  Spacing,
  StatusColors,
  StatusBackgrounds,
  DangerColor,
} from '@/constants/theme';
import { useAuth } from '@/lib/hooks/useAuth';
import { useOrders, OrderWithItems } from '@/lib/hooks/useOrders';
import { supabase } from '@/lib/supabase';
import { getTimeSince } from '@/lib/utils/getTimeSince';

export default function KitchenQueueScreen() {
  const { signOut } = useAuth();
  const { orders, loading } = useOrders({
    status: ['pending', 'preparing', 'ready'],
  });

  const sorted = [...orders].sort((a, b) => {
    const statusOrder = { pending: 0, preparing: 1, ready: 2 };
    const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
    const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;

  async function handleStatusChange(orderId: string, newStatus: 'preparing' | 'ready') {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
  }

  if (loading) return <LoadingScreen />;

  if (sorted.length === 0) {
    return <EmptyState title="No orders" message="Waiting for new orders from waiters..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>KITCHEN LIVE</Text>
              </View>
              <Pressable style={styles.signOutBtn} onPress={signOut}>
                <Text style={styles.signOutBtnText}>Sign Out</Text>
              </Pressable>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>ACTIVE TICKETS</Text>
                <Text style={styles.statValue}>{orders.length}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>AVG. PREP TIME</Text>
                <Text style={styles.statValue}>18m</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <KitchenOrderCard
            order={item}
            onStatusChange={handleStatusChange}
            onPress={() => router.push(`/(kitchen)/order/${item.id}`)}
          />
        )}
      />
      <Pressable style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

function KitchenOrderCard({
  order,
  onStatusChange,
  onPress,
}: {
  order: OrderWithItems;
  onStatusChange: (id: string, status: 'preparing' | 'ready') => void;
  onPress: () => void;
}) {
  const timeSince = getTimeSince(order.created_at, { suffix: false });

  const ticketColor =
    order.status === 'pending'
      ? BrandColor
      : order.status === 'preparing'
        ? StatusColors.pending
        : StatusColors.ready;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Ticket Header */}
      <View style={[styles.ticketHeader, { backgroundColor: ticketColor }]}>
        <View>
          <Text style={styles.ticketId}>T-{String(order.table?.table_number).padStart(2, '0')}</Text>
          <Text style={styles.ticketMeta}>
            {order.order_items.length} Items
            {order.table?.capacity ? ` · ${order.table.capacity} Guests` : ''}
          </Text>
        </View>
        <View style={styles.ticketTimeContainer}>
          <Text style={styles.ticketStatus}>
            {order.status === 'pending' ? 'NEW ORDER' : order.status === 'preparing' ? 'IN PROGRESS' : 'READY'}
          </Text>
          <Text style={styles.ticketTime}>{timeSince}</Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.items}>
        {order.order_items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.quantity}x</Text>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.item_name}</Text>
              {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
            </View>
          </View>
        ))}
      </View>

      {/* Notes */}
      {order.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesIcon}>⚡</Text>
          <Text style={styles.orderNote}>{order.notes}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.cardActions}>
        {order.status === 'pending' && (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: BrandColor }]}
            onPress={() => onStatusChange(order.id, 'preparing')}
          >
            <Text style={styles.actionBtnText}>START PREPARING</Text>
          </Pressable>
        )}
        {order.status === 'preparing' && (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: StatusColors.ready }]}
            onPress={() => onStatusChange(order.id, 'ready')}
          >
            <Text style={styles.actionBtnText}>MARK AS READY</Text>
          </Pressable>
        )}
        {order.status === 'ready' && (
          <View style={styles.readyBanner}>
            <Text style={styles.readyText}>Ready for pickup</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  list: {
    padding: Spacing.three,
    paddingBottom: 80,
  },
  separator: {
    height: 12,
  },
  header: {
    marginBottom: Spacing.three,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.three,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.text,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    ...CardShadow,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.light.text,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    overflow: 'hidden',
    ...CardShadow,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.three,
  },
  ticketId: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ticketMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  ticketTimeContainer: {
    alignItems: 'flex-end',
  },
  ticketStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },
  ticketTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  items: {
    padding: Spacing.three,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 10,
  },
  itemQty: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColor,
    minWidth: 28,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  itemNotes: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    backgroundColor: StatusBackgrounds.pending,
    padding: 10,
    borderRadius: 10,
  },
  notesIcon: {
    fontSize: 16,
  },
  orderNote: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: StatusColors.pending,
  },
  cardActions: {
    padding: Spacing.three,
    paddingTop: 0,
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  readyBanner: {
    backgroundColor: StatusBackgrounds.ready,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  readyText: {
    color: StatusColors.ready,
    fontSize: 14,
    fontWeight: '800',
  },
  signOut: {
    padding: Spacing.three,
    alignItems: 'center',
  },
  signOutText: {
    color: DangerColor,
    fontSize: 15,
    fontWeight: '500',
  },
});
