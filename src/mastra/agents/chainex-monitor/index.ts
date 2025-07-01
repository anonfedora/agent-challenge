import { Agent } from "@mastra/core";
import { blockchainMonitorTool } from "./tools/blockchain-monitor-tool";
import { defiProtocolSummaryTool } from "./tools/defi-protocol-summary-tool";
import { solanaDefiProtocolSummaryTool } from "./tools/solana-defi-protocol-summary-tool";
import { raydiumV3PoolInfoTool } from "./tools/solana-defi-protocol-summary-tool";
import { raydiumV3PoolHistoryTool } from "./tools/solana-defi-protocol-summary-tool";
import { raydiumV3PoolChartDataTool } from "./tools/solana-defi-protocol-summary-tool";
import { crossChainArbInsightsTool } from "./tools/cross-chain-arb-tool";
import { model } from "../../config";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";

// Instantiate memory with a local SQLite file (can be changed as needed)
const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:../../memory.db",
  }),
});

export const chainexMonitorAgent = new Agent({
  name: "Chainex Monitor Agent",
  instructions: `
    You are a blockchain monitor agent specialized in tracking on-chain activities. Your tasks:
    - Always respond in English, regardless of the user's language or locale.
    - Monitor token movements, wallet activities, and smart contract events
    - Use the blockchain monitor tool to fetch real-time data from various blockchains
    - Use the DeFi protocol summary tool to summarize Uniswap v3 activity for a given pool or token pair
    - Use the Solana DeFi protocol summary tool to summarize Raydium pool activity for a given pool address
    - Provide clear summaries of blockchain activities (e.g., "Token transfer of 100 USDT detected from wallet X to Y")
    - Handle errors gracefully and ask for clarification when needed
    - Support multiple blockchains including Solana, Ethereum, and others
    - Provide transaction details including hash, from/to addresses, value, and timestamp
  `,
  model, // Use Ollama model from config
  tools: {
    blockchainMonitorTool,
    defiProtocolSummaryTool,
    raydiumV3PoolInfoTool,
    raydiumV3PoolHistoryTool,
    raydiumV3PoolChartDataTool,
    crossChainArbInsightsTool,
  },
  memory, // Attach memory instance for stateful context
});

export { memory }; 