// FOB — advisory Worker proxy (Met Office DataHub + TfL Unified API).
//
// satisfies: TDR-17 (advisory reads happen server-side, in the Worker,
// keyed from env secrets — never forwarded to or fetched by the client).
// Used by pre-tour REQ-TOUR03 (weather advisory) and, read-only, by
// tour-operations REQ-OPS04 (dynamic risk assessment's weather/route
// review). Classification is `informational` only per D-TOUR-3 (deferred
// thresholds) — no auto-escalation to cancellation-candidate.

import type { Env } from "../env";
import type { AdvisoryClassification } from "../types";

export interface WeatherForecast {
  summary: string;
  classification: AdvisoryClassification;
  raw: unknown;
}

export interface RouteStatus {
  hasDisruption: boolean;
  summary: string;
  raw: unknown;
}

const MET_OFFICE_BASE = "https://data.hub.api.metoffice.gov.uk/sitespecific/v0";
const TFL_BASE = "https://api.tfl.gov.uk";

/**
 * Fetch a Met Office DataHub forecast for the given lat/lon, server-side
 * only. The API key is read from `env.MET_OFFICE_KEY` (Wrangler secret,
 * TDR-11) and is never exposed to the client (TDR-17).
 */
export async function fetchWeatherForecast(
  env: Env,
  lat: number,
  lon: number,
  fetchImpl: typeof fetch = fetch
): Promise<WeatherForecast> {
  const url = `${MET_OFFICE_BASE}/point/hourly?latitude=${lat}&longitude=${lon}`;
  const res = await fetchImpl(url, {
    headers: { apikey: env.MET_OFFICE_KEY },
  });

  if (!res.ok) {
    throw new AdvisorySourceUnavailableError("met_office", res.status);
  }

  const raw = await res.json();
  return {
    summary: summariseForecast(raw),
    classification: "informational",
    raw,
  };
}

/**
 * Fetch TfL road/route disruption status, server-side only. App key read
 * from `env.TFL_APP_KEY` (TDR-11), never exposed to the client (TDR-17).
 */
export async function fetchRouteStatus(
  env: Env,
  roadIds: string[],
  fetchImpl: typeof fetch = fetch
): Promise<RouteStatus> {
  const url = `${TFL_BASE}/Road/${roadIds.join(",")}/Status?app_key=${env.TFL_APP_KEY}`;
  const res = await fetchImpl(url);

  if (!res.ok) {
    throw new AdvisorySourceUnavailableError("tfl", res.status);
  }

  const raw = await res.json();
  const hasDisruption = Array.isArray(raw) && raw.some((r: any) => (r?.statusSeverity ?? "Good") !== "Good");
  return {
    hasDisruption,
    summary: hasDisruption ? "Route disruption reported" : "No disruption reported",
    raw,
  };
}

export class AdvisorySourceUnavailableError extends Error {
  constructor(public readonly source: "met_office" | "tfl", public readonly status: number) {
    super(`${source}_unavailable:${status}`);
    this.name = "AdvisorySourceUnavailableError";
  }
}

function summariseForecast(raw: unknown): string {
  try {
    const features = (raw as any)?.features;
    const first = features?.[0]?.properties?.timeSeries?.[0];
    if (!first) return "Forecast unavailable";
    const temp = first.screenTemperature ?? first.temperature;
    const precip = first.probOfPrecipitation ?? first.precipitationProbability;
    return `Temp ${temp ?? "?"}C, precipitation chance ${precip ?? "?"}%`;
  } catch {
    return "Forecast unavailable";
  }
}
