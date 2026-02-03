/**
 * DFlow Prediction Markets Metadata API client.
 * Docs: https://pond.dflow.net/prediction-market-metadata-api-reference/introduction
 *
 * Development: API key is optional. Endpoints that require auth (e.g. 403) return
 * empty data and the app falls back to mock data. Add EXPO_PUBLIC_DFLOW_API_KEY
 * only when you need production rate limits or protected endpoints.
 */

import type { Market, ChartPoint } from "./mock-data";

const DFLOW_MARKETS_API_URL =
    process.env.EXPO_PUBLIC_DFLOW_MARKETS_API_URL || "https://prediction-markets-api.dflow.net";
const DFLOW_API_KEY = process.env.EXPO_PUBLIC_DFLOW_API_KEY ?? "";

function getHeaders(): HeadersInit {
    const headers: HeadersInit = { Accept: "application/json" };
    if (DFLOW_API_KEY) headers["x-api-key"] = DFLOW_API_KEY;
    return headers;
}

/** DFlow API: event with nested markets */
export interface DFlowEvent {
    ticker: string;
    title: string;
    subtitle?: string | null;
    seriesTicker?: string | null;
    imageUrl?: string | null;
    volume?: number | null;
    volume24h?: number | null;
    liquidity?: number | null;
    openInterest?: number | null;
    strikeDate?: number | null;
    strikePeriod?: string | null;
    markets?: DFlowMarket[] | null;
}

/** DFlow API: market (binary outcome) */
export interface DFlowMarket {
    ticker: string;
    title: string;
    subtitle?: string | null;
    eventTicker: string;
    volume?: number | null;
    openInterest?: number | null;
    closeTime?: number | null;
    expirationTime?: number | null;
    yesBid?: string | null;
    yesAsk?: string | null;
    noBid?: string | null;
    noAsk?: string | null;
    rulesPrimary?: string | null;
    rulesSecondary?: string | null;
    status?: string | null;
    yesSubTitle?: string | null;
    noSubTitle?: string | null;
    // accounts is keyed by collateral token mint address (e.g. USDC)
    accounts?: Record<string, {
        marketLedger?: string;
        yesMint?: string;
        noMint?: string;
        isInitialized?: boolean;
        redemptionStatus?: string | null;
    }> | null;
}

// USDC mint address on Solana mainnet - used to extract the correct accounts entry
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";


/** DFlow API: series (category lives here) */
export interface DFlowSeries {
    ticker: string;
    category?: string | null;
    title?: string | null;
    tags?: string[] | null;
}

/** DFlow API: series list response */
interface DFlowSeriesResponse {
    series?: DFlowSeries[];
}

/** DFlow API: events list response */
interface DFlowEventsResponse {
    events: DFlowEvent[];
    cursor?: number | null;
}

/** DFlow API: markets list response */
interface DFlowMarketsResponse {
    markets: DFlowMarket[];
    cursor?: number | null;
}

/** Parse yes price from bid/ask (cents to 0-1) */
function parseYesPrice(m: DFlowMarket): number {
    const yesBid = m.yesBid != null ? parseFloat(m.yesBid) : NaN;
    const yesAsk = m.yesAsk != null ? parseFloat(m.yesAsk) : NaN;
    if (!Number.isNaN(yesBid) && !Number.isNaN(yesAsk)) return (yesBid / 100 + yesAsk / 100) / 2;
    if (!Number.isNaN(yesBid)) return yesBid / 100;
    if (!Number.isNaN(yesAsk)) return yesAsk / 100;
    return 0.5;
}

/** Convert DFlow event + market to app Market. category = raw DFlow category from Series API. */
export function dflowEventMarketToMarket(
    event: DFlowEvent,
    market: DFlowMarket,
    seriesCategoryMap?: Map<string, string> | null
): Market {
    const yesPrice = parseYesPrice(market);
    const volume = typeof market.volume === "number" ? market.volume : (event.volume ?? 0) as number;
    const closeTime = market.closeTime ?? market.expirationTime ?? 0;
    const resolveDate = closeTime ? new Date(closeTime * 1000).toISOString() : "";

    // Extract accounts from USDC collateral entry
    // accounts is keyed by collateral token mint (e.g. USDC mint address)
    const usdcAccounts = market.accounts?.[USDC_MINT];
    const yesMint = usdcAccounts?.yesMint ?? "";
    const noMint = usdcAccounts?.noMint ?? "";

    const category =
        seriesCategoryMap && event.seriesTicker && seriesCategoryMap.has(event.seriesTicker)
            ? seriesCategoryMap.get(event.seriesTicker)!
            : "Other";
    return {
        id: market.ticker,
        title: market.title || event.title,
        description: market.rulesPrimary ?? event.subtitle ?? undefined,
        category,
        imageUrl: event.imageUrl ?? undefined,
        yesPrice: Math.max(0, Math.min(1, yesPrice)),
        volume: Number(volume) || 0,
        liquidityScore: typeof event.liquidity === "number" ? Math.min(100, event.liquidity) : 0,
        resolveDate,
        yesMint,
        noMint,
        yesLabel: market.yesSubTitle ?? "YES",
        noLabel: market.noSubTitle ?? "NO",
        ticker: market.ticker,
        eventTicker: market.eventTicker,
        status: market.status ?? undefined,
        priceHistory: [],
    };
}



/**
 * Fetch series list (ticker + category). Used to map event.seriesTicker -> app category.
 */
export async function fetchDflowSeries(): Promise<DFlowSeries[]> {
    const url = new URL(`${DFLOW_MARKETS_API_URL}/api/v1/series`);
    const res = await fetch(url.toString(), { headers: getHeaders() });
    if (!res.ok) {
        if (res.status === 403) return [];
        return [];
    }
    const data = (await res.json()) as DFlowSeriesResponse;
    return data.series ?? [];
}

/**
 * Build seriesTicker -> raw DFlow category map and sorted unique categories list.
 * Used so the app shows the same categories as DFlow.
 */
export async function buildSeriesCategoryData(): Promise<{ map: Map<string, string>; categories: string[] }> {
    const map = new Map<string, string>();
    const categorySet = new Set<string>();
    try {
        const series = await fetchDflowSeries();
        for (const s of series) {
            if (s.ticker && s.category && String(s.category).trim()) {
                const cat = String(s.category).trim();
                map.set(s.ticker, cat);
                categorySet.add(cat);
            }
        }
    } catch {
        // ignore
    }
    const categories = Array.from(categorySet).sort((a, b) => a.localeCompare(b));
    return { map, categories };
}

/**
 * Fetch events with nested markets (list for Home/Markets).
 */
export async function fetchDflowEvents(params?: {
    limit?: number;
    cursor?: number;
    sort?: "volume" | "volume24h" | "liquidity" | "openInterest" | "startDate";
    status?: string;
}): Promise<{ events: DFlowEvent[]; cursor: number | null }> {
    const url = new URL(`${DFLOW_MARKETS_API_URL}/api/v1/events`);
    url.searchParams.set("withNestedMarkets", "true");
    url.searchParams.set("withMarketAccounts", "true");
    url.searchParams.set("limit", String(params?.limit ?? 30));
    if (params?.cursor != null) url.searchParams.set("cursor", String(params.cursor));
    if (params?.sort) url.searchParams.set("sort", params.sort);
    if (params?.status) url.searchParams.set("status", params.status);

    const res = await fetch(url.toString(), { headers: getHeaders() });
    if (!res.ok) {
        if (res.status === 403) {
            throw new Error(
                "DFlow API: 403 Forbidden. Add EXPO_PUBLIC_DFLOW_API_KEY in .env or set EXPO_PUBLIC_DFLOW_MARKETS_API_URL to your development endpoint (see pond.dflow.net)."
            );
        }
        throw new Error(`DFlow events: ${res.status}`);
    }
    const data = (await res.json()) as DFlowEventsResponse;
    const events = data.events ?? [];
    return { events, cursor: data.cursor ?? null };
}

/**
 * Fetch markets list (alternative to events).
 */
export async function fetchDflowMarkets(params?: {
    limit?: number;
    cursor?: number;
    sort?: "volume" | "volume24h" | "liquidity" | "openInterest" | "startDate";
}): Promise<{ markets: DFlowMarket[]; cursor: number | null }> {
    const url = new URL(`${DFLOW_MARKETS_API_URL}/api/v1/markets`);
    url.searchParams.set("limit", String(params?.limit ?? 50));
    if (params?.cursor != null) url.searchParams.set("cursor", String(params.cursor));
    if (params?.sort) url.searchParams.set("sort", params.sort);

    const res = await fetch(url.toString(), { headers: getHeaders() });
    if (!res.ok) {
        if (res.status === 403) {
            throw new Error(
                "DFlow API: 403 Forbidden. Add EXPO_PUBLIC_DFLOW_API_KEY or use development endpoint URL."
            );
        }
        throw new Error(`DFlow markets: ${res.status}`);
    }
    const data = (await res.json()) as DFlowMarketsResponse;
    return { markets: data.markets ?? [], cursor: data.cursor ?? null };
}

/**
 * Fetch single event by ticker (for detail).
 */
export async function fetchDflowEvent(eventTicker: string): Promise<DFlowEvent | null> {
    const url = `${DFLOW_MARKETS_API_URL}/api/v1/event/${encodeURIComponent(eventTicker)}?withNestedMarkets=true&withMarketAccounts=true`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) return null;
    return (await res.json()) as DFlowEvent;
}

/**
 * Fetch market candlesticks for chart (by market ticker).
 * Returns chart points: { timestamp, value } with value 0-1.
 */
export async function fetchDflowMarketCandlesticks(
    ticker: string,
    params?: { startTs?: number; endTs?: number; periodInterval?: number }
): Promise<ChartPoint[]> {
    const endTs = params?.endTs ?? Math.floor(Date.now() / 1000);
    const startTs = params?.startTs ?? endTs - 30 * 24 * 3600; // 30 days
    const periodInterval = params?.periodInterval ?? 60; // 1h

    const url = new URL(
        `${DFLOW_MARKETS_API_URL}/api/v1/market/${encodeURIComponent(ticker)}/candlesticks`
    );
    url.searchParams.set("startTs", String(startTs));
    url.searchParams.set("endTs", String(endTs));
    url.searchParams.set("periodInterval", String(periodInterval));

    const res = await fetch(url.toString(), { headers: getHeaders() });
    if (!res.ok) return [];
    const raw = (await res.json()) as unknown;
    // Kalshi-style candlesticks: array of { start_ts, yes_price, ... } or similar
    if (!Array.isArray(raw)) return [];
    return (raw as { start_ts?: number; yes_price?: number; open_ts?: number }[])
        .filter((c) => c && (c.start_ts != null || c.open_ts != null))
        .map((c) => ({
            timestamp: (c.start_ts ?? c.open_ts ?? 0) * 1000,
            value: typeof c.yes_price === "number" ? c.yes_price / 100 : 0.5,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Flatten events with nested markets into app Market[].
 * Pass seriesCategoryMap from buildSeriesCategoryData() so category = raw DFlow category.
 */
export function eventsToMarkets(
    events: DFlowEvent[],
    seriesCategoryMap?: Map<string, string> | null
): Market[] {
    const list: Market[] = [];
    for (const event of events) {
        const markets = event.markets ?? [];
        for (const market of markets) {
            if (market.ticker && market.status !== "closed") {
                list.push(dflowEventMarketToMarket(event, market, seriesCategoryMap));
            }
        }
    }
    return list;
}

const TARGET_MARKET_COUNT = 100;
const EVENTS_PAGE_LIMIT = 50;

/**
 * Fetch markets for Home/Markets screens (real DFlow data).
 * Fetches up to TARGET_MARKET_COUNT (100) via cursor pagination.
 * Returns only categories that have at least one market in the list (so home filters aren't empty).
 */
export async function fetchMarketsForApp(params?: {
    limit?: number;
    sort?: "volume" | "volume24h" | "liquidity";
}): Promise<{ markets: Market[]; categories: string[] }> {
    const targetCount = params?.limit ?? TARGET_MARKET_COUNT;
    const allMarkets: Market[] = [];
    let cursor: number | null = null;

    const { map: seriesCategoryMap } = await buildSeriesCategoryData();

    do {
        const { events, cursor: nextCursor } = await fetchDflowEvents({
            limit: EVENTS_PAGE_LIMIT,
            cursor: cursor ?? undefined,
            sort: params?.sort ?? "volume",
            status: "active",
        });
        const pageMarkets = eventsToMarkets(events, seriesCategoryMap);
        for (const m of pageMarkets) {
            if (allMarkets.length >= targetCount) break;
            allMarkets.push(m);
        }
        cursor = nextCursor;
        if (!cursor || pageMarkets.length === 0) break;
    } while (allMarkets.length < targetCount);

    const categories = [...new Set(allMarkets.map((m) => m.category))].sort((a, b) => a.localeCompare(b));
    return { markets: allMarkets, categories };
}

/**
 * Fetch single market for detail screen (by market ticker or event ticker).
 * If id looks like event ticker, fetch event and use first market; else treat as market ticker.
 */
export async function fetchMarketForApp(id: string): Promise<Market | null> {
    const { map: seriesCategoryMap } = await buildSeriesCategoryData();
    const event = await fetchDflowEvent(id);
    if (event?.markets?.length) {
        const m = event.markets[0];
        return dflowEventMarketToMarket(event, m, seriesCategoryMap);
    }
    const { events } = await fetchDflowEvents({ limit: 100 });
    for (const ev of events) {
        const market = ev.markets?.find((m) => m.ticker === id);
        if (market) return dflowEventMarketToMarket(ev, market, seriesCategoryMap);
    }
    return null;
}
