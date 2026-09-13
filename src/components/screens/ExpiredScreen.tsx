"use client";

import { Button } from "@/components/ui/Button";
import { PaperCard, ReceiptRow, ReceiptRule } from "@/components/ui/PaperCard";
import { Screen, ScreenFooter } from "@/components/ui/Screen";
import { Stamp } from "@/components/ui/Stamp";
import { useApp } from "@/state/AppProvider";
import { productShort } from "@/state/selectors";
import { useRequireStub } from "./shared/useRequireStub";

/** Settled EXPIRED. The flight ran on time, the stub pays nothing. */
export function ExpiredScreen() {
  const { actions } = useApp();
  const stub = useRequireStub();
  if (!stub) return null;

  return (
    <Screen label="Expired" gap="md">
      <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em]">On time. Stub expired.</h1>
      <PaperCard serrated className="relative pb-16">
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <Stamp tone="red" rotate={-6} className="text-[22px]">
            EXPIRED
          </Stamp>
        </div>
        <div className="text-center text-xs tracking-[0.2em]">LATE GATE</div>
        <ReceiptRow label="FLIGHT" value={`${stub.airline} ${stub.flightNumber}`} />
        <ReceiptRow label="PRODUCT" value={productShort(stub.product)} />
        <ReceiptRow label="RESULT" value="ON TIME" />
        <ReceiptRule />
        <ReceiptRow label="PAYOUT" value="$0.00" tone="bold" />
      </PaperCard>
      <ScreenFooter>
        <Button onClick={() => actions.navigate("stubs")}>My stubs</Button>
      </ScreenFooter>
    </Screen>
  );
}
