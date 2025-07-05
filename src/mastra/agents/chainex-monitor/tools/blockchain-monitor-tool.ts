import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { memory } from "../index";
import { promises as fs } from "fs";
import path from "path";

// Simple file-based alert storage
const ALERTS_FILE = path.join(process.cwd(), "alerts.json");

async function loadAlerts(): Promise<any[]> {
  try {
    const data = await fs.readFile(ALERTS_FILE, "utf8");
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

async function saveAlerts(alerts: any[]): Promise<void> {
  await fs.writeFile(ALERTS_FILE, JSON.stringify(alerts, null, 2));
}

export const blockchainMonitorTool = createTool({
  id: "blockchain-monitor",
  description: "Fetches real-time blockchain data such as transactions or token movements from various blockchains",
  inputSchema: z.object({
    chain: z.string().optional().describe("Blockchain name (e.g., Ethereum, Solana, Polygon)"),
    address: z.string().describe("Wallet or contract address to monitor"),
    eventType: z.enum(["transaction", "tokenTransfer", "balance"]).describe("Type of event to track"),
    limit: z.number().optional().default(10).describe("Number of transactions to fetch (max 50)"),
  }),
  outputSchema: z.object({
    transactions: z.array(z.object({
      hash: z.string(),
      from: z.string(),
      to: z.string(),
      value: z.string(),
      timestamp: z.string(),
      chain: z.string(),
      status: z.string(),
    })),
    summary: z.any(),
  }),
  execute: async ({ context }) => {
    let { chain, address, eventType, limit = 10 } = context;
    
    // Infer chain from address if not provided
    if (!chain) {
      if (address.startsWith("0x") && address.length === 42) {
        chain = "ethereum";
      } else if (address.length >= 32 && address.length <= 44) {
        // Basic check for Solana address format (Base58)
        chain = "solana";
      } else {
        throw new Error("Could not infer blockchain from address. Please specify the 'chain' (e.g., Ethereum, Solana).");
      }
    }
    
    try {
      // Validate input
      if (!address || address.length < 10) {
        throw new Error("Invalid address provided");
      }
      
      if (limit > 50) {
        throw new Error("Limit cannot exceed 50 transactions");
      }

      let transactions = [];
      
      // Handle different blockchains
      if (chain.toLowerCase() === "solana") {
        transactions = await fetchSolanaTransactions(address, limit);
      } else if (chain.toLowerCase() === "ethereum") {
        transactions = await fetchEthereumTransactions(address, limit);
      } else {
        throw new Error(`Unsupported blockchain: ${chain}`);
      }

      // Calculate summary
      const totalValue = transactions.reduce((sum: number, tx: any) => {
        const value = parseFloat(tx.value) || 0;
        return sum + value;
      }, 0).toString();

      const timeRange = transactions.length > 0 
        ? `${transactions[transactions.length - 1].timestamp} to ${transactions[0].timestamp}`
        : "No transactions found";

      return {
        transactions,
        summary: {
          totalTransactions: transactions.length,
          totalValue,
          timeRange,
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch blockchain data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

async function fetchSolanaTransactions(address: string, limit: number) {
  const solanaRpc = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";

  // Step 1: Get recent signatures for the address
  const sigResponse = await fetch(solanaRpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getSignaturesForAddress",
      params: [address, { limit }],
    }),
  });
  const sigData = await sigResponse.json();
  if (!sigData.result || sigData.result.length === 0) {
    return [];
  }

  // Step 2: Fetch each transaction by signature
  const transactions = [];
  for (const sig of sigData.result) {
    const txResponse = await fetch(solanaRpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [sig.signature, { encoding: "json" }],
      }),
    });
    const txData = await txResponse.json();
    if (!txData.result) continue;
    const tx = txData.result;
    transactions.push({
      hash: sig.signature,
      from: tx.transaction.message.accountKeys[0]?.pubkey || "Unknown",
      to: tx.transaction.message.accountKeys[1]?.pubkey || "Unknown",
      value: tx.meta?.postBalances?.[1] - tx.meta?.preBalances?.[1] || "0",
      timestamp: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : new Date().toISOString(),
      chain: "Solana",
      status: tx.meta?.err ? "Failed" : "Success",
    });
  }
  return transactions;
}

async function fetchEthereumTransactions(address: string, limit: number) {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    throw new Error("ETHERSCAN_API_KEY is not set in the environment.");
  }
  const response = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${apiKey}`);
  
  const data = await response.json();
  
  if (!data.result || data.status !== "1") {
    return [];
  }

  return data.result.map((tx: any) => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: (parseInt(tx.value) / Math.pow(10, 18)).toString(), // Convert from wei to ETH
    timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
    chain: "Ethereum",
    status: tx.isError === "0" ? "Success" : "Failed",
  }));
}

// Solana Chain Info Tool using Solscan public API
type SolanaChainInfo = {
  blockHeight: number;
  currentEpoch: number;
  absoluteSlot: number;
  transactionCount: number;
};

export const solanaChainInfoTool = createTool({
  id: "solana-chain-info",
  description: "Fetches Solana blockchain overall information (block height, epoch, slot, transaction count) using Solscan public API.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    blockHeight: z.number(),
    currentEpoch: z.number(),
    absoluteSlot: z.number(),
    transactionCount: z.number(),
  }),
  execute: async () => {
    const SOLSCAN_API_KEY = process.env.SOLSCAN_API_KEY;
    const url = "https://public-api.solscan.io/chaininfo";
    const headers: Record<string, string> = {
      "accept": "application/json",
    };
    if (SOLSCAN_API_KEY) {
      headers["token"] = SOLSCAN_API_KEY;
    }
    const response = await fetch(url, { headers });
    const data = await response.json();
    if (!data.success || !data.data) {
      throw new Error("Failed to fetch Solana chain info from Solscan");
    }
    const { blockHeight, currentEpoch, absoluteSlot, transactionCount } = data.data;
    return { blockHeight, currentEpoch, absoluteSlot, transactionCount };
  },
});

// RAG for DeFi Analytics Tool Scaffold
export const defiRagTool = createTool({
  id: "defi-rag-analytics",
  description: "Answers natural language DeFi analytics questions by retrieving relevant data and synthesizing an answer using the LLM.",
  inputSchema: z.object({
    question: z.string().describe("A natural language DeFi analytics question, e.g. 'What was the largest swap on Raydium in the last 24h?'")
  }),
  outputSchema: z.object({
    answer: z.string(),
    supportingData: z.any().optional(),
  }),
  execute: async ({ context }) => {
    const { question } = context;

    // 1. Use the LLM to parse the question and determine which analytics tool(s) to call
    const planPrompt = `Given the following DeFi analytics question, output a JSON object with the tool to use (one of: 'solana-defi-protocol-summary', 'defi-protocol-summary', 'solana-chain-info', 'blockchain-monitor') and the required parameters.\nIf the question is about a blockchain address, always include the 'chain' parameter (e.g., 'Ethereum', 'Solana') based on the address format or user wording. If the chain is not specified, try to infer it from the address or ask for clarification.\n\nQuestion: ${question}\n\nExample output:\n{"tool": "blockchain-monitor", "params": {"chain": "Ethereum", "address": "0x...", "eventType": "transaction", "limit": 20}}`;
    let toolPlan;
    try {
      const planResponse = await callOllama(planPrompt);
      toolPlan = JSON.parse(planResponse);
      // Debug log for troubleshooting
      console.log("LLM tool plan:", toolPlan);
    } catch (e) {
      return { answer: `Failed to parse tool plan from LLM: ${e}`, supportingData: null };
    }

    // Fallback: If address is present and chain is missing, try to infer from address format
    if (toolPlan.params && toolPlan.params.address && !toolPlan.params.chain) {
      const addr = toolPlan.params.address || "";
      if (addr.startsWith("0x") && addr.length === 42) {
        toolPlan.params.chain = "Ethereum";
      } else if (addr.length === 44) {
        toolPlan.params.chain = "Solana";
      } else {
        return { answer: "Please specify the blockchain (e.g., Ethereum, Solana) for this address.", supportingData: null };
      }
    }

    // 2. Dynamically call the relevant analytics tool(s)
    // TODO: Replace with actual dynamic invocation logic
    // Example: const data = await invokeAnalyticsTool(toolPlan.tool, toolPlan.params);
    const data = {};

    // 3. Use the LLM to synthesize an answer from the data and the original question
    const synthesisPrompt = `Given the following DeFi analytics question and the supporting data, generate a concise, user-friendly answer.\n\nQuestion: ${question}\n\nSupporting data (JSON):\n${JSON.stringify(data, null, 2)}\n\nAnswer:`;
    let answer;
    try {
      answer = await callOllama(synthesisPrompt);
    } catch (e) {
      answer = `Failed to generate answer with LLM: ${e}`;
    }

    return {
      answer,
      supportingData: data,
    };
  },
});

// Utility function to call Ollama LLM API
export async function callOllama(prompt: string): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3";
  const url = `${baseUrl}/api/generate`;
  const body = {
    model,
    prompt,
    stream: false
  };
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (!data.response) {
    throw new Error("No response from Ollama LLM");
  }
  return data.response.trim();
}

export const setupAlertTool = createTool({
  id: "setup-alert",
  description: "Set up a DeFi alert from a natural language request (e.g., 'Alert me if Uniswap v3 pool 0xABC... has a swap over $100,000').",
  inputSchema: z.object({
    request: z.string().describe("Natural language alert request"),
    resourceId: z.string().describe("User or entity ID for memory context"),
    threadId: z.string().describe("Thread or alert context ID for memory context"),
  }),
  outputSchema: z.object({
    message: z.string(),
    alert: z.any().optional(),
  }),
  execute: async ({ context }) => {
    const { request, resourceId, threadId } = context;
    // 1. Use LLM to parse the alert request into a structured config
    const prompt = `Parse the following DeFi alert request into a JSON object with fields: protocol, poolAddress, condition (with type and minUSD if relevant).\nRequest: ${request}\n\nExample output:\n{"protocol": "uniswap-v3", "poolAddress": "0xABC...", "condition": {"type": "swap", "minUSD": 100000}}`;
    let alertConfig;
    try {
      const llmResponse = await callOllama(prompt);
      console.log("[setupAlertTool] Raw LLM response:", llmResponse);
      // Remove code block formatting if present
      const cleaned = llmResponse.replace(/```json|```/g, '').trim();
      alertConfig = JSON.parse(cleaned);
    } catch (e) {
      return { message: `Failed to parse alert config from LLM: ${e}` };
    }
    
    // 2. Store the alert config in file-based storage
    try {
      const alerts = await loadAlerts();
      const newAlert = {
        ...alertConfig,
        threadId,
        resourceId,
        createdAt: Date.now(),
        active: true
      };
      alerts.push(newAlert);
      await saveAlerts(alerts);
      
      // Also persist the agent's confirmation response as a message
      await memory.saveMessages({
        messages: [
          {
            id: `alert-setup-${Date.now()}`,
            role: "assistant",
            content: `Alert set up successfully!\n${JSON.stringify(alertConfig)}`,
            threadId,
            resourceId,
            createdAt: new Date(),
            type: "text"
          }
        ]
      });
    } catch (e) {
      return { message: `Failed to store alert: ${e}` };
    }
    return {
      message: `Alert set up successfully!`,
      alert: alertConfig,
    };
  },
}); 