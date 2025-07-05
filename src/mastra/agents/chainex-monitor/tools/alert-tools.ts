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

export const listAlertsTool = createTool({
    id: "list-alerts",
    description: "Lists all active alerts for a user.",
    inputSchema: z.object({
        threadId: z.string(),
        resourceId: z.string(),
    }),
    outputSchema: z.object({
        alerts: z.array(z.any()),
    }),
    execute: async ({ context }) => {
        const { threadId, resourceId } = context;
        try {
            const alerts = await loadAlerts();
            // Filter alerts by threadId and resourceId, and only active ones
            const userAlerts = alerts.filter(alert => 
                alert.threadId === threadId && 
                alert.resourceId === resourceId && 
                alert.active
            );
            return { alerts: userAlerts };
        } catch (e) {
            console.error("Could not retrieve alerts", e);
            return { alerts: [] };
        }
    },
});

export const checkAlertsTool = createTool({
    id: "check-alerts",
    description: "Checks all active alerts for a user (placeholder).",
    inputSchema: z.object({
        threadId: z.string(),
        resourceId: z.string(),
    }),
    outputSchema: z.object({
        checked: z.number(),
    }),
    execute: async ({ context }) => {
        const { threadId, resourceId } = context;
        try {
            const alerts = await loadAlerts();
            const userAlerts = alerts.filter(alert => 
                alert.threadId === threadId && 
                alert.resourceId === resourceId && 
                alert.active
            );
            const alertCount = userAlerts.length;
            console.log(`Found ${alertCount} alerts to check`);
            return { checked: alertCount };
        } catch (e) {
            console.error("Could not retrieve alerts", e);
            return { checked: 0 };
        }
    },
}); 