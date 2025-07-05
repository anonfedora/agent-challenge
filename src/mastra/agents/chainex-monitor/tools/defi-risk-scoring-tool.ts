import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { defiProtocolSummaryTool } from "./defi-protocol-summary-tool";
import { raydiumV3PoolInfoTool } from "./solana-defi-protocol-summary-tool";

// Static audit list (expand as needed)
const AUDIT_LIST: Record<string, "audited" | "not_audited" | "flagged"> = {
  // Uniswap v3 main pools
  "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8": "audited", // USDC/ETH 0.3%
  "0x88e6a0c2dd26feeb64f039a2c41296fcb3f5640": "audited", // USDC/ETH 0.05%
  // Example Raydium pool
  "DrdecJVzkaRsf1TQu1g7iFncaokikVTHqpzPjenjRySY": "audited", // WETH/USDC
  // Add more as needed
};

function getVolumeRisk(volume: number): "Low" | "Medium" | "High" {
  if (volume > 10_000_000) return "Low";
  if (volume > 1_000_000) return "Medium";
  return "High";
}

function getVolatilityRisk(volatility: number): "Low" | "Medium" | "High" {
  if (volatility < 0.05) return "Low";
  if (volatility < 0.15) return "Medium";
  return "High";
}

function getImpermanentLossRisk(impLoss: number): "Low" | "Medium" | "High" {
  if (impLoss < 0.02) return "Low";
  if (impLoss < 0.10) return "Medium";
  return "High";
}

function getAuditRisk(status: string): "Low" | "Medium" | "High" {
  if (status === "audited") return "Low";
  if (status === "not_audited") return "Medium";
  return "High";
}

function aggregateRisk(risks: ("Low" | "Medium" | "High")[]): "Low" | "Medium" | "High" {
  if (risks.includes("High")) return "High";
  if (risks.includes("Medium")) return "Medium";
  return "Low";
}

export const defiRiskScoringTool = createTool({
  id: "defi-risk-scoring",
  description: "Assigns a Low/Medium/High risk score to a Uniswap or Raydium pool based on volume, volatility, impermanent loss, and audit status.",
  inputSchema: z.object({
    protocol: z.enum(["uniswap", "raydium"]),
    poolAddress: z.string(),
  }),
  outputSchema: z.object({
    riskLevel: z.enum(["Low", "Medium", "High"]),
    breakdown: z.object({
      volume: z.string(),
      volatility: z.string(),
      impermanentLoss: z.string(),
      audit: z.string(),
    }),
    details: z.string(),
  }),
  execute: async ({ context }) => {
    const { protocol, poolAddress } = context;
    let volume = 0, volatility = 0, impLoss = 0, auditStatus = "not_audited";
    let priceHistory: number[] = [];
    try {
      if (protocol === "uniswap") {
        const data = await defiProtocolSummaryTool.execute({
          context: {
            protocol: "uniswap-v3",
            poolAddress,
            token0: null,
            token1: null,
            windowHours: 168 // 7 days
          }
        } as any);
        volume = parseFloat(data.totalVolumeUSD || "0");
        // Simulate price history for volatility (in real use, fetch historical prices)
        priceHistory = [data.token0Price || 0];
      } else if (protocol === "raydium") {
        const data = await raydiumV3PoolInfoTool.execute({
          context: { poolAddress }
        } as any);
        volume = parseFloat(data.pool?.week?.volumeQuote || "0");
        // Simulate price history for volatility (in real use, fetch historical prices)
        priceHistory = [data.pool?.price || 0];
      }
    } catch (e) {
      return { riskLevel: "High" as const, breakdown: { volume: "High" as const, volatility: "High" as const, impermanentLoss: "High" as const, audit: "High" as const }, details: `Error fetching pool data: ${e}` };
    }
    // Volatility: use stddev/mean of priceHistory (simulate for now)
    if (priceHistory.length > 1) {
      const mean = priceHistory.reduce((a, b) => a + b, 0) / priceHistory.length;
      const variance = priceHistory.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / priceHistory.length;
      volatility = Math.sqrt(variance) / mean;
    } else {
      volatility = 0.05; // Simulate 5% volatility if no history
    }
    // Impermanent loss: simple estimate as half the volatility
    impLoss = volatility / 2;
    // Audit status
    auditStatus = AUDIT_LIST[poolAddress.toLowerCase()] || "not_audited";
    // Assign risk levels
    const volumeRisk = getVolumeRisk(volume);
    const volatilityRisk = getVolatilityRisk(volatility);
    const impLossRisk = getImpermanentLossRisk(impLoss);
    const auditRisk = getAuditRisk(auditStatus);
    const riskLevel = aggregateRisk([volumeRisk, volatilityRisk, impLossRisk, auditRisk]);
    return {
      riskLevel: riskLevel as "Low" | "Medium" | "High",
      breakdown: {
        volume: volumeRisk as "Low" | "Medium" | "High",
        volatility: volatilityRisk as "Low" | "Medium" | "High",
        impermanentLoss: impLossRisk as "Low" | "Medium" | "High",
        audit: auditRisk as "Low" | "Medium" | "High",
      },
      details: `Volume: $${volume.toLocaleString()}, Volatility: ${(volatility*100).toFixed(2)}%, Impermanent Loss: ${(impLoss*100).toFixed(2)}%, Audit: ${auditStatus}`
    };
  }
}); 