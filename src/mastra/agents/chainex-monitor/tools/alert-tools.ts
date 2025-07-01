import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { memory } from "../index";

type WorkingMemoryResult = { workingMemory?: string } | null;

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
        const memoryResult = await memory.getWorkingMemory({ threadId, resourceId }) as WorkingMemoryResult;
        if (memoryResult && memoryResult.workingMemory) {
            try {
                const alerts = JSON.parse(memoryResult.workingMemory);
                // Support both array and object legacy format
                if (Array.isArray(alerts)) {
                  return { alerts };
                } else if (alerts && typeof alerts === 'object') {
                  return { alerts: Object.values(alerts) };
                }
            } catch (e) {
                console.error("Could not parse alerts from working memory", e);
                return { alerts: [] };
            }
        }
        return { alerts: [] };
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
        const memoryResult = await memory.getWorkingMemory({ threadId, resourceId }) as WorkingMemoryResult;
        
        let alertCount = 0;
        if (memoryResult && memoryResult.workingMemory) {
            try {
                const alerts = JSON.parse(memoryResult.workingMemory);
                alertCount = Object.keys(alerts).length;
                console.log(`Found ${alertCount} alerts to check:`, alerts);
            } catch (e) {
                console.error("Could not parse alerts from working memory", e);
            }
        }
        return { checked: alertCount };
    },
}); 