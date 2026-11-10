"use client";

import {
  type TossPaymentsWidgets,
  type WidgetAgreementWidget,
  type WidgetPaymentMethodWidget,
  loadTossPayments,
} from "@tosspayments/tosspayments-sdk";
import { Loader2Icon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

import { createPaymentOrderAction } from "@/features/payments/actions";
import type { PaymentLabels } from "@/features/payments/types";
import type { Locale } from "@/i18n/config";

export function CheckoutWidget({
  amount,
  clientKey,
  customer,
  labels,
  locale,
}: {
  amount: number;
  clientKey?: string;
  customer: { customerKey: string; email: string | null; name: string | null };
  labels: PaymentLabels;
  locale: Locale;
}) {
  const widgetsRef = useRef<TossPaymentsWidgets>(null);
  const [agreed, setAgreed] = useState(false);
  const [ready, setReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const { executeAsync, isPending, result } = useAction(
    createPaymentOrderAction,
  );

  useEffect(() => {
    if (!clientKey) return;

    let disposed = false;
    let paymentMethods: WidgetPaymentMethodWidget | undefined;
    let agreement: WidgetAgreementWidget | undefined;

    async function initialize() {
      try {
        const toss = await loadTossPayments(clientKey!);
        const widgets = toss.widgets({ customerKey: customer.customerKey });
        await widgets.setAmount({ currency: "KRW", value: amount });
        [paymentMethods, agreement] = await Promise.all([
          widgets.renderPaymentMethods({
            selector: "#toss-payment-methods",
            variantKey: "DEFAULT",
          }),
          widgets.renderAgreement({
            selector: "#toss-payment-agreement",
            variantKey: "AGREEMENT",
          }),
        ]);

        if (disposed) {
          await Promise.allSettled([
            paymentMethods.destroy(),
            agreement.destroy(),
          ]);
          return;
        }

        agreement.on("agreementStatusChange", ({ agreedRequiredTerms }) => {
          setAgreed(agreedRequiredTerms);
        });
        widgetsRef.current = widgets;
        setReady(true);
      } catch {
        if (!disposed) setSdkError(labels.loadError);
      }
    }

    void initialize();
    return () => {
      disposed = true;
      widgetsRef.current = null;
      if (paymentMethods) void paymentMethods.destroy();
      if (agreement) void agreement.destroy();
    };
  }, [amount, clientKey, customer.customerKey, labels.loadError]);

  async function requestPayment() {
    const widgets = widgetsRef.current;
    if (!widgets) return;
    setSdkError(null);

    try {
      const actionResult = await executeAsync({ locale });
      if (!actionResult?.data) return;
      const order = actionResult.data;

      await widgets.requestPayment({
        customerEmail: customer.email,
        customerName: customer.name,
        failUrl: `${window.location.origin}/${locale}/payments/failure`,
        metadata: { productId: "beagle-nft-123" },
        orderId: order.orderId,
        orderName: order.orderName,
        successUrl: `${window.location.origin}/${locale}/payments/success`,
      });
    } catch {
      setSdkError(labels.requestError);
    }
  }

  if (!clientKey) {
    return (
      <p
        className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200"
        role="status"
      >
        {labels.configurationRequired}
      </p>
    );
  }

  return (
    <div className="w-full space-y-5" style={{ colorScheme: "light" }}>
      {!ready && !sdkError ? (
        <div className="text-muted-foreground flex min-h-40 flex-col items-center justify-center gap-3">
          <Loader2Icon aria-hidden="true" className="size-8 animate-spin" />
          <span>{labels.loading}</span>
        </div>
      ) : null}

      <div className={ready ? "space-y-4" : "sr-only"}>
        <div className="overflow-hidden rounded-xl border bg-white">
          <div id="toss-payment-methods" />
          <div id="toss-payment-agreement" />
        </div>
        <Button
          className="h-12 w-full text-base"
          disabled={!agreed || isPending}
          onClick={requestPayment}
          type="button"
        >
          {isPending
            ? labels.creatingOrder
            : labels.pay.replace("{amount}", formatKrw(amount))}
        </Button>
      </div>

      {result.serverError ? (
        <p
          className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
          role="alert"
        >
          {result.serverError.message}
        </p>
      ) : null}
      {sdkError ? (
        <p
          className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
          role="alert"
        >
          {sdkError}
        </p>
      ) : null}
    </div>
  );
}

function formatKrw(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}
