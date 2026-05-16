'use client';

// Orda Live-Monitor — the Lieferando-style kitchen board (Husseinahk/orda).
// One screen the counter keeps open: accepted orders flow left → right
// (Angenommen → In Zubereitung → Abholbereit → Unterwegs). One click per
// card advances the order; no digging in an order list. New orders are
// handled by the always-on intake popup (LiveOrderIntake); this board owns
// everything *after* the order was accepted. German, restaurant-neutral.

import { useCallback, useContext, useMemo } from 'react';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { useTranslations } from 'next-intl';
import { RestaurantLayoutContext } from '@/lib/context/restaurant/layout-restaurant.context';
import { GET_BOARD_ORDERS, GET_RIDERS } from '@/lib/api/graphql';
import {
  UPDATE_ORDER_STATUS,
  ASSIGN_ORDER_RIDER,
} from '@/lib/api/graphql/mutations/live-intake';
import { SUBSCRIPTION_PLACE_ORDER } from '@/lib/api/graphql/subscription/order-subscription';

interface IBoardItem {
  _id: string;
  title?: string;
  quantity?: number;
  specialInstructions?: string | null;
  addons?: { options?: { title?: string }[] }[] | null;
}
interface IBoardOrder {
  _id: string;
  orderId?: string;
  orderStatus?: string;
  paymentMethod?: string;
  orderAmount?: number;
  createdAt?: string;
  preparationTime?: number | null;
  expectedTime?: string | null;
  isPickedUp?: boolean;
  user?: { name?: string; phone?: string };
  deliveryAddress?: { deliveryAddress?: string; label?: string };
  rider?: { _id: string; name?: string } | null;
  instructions?: string | null;
  items?: IBoardItem[];
}
interface IRider {
  _id: string;
  name: string;
  available?: boolean;
}

// Board lanes, in service order. Terminal states never reach the board
// (getActiveOrders only returns non-terminal orders).
const LANES = ['ACCEPTED', 'PREPARING', 'READY', 'PICKED'] as const;
type Lane = (typeof LANES)[number];

export default function LiveOrderBoard() {
  const t = useTranslations();
  const { restaurantLayoutContextData } = useContext(RestaurantLayoutContext);
  const restaurantId = (
    restaurantLayoutContextData as { restaurantId?: string }
  )?.restaurantId;

  const { data, loading, refetch } = useQuery(GET_BOARD_ORDERS, {
    variables: { restaurantId },
    skip: !restaurantId,
    fetchPolicy: 'network-only',
    // Cheap safety net if a WS event is ever missed (single-restaurant volume).
    pollInterval: 20000,
  });

  // Any place/update event → re-pull the board. Robust + simple at our volume.
  useSubscription(SUBSCRIPTION_PLACE_ORDER, {
    variables: { restaurant: restaurantId },
    skip: !restaurantId,
    onSubscriptionData: () => {
      void refetch();
    },
  });

  const [updateStatus, { loading: mutating }] =
    useMutation(UPDATE_ORDER_STATUS);
  const [assignRider, { loading: assigning }] =
    useMutation(ASSIGN_ORDER_RIDER);

  // The restaurant's own drivers (for the assign dropdown).
  const { data: ridersData } = useQuery(GET_RIDERS, {
    skip: !restaurantId,
    fetchPolicy: 'cache-and-network',
  });
  const riders: IRider[] = useMemo(
    () => ridersData?.riders ?? [],
    [ridersData]
  );

  const orders: IBoardOrder[] = useMemo(
    () => data?.getActiveOrders?.orders ?? [],
    [data]
  );

  const lanes = useMemo(() => {
    const grouped: Record<Lane, IBoardOrder[]> = {
      ACCEPTED: [],
      PREPARING: [],
      READY: [],
      PICKED: [],
    };
    for (const o of orders) {
      const s = (o.orderStatus ?? '').toUpperCase();
      if (s in grouped) grouped[s as Lane].push(o);
    }
    return grouped;
  }, [orders]);

  const advance = useCallback(
    async (order: IBoardOrder, next: string) => {
      if (mutating) return;
      try {
        await updateStatus({
          variables: { id: order._id, orderStatus: next },
        });
        await refetch();
      } catch {
        // Keep the card where it is; staff can retry. Nothing destructive.
      }
    },
    [mutating, updateStatus, refetch]
  );

  const assign = useCallback(
    async (order: IBoardOrder, riderId: string) => {
      if (!riderId || assigning) return;
      try {
        await assignRider({ variables: { id: order._id, riderId } });
        await refetch();
      } catch {
        // Non-destructive; staff can retry.
      }
    },
    [assigning, assignRider, refetch]
  );

  if (!restaurantId) return null;

  const isPickup = (o: IBoardOrder) =>
    !o.deliveryAddress?.deliveryAddress?.trim();

  const laneMeta: Record<
    Lane,
    { title: string; accent: string; next: (o: IBoardOrder) => { status: string; label: string } }
  > = {
    ACCEPTED: {
      title: t('Accepted'),
      accent: 'border-t-amber-500',
      next: () => ({ status: 'PREPARING', label: t('Start preparing') }),
    },
    PREPARING: {
      title: t('Preparing'),
      accent: 'border-t-sky-500',
      next: () => ({ status: 'READY', label: t('Mark ready') }),
    },
    READY: {
      title: t('Ready'),
      accent: 'border-t-violet-500',
      next: (o) =>
        isPickup(o)
          ? { status: 'DELIVERED', label: t('Complete order') }
          : { status: 'PICKED', label: t('Driver on the way') },
    },
    PICKED: {
      title: t('On the way'),
      accent: 'border-t-emerald-500',
      next: () => ({ status: 'DELIVERED', label: t('Mark delivered') }),
    },
  };

  const elapsedMin = (createdAt?: string) => {
    if (!createdAt) return null;
    const ms = Number(createdAt);
    if (!Number.isFinite(ms)) return null;
    return Math.max(0, Math.floor((Date.now() - ms) / 60000));
  };

  const money = (v?: number) => {
    if (v == null) return '';
    try {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
      }).format(v);
    } catch {
      return `€ ${v}`;
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {t('Live monitor')}
          </h1>
          <p className="text-sm text-gray-500">
            {t('Running orders at a glance')}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
          {orders.length} {t('active')}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {LANES.map((lane) => {
          const meta = laneMeta[lane];
          const list = lanes[lane];
          return (
            <section
              key={lane}
              className={`rounded-xl border border-t-4 ${meta.accent} bg-gray-50 p-3`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">{meta.title}</h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-600 shadow-sm">
                  {list.length}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {!loading && list.length === 0 && (
                  <p className="py-6 text-center text-sm text-gray-400">
                    {t('No orders')}
                  </p>
                )}

                {list.map((o) => {
                  const mins = elapsedMin(o.createdAt);
                  const nxt = meta.next(o);
                  return (
                    <article
                      key={o._id}
                      className="rounded-lg bg-white p-3 shadow-sm"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-bold text-gray-900">
                          #{o.orderId ?? o._id.slice(0, 6)}
                        </span>
                        {mins != null && (
                          <span
                            className={`text-xs font-medium ${
                              mins >= 25
                                ? 'text-red-600'
                                : mins >= 15
                                  ? 'text-amber-600'
                                  : 'text-gray-400'
                            }`}
                          >
                            {t('since')} {mins} {t('min')}
                          </span>
                        )}
                      </div>

                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                            isPickup(o)
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-teal-50 text-teal-700'
                          }`}
                        >
                          {isPickup(o) ? t('Pickup') : t('Delivery')}
                        </span>
                        {o.preparationTime != null && (
                          <span className="text-[11px] text-gray-500">
                            {t('ETA')} {o.preparationTime} {t('min')}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-700">
                        {o.user?.name || '—'}
                        {o.user?.phone ? ` · ${o.user.phone}` : ''}
                      </p>
                      {!isPickup(o) &&
                        o.deliveryAddress?.deliveryAddress?.trim() && (
                          <p className="text-xs text-gray-600">
                            📍 {o.deliveryAddress.deliveryAddress}
                          </p>
                        )}

                      <ul className="my-2 space-y-0.5 text-sm text-gray-600">
                        {(o.items ?? []).map((it) => (
                          <li key={it._id}>
                            {it.quantity ?? 1}× {it.title ?? t('Item')}
                            {(() => {
                              const opts = (it.addons ?? [])
                                .flatMap((a) => a?.options ?? [])
                                .map((o2) => o2?.title)
                                .filter(Boolean);
                              return opts.length ? (
                                <span className="block pl-4 text-xs text-gray-500">
                                  {opts.join(', ')}
                                </span>
                              ) : null;
                            })()}
                            {it.specialInstructions?.trim() && (
                              <span className="block pl-4 text-xs italic text-amber-700">
                                ↳ {it.specialInstructions}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>

                      {o.instructions?.trim() && (
                        <div className="mb-2 rounded border-l-4 border-amber-400 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                          <span className="font-semibold">
                            {t('Customer note')}:{' '}
                          </span>
                          {o.instructions}
                        </div>
                      )}

                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-900">
                          {money(o.orderAmount)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {o.paymentMethod || '—'}
                        </span>
                      </div>

                      {/* Own-driver assignment — delivery orders only.
                          Pickup orders are collected by the customer. */}
                      {!isPickup(o) && (
                        <div className="mb-2 text-xs">
                          {o.rider?._id ? (
                            <div className="flex items-center justify-between rounded bg-teal-50 px-2 py-1 text-teal-700">
                              <span>
                                {t('Driver')}: {o.rider.name || '—'}
                              </span>
                              <select
                                aria-label={t('Reassign driver')}
                                value=""
                                disabled={assigning}
                                onChange={(e) => assign(o, e.target.value)}
                                className="ml-2 rounded border border-teal-200 bg-white px-1 py-0.5 text-[11px]"
                              >
                                <option value="">{t('Reassign')}</option>
                                {riders.map((r) => (
                                  <option key={r._id} value={r._id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <select
                              aria-label={t('Assign driver')}
                              value=""
                              disabled={assigning}
                              onChange={(e) => assign(o, e.target.value)}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                            >
                              <option value="">
                                {riders.length
                                  ? t('Assign driver')
                                  : t('No drivers yet')}
                              </option>
                              {riders.map((r) => (
                                <option key={r._id} value={r._id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={mutating}
                        onClick={() => advance(o, nxt.status)}
                        className="w-full rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {nxt.label} →
                      </button>
                      <button
                        type="button"
                        disabled={mutating}
                        onClick={() => advance(o, 'CANCELLED')}
                        className="mt-1 w-full rounded-full px-3 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {t('Cancel order')}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
