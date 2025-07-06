# Chainex Monitor Agent

A blockchain monitoring agent built with Mastra that tracks real-time on-chain activities across multiple blockchains including Solana, Ethereum, and others.

## Features

- **Multi-Chain Support**: Monitor transactions on Solana, Ethereum, and other blockchains
- **Real-Time Data**: Fetch live transaction data using blockchain APIs
- **Transaction Analysis**: Analyze transaction patterns, success rates, and value movements
- **Smart Alerts**: Automatic detection of unusual activity patterns
- **Comprehensive Reporting**: Detailed transaction summaries with timestamps and status

## Setup

### Prerequisites

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the project root:
   ```env
   OPENAI_API_KEY=your-openai-api-key
   OLLAMA_ENDPOINT=http://localhost:11434
   SOLANA_RPC=https://api.mainnet-beta.solana.com
   ETHERSCAN_API_KEY=your-etherscan-api-key
   ```

3. **Local LLM Setup (Optional)**:
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.com/install.sh | sh
   
   # Start Ollama service
   ollama serve
   
   # Pull and run a model
   ollama pull qwen2.5:1.5b
   ollama run qwen2.5:1.5b
   ```

### Running Locally

1. **Start Development Server**:
   ```bash
   pnpm run dev
   ```

2. **Access the Playground**:
   Open [http://localhost:8080](http://localhost:8080) in your browser

3. **Test the Agent**:
   Try queries like:
   - "Monitor transactions for address 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM on Solana"
   - "Show me the last 20 transactions for this Ethereum address: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"

## Tools

### blockchainMonitorTool

Fetches real-time blockchain data for monitoring purposes.

**Input Parameters**:
- `chain`: Blockchain name (e.g., "Solana", "Ethereum", "Polygon")
- `address`: Wallet or contract address to monitor
- `eventType`: Type of event to track ("transaction", "tokenTransfer", "balance")
- `limit`: Number of transactions to fetch (max 50, default 10)

**Output**:
- `transactions`: Array of transaction objects with hash, from/to addresses, value, timestamp, chain, and status
- `summary`: Summary statistics including total transactions, total value, and time range

## Usage Examples

### Basic Transaction Monitoring
```
User: "Monitor the last 10 transactions for address 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM on Solana"

Agent: "I'll fetch the recent transactions for that Solana address. Here are the last 10 transactions:
- Transaction: 5J7X... (Success) - 0.5 SOL from 9WzDX... to 7K8Y...
- Transaction: 3M2N... (Success) - 0.1 SOL from 7K8Y... to 9WzDX...
..."
```

### Transaction Analysis
```
User: "Analyze the transaction patterns for this address"

Agent: "Based on the transaction data:
- Total Transactions: 15
- Successful: 14 (93.3% success rate)
- Failed: 1 (6.7% failure rate)
- Total Value Moved: 2.5 SOL
- Average Transaction Value: 0.167 SOL
- Alerts: Normal activity detected"
```

### Specific Example Prompts

**Ethereum Transaction Monitoring:**
```
User: "Show me the last 20 transactions for this Ethereum address: 0x388C818CA8B9251b393131C08a736A67ccB19297"

Agent: "I'll fetch the recent Ethereum transactions for that address. Here are the last 20 transactions with details..."
```

**Alert Setup:**
```
User: "Set an alert: Alert me if Uniswap v3 pool 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640 has a swap over $100,000 for 2 hours"

Agent: "Alert set up successfully! I'll monitor the Uniswap v3 pool for swaps over $100,000..."
```

**Raydium Pool Information:**
```
User: "Show me the Raydium pool info for 3ucNos4NbumPLZNWztqGHNFFgkHeRMBQAVemeeomsUxv"

Agent: "Here's the Raydium pool information: Pool type, TVL, current price, 24h volume, APR..."
```

**Raydium Pool Statistics:**
```
User: "Show me the 24h, 7d, and 30d stats for Raydium pool 3ucNos4NbumPLZNWztqGHNFFgkHeRMBQAVemeeomsUxv"

Agent: "Here are the historical statistics for the Raydium pool:
- 24h: $X volume, Y% APR
- 7d: $X volume, Y% APR  
- 30d: $X volume, Y% APR"
```

**Solana Chain Information:**
```
User: "solana chain info"

Agent: "Here's the current Solana blockchain information:
- Block Height: X
- Current Epoch: Y
- Absolute Slot: Z
- Transaction Count: W"
```

**Risk Assessment:**
```
User: "What is the risk level of the Uniswap USDC/ETH pool?"

Agent: "Risk Assessment for Uniswap USDC/ETH pool:
- Risk Level: Medium
- Volume: Low risk (high volume)
- Volatility: Medium risk
- Impermanent Loss: Low risk
- Audit: Low risk (audited)"
```

## Supported Blockchains

### Solana
- Uses Solana RPC API
- Supports transaction history, token transfers, and balance queries
- Real-time data from mainnet-beta

### Ethereum
- Uses Etherscan API (requires API key)
- Supports transaction history and token transfers
- Converts values from Wei to ETH

### Future Support
- Polygon
- Binance Smart Chain
- Arbitrum
- Other EVM-compatible chains

## Error Handling

The agent includes comprehensive error handling for:
- Invalid addresses
- Unsupported blockchains
- API rate limits
- Network connectivity issues
- Malformed responses

## Development

### Project Structure
```
src/mastra/agents/chainex-monitor/
├── index.ts                    # Main agent definition
├── tools/
│   └── blockchain-monitor-tool.ts  # Blockchain data fetching tool
├── blockchain-workflow.ts      # Advanced workflow (optional)
└── README.md                   # This documentation
```

### Adding New Blockchains

To add support for a new blockchain:

1. Add a new function in `blockchain-monitor-tool.ts`:
   ```typescript
   async function fetchNewChainTransactions(address: string, limit: number) {
     // Implementation for new blockchain
   }
   ```

2. Update the main execute function to handle the new chain:
   ```typescript
   if (chain.toLowerCase() === "newchain") {
     transactions = await fetchNewChainTransactions(address, limit);
   }
   ```

3. Update the input schema to include the new chain option.

## Deployment

### Docker
```bash
# Build the image
docker build -t yourusername/chainex-monitor:latest .

# Run locally
docker run -p 8080:8080 --env-file .env yourusername/chainex-monitor:latest

# Push to Docker Hub
docker push yourusername/chainex-monitor:latest
```

### Nosana Deployment
1. Update `nos_job_def/nosana_mastra.json` with your Docker image
2. Deploy using Nosana CLI or Dashboard
3. Monitor the deployment status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Nosana Builders Challenge and follows the challenge guidelines. 