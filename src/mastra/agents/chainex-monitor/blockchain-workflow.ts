import { Workflow } from "@mastra/core";
import { z } from "zod";

// Simplified workflow that focuses on the core blockchain monitoring functionality
// The complex step interactions can be implemented within the agent itself
export const chainexWorkflow = new Workflow({
  id: "chainex-monitor-workflow",
  description: "Blockchain monitoring workflow for transaction analysis",
  inputSchema: z.object({
    chain: z.string().default("Solana"),
    address: z.string(),
    eventType: z.enum(["transaction", "tokenTransfer", "balance"]).default("transaction"),
    limit: z.number().default(10),
  }),
  outputSchema: z.object({
    message: z.string(),
    status: z.string(),
    data: z.any().optional(),
  }),
  steps: [
    {
      id: "monitor",
      inputSchema: z.object({
        chain: z.string(),
        address: z.string(),
        eventType: z.string(),
        limit: z.number(),
      }),
      outputSchema: z.object({
        message: z.string(),
        status: z.string(),
        data: z.any().optional(),
      }),
      execute: async () => {
        // Simplified execution - the actual blockchain monitoring
        // is handled by the agent and tool directly
        return {
          message: "Blockchain monitoring workflow executed successfully",
          status: "completed",
          data: {
            note: "Use the chainexMonitorAgent for full blockchain monitoring functionality",
            features: [
              "Real-time transaction monitoring",
              "Multi-chain support (Solana, Ethereum)",
              "Transaction analysis and pattern detection",
              "Smart alerts for unusual activity"
            ]
          }
        };
      },
    },
  ],
}); 