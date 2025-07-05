import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { defiProtocolSummaryTool } from "./defi-protocol-summary-tool";
import { raydiumV3PoolInfoTool } from "./solana-defi-protocol-summary-tool";

// Simple token symbol to address mapping for Uniswap mainnet (expand as needed)
const UNISWAP_TOKEN_ADDRESSES: Record<string, string> = {
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  ETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // Alias for WETH
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  // Add more as needed
};

export const crossChainArbInsightsTool = createTool({
  id: "cross-chain-arb-insights",
  description: "Finds arbitrage opportunities and price correlations between equivalent pools on Uniswap and Raydium for any token pair.",
  inputSchema: z.object({
    token0Symbol: z.string(),
    token1Symbol: z.string(),
  }),
  outputSchema: z.object({
    opportunities: z.array(z.any()),
    correlation: z.number(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const { token0Symbol, token1Symbol } = context;
    // 1. Resolve Uniswap token addresses
    const token0 = UNISWAP_TOKEN_ADDRESSES[token0Symbol.toUpperCase()];
    const token1 = UNISWAP_TOKEN_ADDRESSES[token1Symbol.toUpperCase()];
    if (!token0 || !token1) {
      return {
        opportunities: [],
        correlation: 0,
        message: `Token address not found for one or both symbols: ${token0Symbol}, ${token1Symbol}`
      };
    }
    // 2. Find Uniswap pool address using The Graph
    let poolAddress;
    try {
      const query = `{
        pools(where: {token0: \"${token0.toLowerCase()}\", token1: \"${token1.toLowerCase()}\"}) { id }
        poolsAlt: pools(where: {token0: \"${token1.toLowerCase()}\", token1: \"${token0.toLowerCase()}\"}) { id }
      }`;
      const url = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await response.json();
      if (data.data && data.data.pools && data.data.pools.length > 0) {
        poolAddress = data.data.pools[0].id;
      } else if (data.data && data.data.poolsAlt && data.data.poolsAlt.length > 0) {
        poolAddress = data.data.poolsAlt[0].id;
      }
    } catch (e) {
      return { opportunities: [], correlation: 0, message: `Error fetching Uniswap pool: ${e}` };
    }
    if (!poolAddress) {
      return { opportunities: [], correlation: 0, message: `No Uniswap v3 pool found for ${token0Symbol}/${token1Symbol}` };
    }
    // 3. Find Raydium pool ID by symbol match
    let raydiumPoolId = null;
    try {
      const raydiumUrl = 'https://api-v3.raydium.io/pools/info/list?poolType=all&poolSortField=default&sortType=desc&pageSize=1000&page=1';
      const raydiumResp = await fetch(raydiumUrl, { headers: { 'accept': 'application/json' } });
      const raydiumData = await raydiumResp.json();
      if (raydiumData.success && raydiumData.data && Array.isArray(raydiumData.data.data)) {
        const pool = raydiumData.data.data.find((p: any) => {
          const a = p.mintA.symbol.toUpperCase();
          const b = p.mintB.symbol.toUpperCase();
          return (
            (a === token0Symbol.toUpperCase() && b === token1Symbol.toUpperCase()) ||
            (a === token1Symbol.toUpperCase() && b === token0Symbol.toUpperCase())
          );
        });
        if (pool) raydiumPoolId = pool.id;
      }
    } catch (e) {
      return { opportunities: [], correlation: 0, message: `Error fetching Raydium pools: ${e}` };
    }
    if (!raydiumPoolId) {
      return { opportunities: [], correlation: 0, message: `No Raydium pool found for ${token0Symbol}/${token1Symbol}` };
    }
    // 4. Fetch Uniswap price
    let uniData, raydiumData;
    try {
      uniData = await defiProtocolSummaryTool.execute({
        context: {
          protocol: 'uniswap-v3',
          poolAddress,
          token0: null,
          token1: null,
          windowHours: 24
        }
      } as any);
      console.log('[crossChainArbInsightsTool] Uniswap data:', JSON.stringify(uniData, null, 2));
    } catch (e) {
      return { opportunities: [], correlation: 0, message: `Error fetching Uniswap data: ${e}` };
    }
    try {
      raydiumData = await raydiumV3PoolInfoTool.execute({
        context: {
          poolAddress: raydiumPoolId
        }
      } as any);
      console.log('[crossChainArbInsightsTool] Raydium data:', JSON.stringify(raydiumData, null, 2));
    } catch (e) {
      return { opportunities: [], correlation: 0, message: `Error fetching Raydium data: ${e}` };
    }
    // Extract prices from tool outputs
    let priceUni = null, priceRaydium = null;
    if (uniData && typeof uniData === 'object') {
      priceUni = typeof uniData.token0Price === 'number' ? uniData.token0Price : null;
      console.log('[crossChainArbInsightsTool] Extracted Uniswap price:', priceUni);
    }
    if (raydiumData && raydiumData.pool && typeof raydiumData.pool.price === 'number') {
      priceRaydium = raydiumData.pool.price;
      console.log('[crossChainArbInsightsTool] Extracted Raydium price:', priceRaydium);
    } else if (raydiumData && raydiumData.pool && typeof raydiumData.pool.price === 'string') {
      priceRaydium = parseFloat(raydiumData.pool.price);
      console.log('[crossChainArbInsightsTool] Extracted Raydium price (parsed):', priceRaydium);
    }
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