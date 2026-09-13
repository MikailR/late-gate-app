"use client";

import { useEffect } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { Button } from "@/components/ui/Button";
import { Screen, ScreenFooter, ScreenTitle } from "@/components/ui/Screen";
import { useApp } from "@/state/AppProvider";
import { selectAirline, selectDateLabel, selectFlightLabel, selectRouteReady, selectServiceDateIso } from "@/state/selectors";
import { DatePicker } from "./DatePicker";
import { FlightNumberField } from "./FlightNumberField";
import { LookupCard } from "./LookupCard";
import { RoutePicker } from "./RoutePicker";
import { useFlightLookup } from "./useFlightLookup";

/**
 * Step 2. Flight number, route and date on one form. The lookup resolves
 * inline; Continue goes straight to Pick a stub. There is no flights list.
 */
export function FlightScreen() {
  const { state, actions } = useApp();
  const { flight, routeEdit, airportQuery } = state;
  const airline = selectAirline(state);
  const flightLabel = selectFlightLabel(state);
  const dateLabel = selectDateLabel(state);
  const routeReady = selectRouteReady(state);

  const lookupState = useFlightLookup({
    airline: flight.airline,
    flightNumber: flight.flightNumber,
    serviceDate: selectServiceDateIso(state),
    origin: flight.origin,
  });
  const lookup = lookupState.lookup;
  const buyable = lookup?.ok === true;
  const blocked = lookup !== null && !lookup.ok;
  const canContinue = routeReady && buyable;

  // Keep the store's inventory in step with the quote so Pick a stub prints the same count.
  useEffect(() => {
    if (lookup?.ok && lookup.remaining !== null) actions.dispatch({ type: "SET_REMAINING", remaining: lookup.remaining });
  }, [lookup, actions]);

  const ctaLabel = blocked ? "Not for sale" : canContinue ? `Continue · ${flightLabel}` : "Continue";

  return (
    <Screen label="Pick flight" gap="md">
      <BackLink onClick={() => actions.navigate("airline")}>{airline.name.toUpperCase()}</BackLink>
      <ScreenTitle step="STEP 2">Which flight?</ScreenTitle>

      <FlightNumberField
        airline={flight.airline}
        flightNumber={flight.flightNumber}
        placeholder={airline.demoNumbers.clean}
        onChange={(next) => actions.dispatch({ type: "SET_FLIGHT_NUMBER", ...next })}
      />
      {flight.flightNumber && (
        <LookupCard flightLabel={flightLabel} dateLabel={dateLabel} lookup={lookup} loading={lookupState.status === "loading"} fallbackRemaining={state.remaining} />
      )}

      <RoutePicker
        origin={flight.origin}
        dest={flight.dest}
        editing={routeEdit}
        query={airportQuery}
        onEdit={(edit) => actions.dispatch({ type: "SET_ROUTE_EDIT", edit })}
        onQuery={(query) => actions.dispatch({ type: "SET_AIRPORT_QUERY", query })}
        onPick={(code) => actions.dispatch({ type: "PICK_AIRPORT", code })}
        onSwap={() => actions.dispatch({ type: "SWAP_ROUTE" })}
      />

      <DatePicker
        mode={flight.dateMode}
        other={flight.dateOther}
        onMode={(mode) => actions.dispatch({ type: "SET_DATE_MODE", mode })}
        onOther={(iso) => actions.dispatch({ type: "SET_DATE_OTHER", iso })}
      />

      <ScreenFooter>
        <Button variant={blocked ? "muted" : "primary"} faded={!canContinue && !blocked} disabled={!canContinue} onClick={() => actions.navigate("catalog")}>
          {ctaLabel}
        </Button>
      </ScreenFooter>
    </Screen>
  );
}
