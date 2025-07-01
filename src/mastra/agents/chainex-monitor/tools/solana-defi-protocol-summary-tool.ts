import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Solscan API endpoint for Raydium pool activity
const SOLSCAN_POOL_TXS_API = "https://public-api.solscan.io/amm/pools/transactions";
const SOLSCAN_API_KEY = process.env.SOLSCAN_API_KEY;

export const solanaDefiProtocolSummaryTool = createTool({
  id: "solana-defi-protocol-summary",
  description: "Summarizes Raydium pool activity on Solana for a given pool address over a time window.",
  inputSchema: z.object({
    protocol: z.enum(["raydium"]).default("raydium"),
    poolAddress: z.string().describe("Raydium pool address (Solana)"),
    windowHours: z.number().default(24).describe("Time window in hours to summarize activity"),
  }),
  outputSchema: z.object({
    swapCount: z.number(),
    totalVolumeUSD: z.string(),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    const { protocol, poolAddress, windowHours } = context;
    if (protocol !== "raydium") throw new Error("Only raydium is supported in this MVP");

    // Calculate time window
    const now = Math.floor(Date.now() / 1000);
    const fromTimestamp = now - windowHours * 3600;

    // Fetch recent transactions for the pool from Solscan
    const url = `${SOLSCAN_POOL_TXS_API}?pool=${poolAddress}&offset=0&limit=100`;
    const headers: Record<string, string> = {
      "accept": "application/json",
    };
    if (SOLSCAN_API_KEY) {
      headers["token"] = SOLSCAN_API_KEY;
    }
    const response = await fetch(url, { headers });
    const text = await response.text();

    if (!response.ok) {
      console.error(`[solanaDefiProtocolSummaryTool] Solscan HTTP error: ${response.status} ${response.statusText}`);
      console.error(`[solanaDefiProtocolSummaryTool] Response body:`, text);
      throw new Error(`Solscan API error: ${response.status} ${response.statusText}`);
    }

    if (!text) {
      console.error("[solanaDefiProtocolSummaryTool] Empty response from Solscan.");
      throw new Error("No data returned from Solscan. The API may be rate-limited or temporarily unavailable.");
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("[solanaDefiProtocolSummaryTool] Failed to parse JSON. Raw response:", text);
      throw new Error("Failed to parse Solscan response as JSON.");
    }
    if (!Array.isArray(data)) {
      console.error("[solanaDefiProtocolSummaryTool] Unexpected data format from Solscan:", data);
      throw new Error("Failed to fetch Raydium pool activity from Solscan");
    }

    // Filter swaps in the time window
    const swaps = data.filter((tx: any) =>
      tx.type === "swap" && tx.blockTime >= fromTimestamp
    );
    const swapCount = swaps.length;
    const totalVolumeUSD = swaps.reduce((sum: number, tx: any) => sum + (tx.amountOutUSD || 0), 0).toFixed(2);
    const summary = `In the last ${windowHours}h, Raydium pool ${poolAddress} had ${swapCount} swaps with ~$${totalVolumeUSD} volume.`;
    return {
      swapCount,
      totalVolumeUSD,
      summary,
    };
  },
});

export const raydiumV3PoolInfoTool = createTool({
  id: "raydium-v3-pool-info",
  description: "Fetches and summarizes Raydium pool info from the Raydium v3 API for a given pool address.",
  inputSchema: z.object({
    poolAddress: z.string().describe("Raydium pool address (id field in Raydium v3 API)"),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    pool: z.any().optional(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const { poolAddress } = context;
    const apiUrl = `https://api-v3.raydium.io/pools/info/list?poolType=all&poolSortField=default&sortType=desc&pageSize=1000&page=1`;
    try {
      const response = await fetch(apiUrl, { headers: { "accept": "application/json" } });
      if (!response.ok) {
        const text = await response.text();
        console.error(`[raydiumV3PoolInfoTool] Raydium API error: ${response.status} ${response.statusText}`);
        console.error(`[raydiumV3PoolInfoTool] Response body:`, text);
        return { found: false, message: `Raydium API error: ${response.status} ${response.statusText}` };
      }
      const data = await response.json();
      if (!data.success || !data.data || !Array.isArray(data.data.data)) {
        console.error("[raydiumV3PoolInfoTool] Unexpected data format from Raydium API:", data);
        return { found: false, message: "Unexpected data format from Raydium API" };
      }
      const pool = data.data.data.find((p: any) => p.id === poolAddress);
      if (!pool) {
        return { found: false, message: `Pool ${poolAddress} not found in Raydium v3 API.` };
      }
      // Ensure price field exists or calculate it if possible
      let price = null;
      if (typeof pool.price === 'number') {
        price = pool.price;
      } else if (typeof pool.price === 'string') {
        price = parseFloat(pool.price);
      } else if (pool.reserve0 && pool.reserve1 && pool.token0Decimals != null && pool.token1Decimals != null) {
        // Calculate price as reserve1/reserve0 adjusted for decimals
        const reserve0 = Number(pool.reserve0) / Math.pow(10, pool.token0Decimals);
        const reserve1 = Number(pool.reserve1) / Math.pow(10, pool.token1Decimals);
        if (reserve0 > 0) price = reserve1 / reserve0;
      }
      // Summarize key stats
      const summary = `Pool ${pool.id} (${pool.type}): TVL $${pool.tvl}, 24h Volume $${pool.day?.volume}, 24h APR ${pool.day?.apr}%.`;
      return { found: true, pool: { ...pool, price }, message: summary };
    } catch (e) {
      console.error("[raydiumV3PoolInfoTool] Exception:", e);
      return { found: false, message: `Error fetching Raydium pool info: ${e}` };
    }
  },
});

export const raydiumV3PoolHistoryTool = createTool({
  id: "raydium-v3-pool-history",
  description: "Fetches day, week, and month stats for a Raydium pool from the Raydium v3 API.",
  inputSchema: z.object({
    poolAddress: z.string().describe("Raydium pool address (id field in Raydium v3 API)"),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    history: z.object({
      day: z.any().optional(),
      week: z.any().optional(),
      month: z.any().optional(),
    }).optional(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const { poolAddress } = context;
    const apiUrl = `https://api-v3.raydium.io/pools/info/list?poolType=all&poolSortField=default&sortType=desc&pageSize=1000&page=1`;
    try {
      const response = await fetch(apiUrl, { headers: { "accept": "application/json" } });
      if (!response.ok) {
        const text = await response.text();
        console.error(`[raydiumV3PoolHistoryTool] Raydium API error: ${response.status} ${response.statusText}`);
        console.error(`[raydiumV3PoolHistoryTool] Response body:`, text);
        return { found: false, message: `Raydium API error: ${response.status} ${response.statusText}` };
      }
      const data = await response.json();
      if (!data.success || !data.data || !Array.isArray(data.data.data)) {
        console.error("[raydiumV3PoolHistoryTool] Unexpected data format from Raydium API:", data);
        return { found: false, message: "Unexpected data format from Raydium API" };
      }
      const pool = data.data.data.find((p: any) => p.id === poolAddress);
      if (!pool) {
        return { found: false, message: `Pool ${poolAddress} not found in Raydium v3 API.` };
      }
      const history = {
        day: pool.day,
        week: pool.week,
        month: pool.month,
      };
      const summary = `Pool ${pool.id}:\n- 24h: $${pool.day?.volume} vol, APR ${pool.day?.apr}%\n- 7d: $${pool.week?.volume} vol, APR ${pool.week?.apr}%\n- 30d: $${pool.month?.volume} vol, APR ${pool.month?.apr}%`;
      return { found: true, history, message: summary };
    } catch (e) {
      console.error("[raydiumV3PoolHistoryTool] Exception:", e);
      return { found: false, message: `Error fetching Raydium pool history: ${e}` };
    }
  },
});

export const raydiumV3PoolChartDataTool = createTool({
  id: "raydium-v3-pool-chart-data",
  description: "Returns chart-ready data (labels, volumes, aprs) for a Raydium pool from the Raydium v3 API.",
  inputSchema: z.object({
    poolAddress: z.string().describe("Raydium pool address (id field in Raydium v3 API)"),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    labels: z.array(z.string()),
    volumes: z.array(z.number()),
    aprs: z.array(z.number()),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const { poolAddress } = context;
    const apiUrl = `https://api-v3.raydium.io/pools/info/list?poolType=all&poolSortField=default&sortType=desc&pageSize=1000&page=1`;
    try {
      const response = await fetch(apiUrl, { headers: { "accept": "application/json" } });
      if (!response.ok) {
        const text = await response.text();
        console.error(`[raydiumV3PoolChartDataTool] Raydium API error: ${response.status} ${response.statusText}`);
        console.error(`[raydiumV3PoolChartDataTool] Response body:`, text);
        return { found: false, labels: [], volumes: [], aprs: [], message: `Raydium API error: ${response.status} ${response.statusText}` };
      }
      const data = await response.json();
      if (!data.success || !data.data || !Array.isArray(data.data.data)) {
        console.error("[raydiumV3PoolChartDataTool] Unexpected data format from Raydium API:", data);
        return { found: false, labels: [], volumes: [], aprs: [], message: "Unexpected data format from Raydium API" };
      }
      const pool = data.data.data.find((p: any) => p.id === poolAddress);
      if (!pool) {
        return { found: false, labels: [], volumes: [], aprs: [], message: `Pool ${poolAddress} not found in Raydium v3 API.` };
      }
      const labels = ["24h", "7d", "30d"];
      const volumes = [Number(pool.day?.volume || 0), Number(pool.week?.volume || 0), Number(pool.month?.volume || 0)];
      const aprs = [Number(pool.day?.apr || 0), Number(pool.week?.apr || 0), Number(pool.month?.apr || 0)];
      const message = `Chart data for pool ${pool.id}:\nVolumes: ${volumes.join(", ")}\nAPRs: ${aprs.join(", ")}`;
      return { found: true, labels, volumes, aprs, message };
    } catch (e) {
      console.error("[raydiumV3PoolChartDataTool] Exception:", e);
      return { found: false, labels: [], volumes: [], aprs: [], message: `Error fetching Raydium pool chart data: ${e}` };
    }
  },
}); 