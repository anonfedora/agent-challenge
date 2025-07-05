import { Agent } from "@mastra/core";
import { chainexWorkflow } from "./blockchain-workflow";
import { blockchainMonitorTool, solanaChainInfoTool, defiRagTool, setupAlertTool } from "./tools/blockchain-monitor-tool";
import { listAlertsTool, checkAlertsTool } from "./tools/alert-tools";
import { crossChainArbInsightsTool } from "./tools/cross-chain-arb-tool";
import { defiProtocolSummaryTool } from "./tools/defi-protocol-summary-tool";
import { solanaDefiProtocolSummaryTool, raydiumV3PoolInfoTool, raydiumV3PoolHistoryTool, raydiumV3PoolChartDataTool } from "./tools/solana-defi-protocol-summary-tool";
import { defiRiskScoringTool } from "./tools/defi-risk-scoring-tool";
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
  description: `A blockchain monitoring agent for real-time transaction and DeFi analytics across Solana, Ethereum, and more.
  - Use the DeFi risk scoring tool to assess the risk (Low/Medium/High) of any Uniswap or Raydium pool.
  - Provide arbitrage, analytics, and risk insights for any token pair.
  - Summarize DeFi protocol activity, monitor transactions, and set up alerts.`,
  instructions: `
    You are a blockchain monitor agent specialized in tracking on-chain activities. Your tasks:
    - Use the DeFi risk scoring tool to assess the risk (Low/Medium/High) of any Uniswap or Raydium pool.
    - If the user asks for a risk assessment or risk level of a pool, use the defiRiskScoringTool with the correct protocol and pool address.
    - Provide arbitrage, analytics, and risk insights for any token pair.
    - Summarize DeFi protocol activity, monitor transactions, and set up alerts.

    ## Examples
    User: What is the risk level of the Uniswap USDC/ETH pool?
    Tool call: defiRiskScoringTool({ protocol: "uniswap", poolAddress: "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8" })

    User: Give me a risk assessment for the Raydium WETH/USDC pool.
    Tool call: defiRiskScoringTool({ protocol: "raydium", poolAddress: "DrdecJVzkaRsf1TQu1g7iFncaokikVTHqpzPjenjRySY" })

    User: Rate the risk (Low/Medium/High) for Raydium pool DrdecJVzkaRsf1TQu1g7iFncaokikVTHqpzPjenjRySY.
    Tool call: defiRiskScoringTool({ protocol: "raydium", poolAddress: "DrdecJVzkaRsf1TQu1g7iFncaokikVTHqpzPjenjRySY" })

    User: Assess the risk for Uniswap pool 0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8.
    Tool call: defiRiskScoringTool({ protocol: "uniswap", poolAddress: "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8" })
  `,
  model, // Use Ollama model from config
  tools: {
    blockchainMonitorTool,
    solanaChainInfoTool,
    defiRagTool,
    setupAlertTool,
    listAlertsTool,
    checkAlertsTool,
    crossChainArbInsightsTool,
    defiProtocolSummaryTool,
    solanaDefiProtocolSummaryTool,
    raydiumV3PoolInfoTool,
    raydiumV3PoolHistoryTool,
    raydiumV3PoolChartDataTool,
    defiRiskScoringTool,
  },
  memory, // Attach memory instance for stateful context
});

export { memory };
 