import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { chainexMonitorAgent } from "./agents/chainex-monitor/index";

export const mastra = new Mastra({
	agents: { chainexMonitorAgent },
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
	}),
	server: {
		port: 8080,
		timeout: 10000,
	},
});
