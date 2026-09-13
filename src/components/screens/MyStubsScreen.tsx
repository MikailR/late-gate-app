"use client";

import { Button } from "@/components/ui/Button";
import { PaperCard, ReceiptHeader, ReceiptRule } from "@/components/ui/PaperCard";
import { Screen, ScreenFooter, ScreenTitle } from "@/components/ui/Screen";
import { Stamp } from "@/components/ui/Stamp";
import type { OwnedStub } from "@/lib/domain/types";
import { formatWholeUsd } from "@/lib/format/money";
import { useApp } from "@/state/AppProvider";
import { PoolEntryRow } from "./pool/PoolEntryRow";

function OwnedStubRow({ stub, onOpen }: { stub: OwnedStub; onOpen: () => void }) {
  const stampTone = stub.status === "EXPIRED" ? "red" : "gate";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-1.5 rounded border border-rule border-l-[5px] border-l-gate bg-paper p-4 text-left font-mono active:scale-[0.99]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold">
          {stub.airline} {stub.flightNumber}
        </span>
        <Stamp tone={stampTone} rotate={-3} className="px-[7px] py-0.5 text-[9px]">
          {stub.status}
        </Stamp>
      </div>
      <div className="flex justify-between text-[13px]">
        <span>
          {stub.origin}→{stub.dest}
        </span>
        <span>{stub.product === "takeoff" ? "TAKEOFF" : "ARRIVAL"}</span>
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>{stub.minutesLate} minutes late</span>
        <span>{formatWholeUsd(stub.payoutUsd)}</span>
      </div>
    </button>
  );
}

function EmptyDrawer() {
  return (
    <PaperCard serrated print>
      <ReceiptHeader subtitle="EMPTY DRAWER" />
      <ReceiptRule />
      <div className="px-1 py-2 text-center font-sans text-[15px] leading-[1.4]">No stubs yet.</div>
    </PaperCard>
  );
}

/** Home. Stubs the traveler holds, the house pool strip, and the way into a new cover. */
export function MyStubsScreen() {
  const { state, actions } = useApp();
  const { owned } = state;

  return (
    <Screen label="My stubs" gap="lg">
      <ScreenTitle>My stubs</ScreenTitle>
      {owned.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {owned.map((stub) => (
            <OwnedStubRow key={stub.id} stub={stub} onOpen={() => actions.dispatch({ type: "OPEN_STUB", id: stub.id })} />
          ))}
        </div>
      ) : (
        <EmptyDrawer />
      )}
      <PoolEntryRow />
      <ScreenFooter>
        <Button onClick={() => actions.navigate("airline")}>Cover a flight</Button>
      </ScreenFooter>
    </Screen>
  );
}
