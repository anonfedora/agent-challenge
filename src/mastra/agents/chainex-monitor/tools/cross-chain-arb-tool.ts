import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { defiProtocolSummaryTool } from "./defi-protocol-summary-tool";
import { raydiumV3PoolInfoTool } from "./solana-defi-protocol-summary-tool";

// Example static mapping for USDC/ETH
const POOL_MAPPING: Record<string, {
  uniswap: { protocol: string; poolAddress: string };
  raydium: { protocol: string; poolAddress: string };
}> = {
  "USDC-ETH": {
    uniswap: {
      protocol: "uniswap-v3",
      poolAddress: "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8" // Uniswap v3 USDC/ETH 0.3% pool
    },
    raydium: {
      protocol: "raydium",
      poolAddress: "8HoQnePLqPj4M7PUDzfw8e3Yw1E5vZ9P9L6GrVpm74sC" // Raydium USDC/ETH pool
    }
  }
};

// Minimal dummy runtimeContext for tool execution
const dummyRuntimeContext = {
  registry: new Map(),
  get: () => undefined,
  set: () => {},
  has: () => false,
  delete: () => {},
  clear: () => {},
  keys: () => [],
  values: () => [],
  entries: () => [],
  forEach: () => {},
  size: 0,
};

export const crossChainArbInsightsTool = createTool({
  id: "cross-chain-arb-insights",
  description: "Finds arbitrage opportunities and price correlations between equivalent pools on Uniswap and Raydium.",
  inputSchema: z.object({
    token0: z.string(),
    token1: z.string(),
  }),
  outputSchema: z.object({
    opportunities: z.array(z.any()),
    correlation: z.number(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const { token0, token1 } = context;
    const key = `${token0.toUpperCase()}-${token1.toUpperCase()}`;
    const mapping = POOL_MAPPING[key];
    if (!mapping) {
      return {
        opportunities: [],
        correlation: 0,
        message: `No pool mapping found for ${token0}/${token1}`
      };
    }
    // Fetch Uniswap pool info
    let uniData, raydiumData;
    try {
      uniData = await defiProtocolSummaryTool.execute({
        context: {
          protocol: 'uniswap-v3',
          poolAddress: mapping.uniswap.poolAddress,
          token0: null,
          token1: null,
          windowHours: 24
        }
      } as any);
    } catch (e) {
      return { opportunities: [], correlation: 0, message: `Error fetching Uniswap data: ${e}` };
    }
    try {
      raydiumData = await raydiumV3PoolInfoTool.execute({
        context: {
          poolAddress: mapping.raydium.poolAddress
        }
      } as any);
    } catch (e) {
      return { opportunities: [], correlation: 0, message: `Error fetching Raydium data: ${e}` };
    }
    // Extract prices from tool outputs
    let priceUni = null, priceRaydium = null;
    if (uniData && typeof uniData === 'object') {
      // Prefer token0Price (USDC per ETH) for USDC/ETH pool
      priceUni = typeof uniData.token0Price === 'number' ? uniData.token0Price : null;
    }
    if (raydiumData && raydiumData.pool && typeof raydiumData.pool.price === 'number') {
      priceRaydium = raydiumData.pool.price;
    } else if (raydiumData && raydiumData.pool && typeof raydiumData.pool.price === 'string') {
      priceRaydium = parseFloat(raydiumData.pool.price);
    }
    // Fallback: if price not available, skip
    if (!priceUni || !priceRaydium) {
      return {
        opportunities: [],
        correlation: 0,
        message: `Could not extract prices for comparison. Uniswap: ${priceUni}, Raydium: ${priceRaydium}`
      };
    }
    // Calculate arbitrage margin
    const marginPercent = ((priceRaydium - priceUni) / priceUni) * 100;
    let opportunities = [];
    if (Math.abs(marginPercent) > 0.5) { // Arbitrage threshold
      opportunities.push({
        from: marginPercent > 0 ? "Uniswap" : "Raydium",
        to: marginPercent > 0 ? "Raydium" : "Uniswap",
        priceFrom: marginPercent > 0 ? priceUni : priceRaydium,
        priceTo: marginPercent > 0 ? priceRaydium : priceUni,
        marginPercent: Math.abs(marginPercent),
        details: `Arbitrage possible: Buy on ${marginPercent > 0 ? "Uniswap" : "Raydium"}, sell on ${marginPercent > 0 ? "Raydium" : "Uniswap"}`
      });
    }
    // Placeholder for correlation (requires historical data)
    const correlation = 0; // Not implemented
    const message = opportunities.length > 0
      ? `Arbitrage opportunity detected! Margin: ${marginPercent.toFixed(2)}%`
      : `No significant arbitrage opportunity. Price difference: ${marginPercent.toFixed(2)}%`;
    return {
      opportunities,
      correlation,
      message
    };
  }
}); 