"use client";

import { useEffect } from "react";
import { useApp } from "@/state/AppProvider";
import type { Screen } from "@/state/types";
import { AirlineScreen } from "./AirlineScreen";
import { CatalogScreen } from "./CatalogScreen";
import { ConfigureScreen } from "./ConfigureScreen";
import { ExpiredScreen } from "./ExpiredScreen";
import { FlightScreen } from "./flight/FlightScreen";
import { IssuedScreen } from "./IssuedScreen";
import { LiveScreen } from "./LiveScreen";
import { MyStubsScreen } from "./MyStubsScreen";
import { PaidScreen } from "./PaidScreen";
import { PayScreen } from "./PayScreen";
import { PoolMoveScreen } from "./pool/PoolMoveScreen";
import { PoolScreen } from "./pool/PoolScreen";
import { PoolSlipScreen } from "./pool/PoolSlipScreen";
import { VerifyScreen } from "./VerifyScreen";

const SCREENS: Record<Screen, () => React.ReactNode> = {
  stubs: MyStubsScreen,
  airline: AirlineScreen,
  flight: FlightScreen,
  catalog: CatalogScreen,
  configure: ConfigureScreen,
  verify: VerifyScreen,
  pay: PayScreen,
  issued: IssuedScreen,
  live: LiveScreen,
  paid: PaidScreen,
  expired: ExpiredScreen,
  pool: PoolScreen,
  deposit: () => <PoolMoveScreen kind="deposit" />,
  withdraw: () => <PoolMoveScreen kind="withdraw" />,
  poolSlip: PoolSlipScreen,
};

/**
 * Swaps screens in place. Keyed so each mount replays its entrance animation.
 * Scroll resets on every change so a tall screen (Paid, Airline) never leaves
 * the next one opened mid-page.
 */
export function ScreenRouter() {
  const { state } = useApp();
  const Current = SCREENS[state.screen];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [state.screen]);

  return <Current key={state.screen} />;
}
