'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { IExtendedOrder, Items } from '@/lib/utils/interfaces';
import './order-detail-modal.css';
import { useConfiguration } from '@/lib/hooks/useConfiguration';

// Orda print-companion bridge. The Kotlin companion app runs on the same
// counter tablet and hosts an HTTP server on localhost:9100. We POST one
// PrintJob per copy (KITCHEN + DRIVER) in the exact wire shape the
// companion's PrintJob.kt expects. See print-companion/README.md.
const PRINT_COMPANION_URL = 'http://localhost:9100/print';

interface IOrderDetailModalProps {
  visible: boolean;
  onHide: () => void;
  restaurantData: IExtendedOrder | null;
}

const OrderDetailModal: React.FC<IOrderDetailModalProps> = ({
  visible,
  onHide,
  restaurantData,
}) => {
  const { CURRENT_SYMBOL } = useConfiguration();
  const [printStatus, setPrintStatus] = React.useState<string>('');
  const [printing, setPrinting] = React.useState<boolean>(false);

  const calculateSubtotal = (items: Items[]) => {
    let Subtotal = 0;
    for (let i = 0; i < items.length; i++) {
      let itemTotal = items[i].variation?.price ?? 0;
      if (items[i]?.addons) {
        items[i].addons?.forEach((addon) => {
          addon.options.forEach((option) => {
            itemTotal += option.price ?? 0;
          });
        });
      }
      Subtotal += itemTotal * items[i].quantity;
    }
    return Subtotal.toFixed(2);
  };
  const buildPrintOrder = (data: IExtendedOrder) => {
    const items = (data.items || []).map((it) => ({
      quantity: it.quantity,
      name: String(it.title ?? ''),
      optionNames: (it.addons || []).flatMap((a) =>
        (a.options || []).map((o) => String(o.title ?? ''))
      ),
      lineTotal: (((it.variation?.price ?? 0) as number) * it.quantity).toFixed(2),
    }));
    const rawCreated: unknown = (data as Record<string, unknown>).createdAt;
    const ms = Number(rawCreated);
    const createdAt =
      Number.isFinite(ms) && ms > 0
        ? new Date(ms).toISOString()
        : rawCreated
          ? String(rawCreated)
          : new Date().toISOString();
    const user = (data as Record<string, unknown>).user as
      | { name?: string; phone?: string }
      | undefined;
    return {
      orderNumber: String(data.orderId ?? ''),
      createdAt,
      fulfillmentType: (data as Record<string, unknown>).isPickedUp
        ? 'Pickup'
        : 'Delivery',
      paymentMethod: String(data.paymentMethod ?? ''),
      customerName: user?.name ?? '—',
      customerPhone: user?.phone ?? '',
      deliveryAddress: data.deliveryAddress?.deliveryAddress || null,
      notes: null,
      items,
      subtotal: calculateSubtotal(data.items || []),
      deliveryFee: (data.deliveryCharges ?? 0).toFixed(2),
      total: String(data.orderAmount ?? calculateSubtotal(data.items || [])),
    };
  };

  const handlePrint = async () => {
    if (!restaurantData) return;
    setPrinting(true);
    setPrintStatus('Drucke …');
    try {
      const order = buildPrintOrder(restaurantData);
      for (const template of ['KITCHEN', 'DRIVER'] as const) {
        const res = await fetch(PRINT_COMPANION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template, order }),
        });
        if (!res.ok) throw new Error(`${template}: HTTP ${res.status}`);
      }
      setPrintStatus('✓ Gedruckt (Küche + Fahrer)');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setPrintStatus(
        `✗ Druck fehlgeschlagen (${msg}). Läuft die print-companion App auf diesem Tablet (localhost:9100)?`
      );
    } finally {
      setPrinting(false);
    }
  };

  if (!restaurantData) return null;

  const printFooter = (
    <div className="flex items-center justify-between gap-3 p-2">
      <span className="text-sm text-gray-500 dark:text-gray-300">
        {printStatus}
      </span>
      <button
        type="button"
        onClick={handlePrint}
        disabled={printing}
        className="px-4 py-2 rounded bg-[#18181B] text-white border border-black hover:bg-white hover:text-black disabled:opacity-50"
      >
        {printing ? 'Drucke …' : '🖨 Drucken'}
      </button>
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={`Order # ${restaurantData.orderId}`}
      footer={printFooter}
      className="custom-modal border border-dark-600" // Added custom class for CSS override
    >
      <div className="order-details-container dark:bg-dark-900 dark:text-white ">
        {/* Items Section */}
        <div className="order-section dark:bg-dark-600">
          <h3 className="section-header dark:text-primary-dark">Items</h3>
          {restaurantData.items && restaurantData.items.length > 0 ? (
            <>
              <div className="item-list">
                {restaurantData.items.map((item, index) => (
                  <div key={index} className="item-row">
                    <span className="font-bold">
                      {index + 1}. {item.title}
                    </span>
                    <span className="item-price dark:text-white">
                      {item.quantity} &#215; {CURRENT_SYMBOL || '$'}
                      {(item.variation?.price ?? 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              {restaurantData?.items?.map((item, index) => (
                <div key={index}>
                  {item?.addons?.map((addon) =>
                    addon.options.map((option, index) => (
                      <div key={index} className="item-row text-sm">
                        <span>{option.title}</span>
                        <span className="item-price dark:text-white">
                          {CURRENT_SYMBOL || '$'}
                          {(option.price ?? 0).toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </>
          ) : (
            <p>No items available</p>
          )}
        </div>

        {/* Charges Section */}
        <div className="order-section dark:bg-dark-600">
          <h3 className="section-header dark:text-primary-dark">Charges</h3>
          <div className="charges-table">
            <div className="charges-row">
              <span>Subtotal</span>
              <span>
                {CURRENT_SYMBOL || '$'}
                {calculateSubtotal(restaurantData?.items || [])}
              </span>
            </div>
            <div className="charges-row">
              <span>Delivery Fee</span>
              <span>
                {CURRENT_SYMBOL || '$'}
                {(restaurantData.deliveryCharges ?? 0)?.toFixed(2)}
              </span>
            </div>
            <div className="charges-row">
              <span>Tax Charges</span>
              <span>
                {CURRENT_SYMBOL || '$'}
                {(restaurantData.taxationAmount ?? 0)?.toFixed(2)}
              </span>
            </div>
            <div className="charges-row">
              <span>Tip</span>
              <span>
                {CURRENT_SYMBOL || '$'}
                {(restaurantData.tipping ?? 0)?.toFixed(2)}
              </span>
            </div>
            <div className="charges-row total-row">
              <strong>Total</strong>
              <strong>
                {CURRENT_SYMBOL || '$'}
                {restaurantData.orderAmount}
              </strong>
            </div>
          </div>
        </div>

        {/* Payment Method Section */}
        <div className="order-section dark:bg-dark-600">
          <h3 className="section-header dark:text-primary-dark">
            Payment Method
          </h3>
          <div className="payment-section">
            <span className="payment-type">{restaurantData.paymentMethod}</span>
          </div>
          <div className="paid-amount">
            <span className="paid-label">Paid Amount</span>
            <span className="paid-value">
              {CURRENT_SYMBOL || '$'}
              {(restaurantData.paidAmount ?? 0)?.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Delivery Address Section */}
        <div className="order-section dark:bg-dark-600">
          <h3 className="section-header dark:text-primary-dark">
            Delivery Address
          </h3>
          <p>{restaurantData.deliveryAddress.deliveryAddress}</p>
        </div>
      </div>
    </Dialog>
  );
};

export default OrderDetailModal;
