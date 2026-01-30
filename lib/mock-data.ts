export type MarketCategory =
    | "Crypto"
    | "Politics"
    | "Macro"
    | "Sports"
    | "Tech"
    | "Culture";

export interface ChartPoint {
    timestamp: number;
    value: number;
}

export interface Market {
    id: string;
    title: string;
    description?: string;
    category: MarketCategory;
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

    // Added for Phase 3 Charts
    priceHistory: ChartPoint[];
}

export const MARKET_CATEGORIES: MarketCategory[] = [
    "Crypto",
    "Politics",
    "Macro",
    "Sports",
    "Tech",
    "Culture",
];

// Helper to generate mock history
const generateMockHistory = (basePrice: number, points: number = 24): ChartPoint[] => {
    const history: ChartPoint[] = [];
    const now = Date.now();
    const hourMs = 3600000;

    for (let i = points; i >= 0; i--) {
        const randomChange = (Math.random() - 0.5) * 0.05;
        const timestamp = now - i * hourMs;
        const value = Math.max(0.01, Math.min(0.99, basePrice + randomChange));
        history.push({ timestamp, value });
    }
    return history;
};

export const MOCK_MARKETS: Market[] = [
    {
        id: "1",
        title: "Will Bitcoin hit $100k in February 2026?",
        description: "This market resolves to YES if the price of Bitcoin (BTC) reaches or exceeds $100,000 USD at any point before March 1st, 2026, according to the Binance BTC/USDT spot price. Otherwise, it resolves to NO.",
        category: "Crypto",
        imageUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
        yesPrice: 0.65,
        volume: 1250000,
        liquidityScore: 92,
        resolveDate: "2026-02-28T23:59:59Z",
        yesMint: "yes_mint_btc_100k",
        noMint: "no_mint_btc_100k",
        yesLabel: "YES",
        noLabel: "NO",
        priceHistory: generateMockHistory(0.65),
    },
    {
        id: "2",
        title: "Will SOL flip ETH in market cap this year?",
        description: "This market resolves to YES if the market capitalization of Solana (SOL) exceeds that of Ethereum (ETH) at any point during the 2026 calendar year. Market cap data will be sourced from CoinMarketCap.",
        category: "Crypto",
        imageUrl: "https://cryptologos.cc/logos/solana-sol-logo.png",
        yesPrice: 0.32,
        volume: 850000,
        liquidityScore: 85,
        resolveDate: "2026-12-31T23:59:59Z",
        yesMint: "yes_mint_sol_flip",
        noMint: "no_mint_sol_flip",
        yesLabel: "YES",
        noLabel: "NO",
        priceHistory: generateMockHistory(0.32),
    },
    {
        id: "3",
        title: "Will the US Federal Reserve cut rates in March?",
        description: "This market resolves to YES if the Federal Open Market Committee (FOMC) announces a reduction in the federal funds rate target range at its March 2026 meeting. Otherwise, it resolves to NO.",
        category: "Macro",
        imageUrl: "https://images.unsplash.com/photo-1621416894522-d3b1951bb6c6?auto=format&fit=crop&q=80&w=200&h=200",
        yesPrice: 0.78,
        volume: 2100000,
        liquidityScore: 95,
        resolveDate: "2026-03-15T23:59:59Z",
        yesMint: "yes_mint_fed_cut",
        noMint: "no_mint_fed_cut",
        yesLabel: "YES",
        noLabel: "NO",
        priceHistory: generateMockHistory(0.78),
    },
    {
        id: "4",
        title: "Will Donald Trump win the 2024 Election?",
        description: "This market resolves to YES if Donald Trump is officially declared the winner of the 2024 US Presidential Election by Congress or a majority of major US news networks. Otherwise, it resolves to NO.",
        category: "Politics",
        imageUrl: "https://images.unsplash.com/photo-1580130718712-4cf4257be716?auto=format&fit=crop&q=80&w=200&h=200",
        yesPrice: 0.54,
        volume: 15400000,
        liquidityScore: 99,
        resolveDate: "2024-11-05T23:59:59Z",
        yesMint: "yes_mint_trump_win",
        noMint: "no_mint_trump_win",
        yesLabel: "Trump",
        noLabel: "Harris",
        priceHistory: generateMockHistory(0.54),
    },
    {
        id: "5",
        title: "Will SpaceX land on Mars by 2030?",
        description: "This market resolves to YES if SpaceX successfully lands a spacecraft (crewed or uncrewed) on the surface of Mars by the end of 2030 UTC. Success is defined by an official SpaceX or NASA announcement.",
        category: "Tech",
        imageUrl: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&q=80&w=200&h=200",
        yesPrice: 0.15,
        volume: 450000,
        liquidityScore: 70,
        resolveDate: "2030-12-31T23:59:59Z",
        yesMint: "yes_mint_spacex_mars",
        noMint: "no_mint_spacex_mars",
        yesLabel: "YES",
        noLabel: "NO",
        priceHistory: generateMockHistory(0.15),
    }
];
