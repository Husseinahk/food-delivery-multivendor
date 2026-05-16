"use client";

// Lieferando-style live order intake (Orda #157).
// The restaurant admin does NOT poll an order list. This component is mounted
// app-wide in the store-admin shell: it subscribes to subscribePlaceOrder and,
// on a genuinely new order, pops a modal + plays a repeating signal tone until
// staff act. Accept → set an ETA (preparationTime) and status ACCEPTED;
// Reject → CANCELLED. German, restaurant-neutral.

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useSubscription } from "@apollo/client";
import { RestaurantLayoutContext } from "@/lib/context/restaurant/layout-restaurant.context";
import { SUBSCRIPTION_PLACE_ORDER } from "@/lib/api/graphql/subscription/order-subscription";
import { ACCEPT_ORDER_WITH_TIME } from "@/lib/api/graphql/mutations/live-intake";

interface IIntakeItem {
  _id: string;
  title?: string;
  quantity?: number;
}
interface IIntakeOrder {
  _id: string;
  orderId?: string;
  orderStatus?: string;
  orderAmount?: number;
  paymentMethod?: string;
  createdAt?: string;
  items?: IIntakeItem[];
  user?: { name?: string; phone?: string };
  deliveryAddress?: { deliveryAddress?: string };
}

const ETA_OPTIONS = [15, 20, 30, 45, 60];

export default function LiveOrderIntake() {
  const { restaurantLayoutContextData } = useContext(RestaurantLayoutContext);
  const restaurantId = (restaurantLayoutContextData as { restaurantId?: string })
    ?.restaurantId;

  const [queue, setQueue] = useState<IIntakeOrder[]>([]);
  const [eta, setEta] = useState<number>(30);
  const [busy, setBusy] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const beepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [acceptOrder] = useMutation(ACCEPT_ORDER_WITH_TIME);

  useSubscription(SUBSCRIPTION_PLACE_ORDER, {
    variables: { restaurant: restaurantId },
    skip: !restaurantId,
    onSubscriptionData: ({ subscriptionData }: any) => {
      const evt = subscriptionData?.data?.subscribePlaceOrder;
      const order: IIntakeOrder | undefined = evt?.order;
      if (!order?._id) return;
      // Only ring for genuinely new, still-pending orders.
      const isNew =
        evt?.origin === "new" &&
        (order.orderStatus ?? "PENDING").toUpperCase() === "PENDING";
      if (!isNew) return;
      setQueue((q) =>
        q.some((o) => o._id === order._id) ? q : [...q, order],
      );
    },
  });

  // Repeating signal tone while there are orders waiting (Web Audio — no asset).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stop = () => {
      if (beepTimerRef.current) {
        clearInterval(beepTimerRef.current);
        beepTimerRef.current = null;
      }
    };
    if (queue.length === 0) {
      stop();
      return;
    }
    if (beepTimerRef.current) return;

    const beep = () => {
      try {
        let ctx = audioCtxRef.current;
        if (!ctx) {
          const AC =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          ctx = new AC();
          audioCtxRef.current = ctx;
        }
        if (ctx.state === "suspended") ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          ctx.currentTime + 0.32,
        );
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.34);
      } catch {
        /* audio not available — popup still shows */
      }
    };
    beep();
    beepTimerRef.current = setInterval(beep, 1500);
    return stop;
  }, [queue.length]);

  useEffect(
    () => () => {
      if (beepTimerRef.current) clearInterval(beepTimerRef.current);
      audioCtxRef.current?.close().catch(() => {});
    },
    [],
  );

  const current = queue[0];

  const total = useMemo(() => {
    if (current?.orderAmount == null) return "";
    try {
      return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(current.orderAmount);
    } catch {
      return `€ ${current.orderAmount}`;
    }
  }, [current]);

  if (!restaurantId || !current) return null;

  const finish = async (status: "ACCEPTED" | "CANCELLED") => {
    if (busy) return;
    setBusy(true);
    try {
      await acceptOrder({
        variables: {
          id: current._id,
          orderStatus: status,
          preparationTime: status === "ACCEPTED" ? eta : null,
        },
      });
      setQueue((q) => q.filter((o) => o._id !== current._id));
      setEta(30);
    } catch {
      // Keep it in the queue so staff can retry; surface nothing destructive.
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="rounded-t-2xl bg-emerald-600 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Neue Bestellung</h2>
            {queue.length > 1 && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                +{queue.length - 1} weitere
              </span>
            )}
          </div>
          <p className="text-sm opacity-90">
            Bestell-Nr. {current.orderId ?? current._id.slice(0, 8)}
          </p>
        </div>

        <div className="max-h-[45vh] overflow-y-auto px-5 py-4 text-gray-800">
          <div className="mb-3 text-sm">
            <span className="font-medium">Kunde: </span>
            {current.user?.name || "—"}
            {current.user?.phone ? ` · ${current.user.phone}` : ""}
          </div>
          {current.deliveryAddress?.deliveryAddress && (
            <div className="mb-3 text-sm">
              <span className="font-medium">Lieferadresse: </span>
              {current.deliveryAddress.deliveryAddress}
            </div>
          )}
          <ul className="mb-3 divide-y">
            {(current.items ?? []).map((it) => (
              <li key={it._id} className="flex justify-between py-1.5 text-sm">
                <span>
                  {it.quantity ?? 1}× {it.title ?? "Artikel"}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Gesamt</span>
            <span>{total}</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Zahlung: {current.paymentMethod || "—"}
          </p>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">
              Voraussichtliche Zeit
            </label>
            <select
              value={eta}
              onChange={(e) => setEta(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              {ETA_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} Min.
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 border-t px-5 py-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => finish("CANCELLED")}
            className="flex-1 rounded-full border border-red-300 px-4 py-2.5 font-semibold text-red-600 disabled:opacity-50"
          >
            Ablehnen
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => finish("ACCEPTED")}
            className="flex-1 rounded-full bg-emerald-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            Annehmen ({eta} Min.)
          </button>
        </div>
      </div>
    </div>
  );
}
