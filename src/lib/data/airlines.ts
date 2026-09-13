import type { Airline, AirlineCode } from "@/lib/domain/types";

/**
 * Carriers offered on the airline picker. Demo numbers resolve to a fixed
 * lookup status so reviewers can see every refusal state; any other number
 * is on time and buyable.
 */
export const AIRLINES: Readonly<Record<AirlineCode, Airline>> = {
  DL: {
    code: "DL",
    name: "Delta",
    logo: "/airlines/DL.svg",
    demoNumbers: { hot: "421", clean: "188", cutoff: "777", gone: "090", sold: "512", uw: "633" },
  },
  AA: {
    code: "AA",
    name: "American",
    logo: "/airlines/AA.svg",
    demoNumbers: { hot: "1008", clean: "442", cutoff: "331", gone: "219", sold: "880", uw: "1177" },
  },
  UA: {
    code: "UA",
    name: "United",
    logo: "/airlines/UA.svg",
    demoNumbers: { hot: "1523", clean: "837", cutoff: "870", gone: "119", sold: "641", uw: "1902" },
  },
  WN: {
    code: "WN",
    name: "Southwest",
    logo: "/airlines/WN.svg",
    demoNumbers: { hot: "2211", clean: "1348", cutoff: "905", gone: "417", sold: "1760", uw: "2860" },
  },
  B6: {
    code: "B6",
    name: "JetBlue",
    logo: "/airlines/B6.svg",
    demoNumbers: { hot: "615", clean: "287", cutoff: "1024", gone: "058", sold: "733", uw: "1490" },
  },
  NK: {
    code: "NK",
    name: "Spirit",
    logo: "/airlines/NK.svg",
    demoNumbers: { hot: "612", clean: "308", cutoff: "901", gone: "144", sold: "707", uw: "450" },
  },
  EK: {
    code: "EK",
    name: "Emirates",
    logo: "/airlines/EK.svg",
    demoNumbers: { hot: "203", clean: "201", cutoff: "205", gone: "199", sold: "211", uw: "218" },
  },
  AC: {
    code: "AC",
    name: "Air Canada",
    logo: "/airlines/AC.svg",
    demoNumbers: { hot: "757", clean: "409", cutoff: "2103", gone: "088", sold: "861", uw: "1104" },
  },
  BA: {
    code: "BA",
    name: "British Airways",
    logo: "/airlines/BA.svg",
    demoNumbers: { hot: "178", clean: "116", cutoff: "212", gone: "190", sold: "288", uw: "294" },
  },
  LH: {
    code: "LH",
    name: "Lufthansa",
    logo: "/airlines/LH.svg",
    demoNumbers: { hot: "405", clean: "423", cutoff: "441", gone: "419", sold: "453", uw: "478" },
  },
};

/** Display order on the airline picker. */
export const AIRLINE_GROUPS: ReadonlyArray<{ label: string; codes: readonly AirlineCode[] }> = [
  { label: "U.S. CARRIERS", codes: ["DL", "AA", "UA", "WN", "B6", "NK"] },
  { label: "INTERNATIONAL", codes: ["EK", "AC", "BA", "LH"] },
];

export function isAirlineCode(value: string): value is AirlineCode {
  return value in AIRLINES;
}

export function getAirline(code: AirlineCode): Airline {
  return AIRLINES[code];
}
