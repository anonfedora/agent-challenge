import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// The Graph endpoint for Uniswap v3 mainnet (decentralized network)
const UNISWAP_V3_SUBGRAPH_ID = "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV";
const THEGRAPH_API_KEY = process.env.THEGRAPH_API_KEY;
const UNISWAP_V3_SUBGRAPH = THEGRAPH_API_KEY
  ? `https://gateway.thegraph.com/api/${THEGRAPH_API_KEY}/subgraphs/id/${UNISWAP_V3_SUBGRAPH_ID}`
  : undefined;

export const defiProtocolSummaryTool = createTool({
  id: "defi-protocol-summary",
  description: "Summarizes DeFi protocol activity (Uniswap v3) for a given pool or token pair over a time window.",
  inputSchema: z.object({
    protocol: z.enum(["uniswap-v3"]).default("uniswap-v3"),
    poolAddress: z.string().optional().describe("Uniswap v3 pool contract address (optional if token pair provided)"),
    token0: z.string().optional().nullable().describe("Token0 address (optional, used with token1)"),
    token1: z.string().optional().nullable().describe("Token1 address (optional, used with token0)"),
    windowHours: z.number().default(24).describe("Time window in hours to summarize activity"),
  }),
  outputSchema: z.object({
    swapCount: z.number(),
    totalVolumeUSD: z.string(),
    liquidityChanges: z.string(),
    summary: z.string(),
    token0Price: z.number().nullable(),
    token1Price: z.number().nullable(),
  }),
  execute: async ({ context }) => {
    if (!UNISWAP_V3_SUBGRAPH) {
      throw new Error("THEGRAPH_API_KEY is not set in the environment.");
    }
    const { protocol, poolAddress, token0, token1, windowHours } = context;
    const safeToken0 = token0 || undefined;
    const safeToken1 = token1 || undefined;
    if (protocol !== "uniswap-v3") throw new Error("Only uniswap-v3 is supported in this MVP");

    // Calculate time window
    const now = Math.floor(Date.now() / 1000);
    const fromTimestamp = now - windowHours * 3600;

    // Build pool filter and query
    let query = "";
    if (poolAddress) {
      query = `{
        pool(id: "${poolAddress.toLowerCase()}") {
          id
          token0Price
          token1Price
          swaps(where: {timestamp_gte: ${fromTimestamp}}) {
            amountUSD
            timestamp
          }
          liquidityProviderCount
          totalValueLockedUSD
        }
      }`;
    } else if (safeToken0 && safeToken1) {
      query = `{
        pools(where: {token0: \"${safeToken0.toLowerCase()}\", token1: \"${safeToken1.toLowerCase()}\"}) {
          id
          token0Price
          token1Price
          swaps(where: {timestamp_gte: ${fromTimestamp}}) {
            amountUSD
            timestamp
          }
          liquidityProviderCount
          totalValueLockedUSD
        }
      }`;
    } else {
      throw new Error("Provide either poolAddress or both token0 and token1 addresses");
    }

    const response = await fetch(UNISWAP_V3_SUBGRAPH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${THEGRAPH_API_KEY}`,
      },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();
    console.log("[defiProtocolSummaryTool] The Graph response:", JSON.stringify(data, null, 2));
    if (data.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
    }
    let pool;
    if (poolAddress) {
      pool = data.data && data.data.pool;
    } else {
      pool = data.data && data.data.pools && data.data.pools[0];
    }
    if (!pool) {
      throw new Error("No pool found or no activity in the given window");
    }
    const swaps = pool.swaps || [];
    const swapCount = swaps.length;
    const totalVolumeUSD = swaps.reduce((sum: number, s: any) => sum + parseFloat(s.amountUSD), 0).toFixed(2);
    const liquidityChanges = `Liquidity Providers: ${pool.liquidityProviderCount}, TVL: $${parseFloat(pool.totalValueLockedUSD).toFixed(2)}`;
    const summary = `In the last ${windowHours}h, pool ${pool.id} had ${swapCount} swaps with $${totalVolumeUSD} volume. ${liquidityChanges}`;
    return {
      swapCount,
      totalVolumeUSD,
      liquidityChanges,
      summary,
      token0Price: pool.token0Price ? parseFloat(pool.token0Price) : null,
      token1Price: pool.token1Price ? parseFloat(pool.token1Price) : null,
    };
  },
}); 