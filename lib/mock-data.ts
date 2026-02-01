export interface ChartPoint {
    timestamp: number;
    value: number;
}

export interface Market {
    id: string;
    title: string;
    description?: string;
    /** DFlow category string (e.g. Politics, Economics, Entertainment) */
    category: string;
    imageUrl?: string;
    yesPrice: number; // 0-1
    volume: number; // in USD
    liquidityScore: number;
    resolveDate: string;

    // SPL Token mints for trading on Solana via dFlow
    yesMint: string;
    noMint: string;
    yesLabel?: string;
    noLabel?: string;

    ticker?: string;
    eventTicker?: string;
    status?: string;

    // Chart data (from DFlow candlesticks or empty)
    priceHistory: ChartPoint[];
}

