# Nosana Builders Challenge: Agent-101

![Agent-101](./assets/NosanaBuildersChallengeAgents.jpg)

## Topic

Nosana Builders Challenge, 2nd edition
Agent-101: Build your first agent

## Description

The main goal of this `Nosana Builders Challenge` to teach participants to build and deploy agents. This first step will be in running a basic AI agent and giving it some basic functionality. Participants will add a tool, for the tool calling capabilities of the agent. These are basically some TypeScript functions, that will, for example, retrieve some data from a weather API, post a tweet via an API call, etc.

## [Mastra](https://github.com/mastra-ai/mastra)

For this challenge we will be using Mastra to build our tool.

> Mastra is an opinionated TypeScript framework that helps you build AI applications and features quickly. It gives you the set of primitives you need: workflows, agents, RAG, integrations, and evals. You can run Mastra on your local machine, or deploy to a serverless cloud.

### Required Reading

We recommend reading the following sections to get started with how to create an Agent and how to implement Tool Calling.

- <https://mastra.ai/en/docs/agents/overview>
- [Mastra Guide: Build an AI stock agent](https://mastra.ai/en/guides/guide/stock-agent)

## Get Started

To get started run the following command to start developing:
We recommend using [pnpm](https://pnpm.io/installation), but you can try npm, or bun if you prefer.

```sh
pnpm install
pnpm run dev
```

## Assignment

### Challenge Overview

Welcome to the Nosana AI Agent Hackathon! Your mission is to build and deploy an AI agent on Nosana.
While we provide a weather agent as an example, your creativity is the limit. Build agents that:

**Beginner Level:**

- **Simple Calculator**: Perform basic math operations with explanations
- **Todo List Manager**: Help users track their daily tasks

**Intermediate Level:**

- **News Summarizer**: Fetch and summarize latest news articles
- **Crypto Price Checker**: Monitor cryptocurrency prices and changes
- **GitHub Stats Reporter**: Fetch repository statistics and insights

**Advanced Level:**

- **Blockchain Monitor**: Track and alert on blockchain activities
- **Trading Strategy Bot**: Automate simple trading strategies
- **Deploy Manager**: Deploy and manage applications on Nosana

Or any other innovative AI agent idea at your skill level!

### Getting Started

1. **Fork the [Nosana Agent Challenge](https://github.com/nosana-ai/agent-challenge)** to your GitHub account
2. **Clone your fork** locally
3. **Install dependencies** with `pnpm install`
4. **Run the development server** with `pnpm run dev`
5. **Build your agent** using the Mastra framework

### How to build your Agent

Here we will describe the steps needed to build an agent.

#### Folder Structure

This repository contains the **Chainex Monitor Agent** - a blockchain monitoring agent that tracks real-time on-chain activities across multiple blockchains.

The main agent folder is:

- [src/mastra/agents/chainex-monitor/](./src/mastra/agents/chainex-monitor/)

In `src/mastra/agents/chainex-monitor/` you will find a complete blockchain monitoring agent with:
- Agent definition for blockchain monitoring
- Custom tool for fetching real-time blockchain data
- Support for multiple blockchains (Solana, Ethereum)
- Transaction analysis and alerting capabilities
- Comprehensive documentation and setup instructions

The agent includes:
- `index.ts` - Main agent definition
- `tools/blockchain-monitor-tool.ts` - Blockchain data fetching tool
- `blockchain-workflow.ts` - Advanced workflow for transaction analysis
- `README.md` - Detailed documentation and usage examples

This agent demonstrates how to build a production-ready blockchain monitoring solution using Mastra.

### LLM-Endpoint

Agents depend on an LLM to be able to do their work.

#### Running Your Own LLM with Ollama

The default configuration uses a local [Ollama](https://ollama.com) LLM.
For local development or if you prefer to use your own LLM, you can use [Ollama](https://ollama.ai) to serve the lightweight `qwen2.5:1.5b` mode.

**Installation & Setup:**

1. **[ Install Ollama ](https://ollama.com/download)**:

2. **Start Ollama service**:

```bash
ollama serve
```

3. **Pull and run the `qwen2.5:1.5b` model**:

```bash
ollama pull qwen2.5:1.5b
ollama run qwen2.5:1.5b
```

4. **Update your `.env` file**

There are two predefined environments defined in the `.env` file. One for local development and another, with a larger model, `qwen2.5:32b`, for more complex use cases.

**Why `qwen2.5:1.5b`?**

- Lightweight (only ~1GB)
- Fast inference on CPU
- Supports tool calling
- Great for development and testing

Do note `qwen2.5:1.5b` is not suited for complex tasks.

The Ollama server will run on `http://localhost:11434` by default and is compatible with the OpenAI API format that Mastra expects.

### Testing your Agent

You can read the [Mastra Documentation: Playground](https://mastra.ai/en/docs/local-dev/mastra-dev) to learn more on how to test your agent locally.
Before deploying your agent to Nosana, it's crucial to thoroughly test it locally to ensure everything works as expected. Follow these steps to validate your agent:

**Local Testing:**

1. **Start the development server** with `pnpm run dev` and navigate to `http://localhost:8080` in your browser
2. **Test your agent's conversation flow** by interacting with it through the chat interface
3. **Verify tool functionality** by triggering scenarios that call your custom tools
4. **Check error handling** by providing invalid inputs or testing edge cases
5. **Monitor the console logs** to ensure there are no runtime errors or warnings

**Example Prompts for Blockchain Monitor Agent:**

Try these specific prompts to test the blockchain monitoring functionality:

**Transaction Monitoring:**
```
Show me the last 20 transactions for this Ethereum address:
0x388C818CA8B9251b393131C08a736A67ccB19297
```

**Alert Setup:**
```
Set an alert: "Alert me if Uniswap v3 pool 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640 has a swap over $100,000 for 2 hours"
```

**Raydium Pool Information:**
```
Show me the Raydium pool info for 3ucNos4NbumPLZNWztqGHNFFgkHeRMBQAVemeeomsUxv
```

**Raydium Pool Statistics:**
```
Show me the 24h, 7d, and 30d stats for Raydium pool 3ucNos4NbumPLZNWztqGHNFFgkHeRMBQAVemeeomsUxv
```

**Solana Chain Information:**
```
solana chain info
```

**Risk Assessment:**
```
What is the risk level of the Uniswap USDC/ETH pool?
Give me a risk assessment for the Raydium WETH/USDC pool.
```

**Docker Testing:**
After building your Docker container, test it locally before pushing to the registry:

```bash
# Build your container
docker build -t yourusername/agent-challenge:latest .

# Run it locally with environment variables
docker run -p 8080:8080 --env-file .env yourusername/agent-challenge:latest

# Test the containerized agent at http://localhost:8080
```

Ensure your agent responds correctly and all tools function properly within the containerized environment. This step is critical as the Nosana deployment will use this exact container.

### Submission Requirements

#### 1. Code Development

- Fork this repository and develop your AI agent
- Your agent must include at least one custom tool (function)
- Code must be well-documented and include clear setup instructions
- Include environment variable examples in a `.env.example` file

#### 2. Docker Container

- Create a `Dockerfile` for your agent
- Build and push your container to Docker Hub or GitHub Container Registry
- Container must be publicly accessible
- Include the container URL in your submission

##### Build, Run, Publish

Note: You'll need an account on [Dockerhub](https://hub.docker.com/)

```sh

# Build and tag
docker build -t yourusername/agent-challenge:latest .

# Run the container locally
docker run -p 8080:8080 yourusername/agent-challenge:latest

# Login
docker login

# Push
docker push yourusername/agent-challenge:latest
```

#### 3. Nosana Deployment

- Deploy your Docker container on Nosana
- Your agent must successfully run on the Nosana network
- Include the Nosana job ID or deployment link

##### Nosana Job Definition

We have included a Nosana job definition at <./nos_job_def/nosana_mastra.json>, that you can use to publish your agent to the Nosana network.

**A. Deploying using [@nosana/cli](https://github.com/nosana-ci/nosana-cli/)**

- Edit the file and add in your published docker image to the `image` property. `"image": "docker.io/yourusername/agent-challenge:latest"`
- Download and install the [@nosana/cli](https://github.com/nosana-ci/nosana-cli/)
- Load your wallet with some funds
  - Retrieve your address with: `nosana address`
  - Go to our [Discord](https://nosana.com/discord) and ask for some NOS and SOL to publish your job.
- Run: `nosana job post --file nosana_mastra.json --market nvidia-3060 --timeout 30`
- Go to the [Nosana Dashboard](https://dashboard.nosana.com/deploy) to see your job

**B. Deploying using the [Nosana Dashboard](https://dashboard.nosana.com/deploy)**

- Make sure you have https://phantom.com/, installed for your browser.
- Go to our [Discord](https://nosana.com/discord) and ask for some NOS and SOL to publish your job.
- Click the `Expand` button, on the [Nosana Dashboard](https://dashboard.nosana.com/deploy)
- Copy and Paste your edited Nosana Job Definition file into the Textarea
- Choose an appropriate GPU for the AI model that you are using
- Click `Deploy`

#### 4. Video Demo

- Record a 1-3 minute video demonstrating:
  - Your agent running on Nosana
  - Key features and functionality
  - Real-world use case demonstration
- Upload to YouTube, Loom, or similar platform

#### 5. Documentation

- Update this README with:
  - Agent description and purpose
  - Setup instructions
  - Environment variables required
  - Docker build and run commands
  - Example usage

### Submission Process

1. **Complete all requirements** listed above
2. **Commit all of your changes to the `main` branch of your forked repository**
   - All your code changes
   - Updated README
   - Link to your Docker container
   - Link to your video demo
   - Nosana deployment proof
3. **Social Media Post**: Share your submission on X (Twitter)
   - Tag @nosana_ai
   - Include a brief description of your agent
   - Add hashtag #NosanaAgentChallenge
4. **Finalize your submission on the <https://earn.superteam.fun/agent-challenge> page**

- Remember to add your forked GitHub repository link
- Remember to add a link to your X post.

### Judging Criteria

Submissions will be evaluated based on:

1. **Innovation** (25%)

   - Originality of the agent concept
   - Creative use of AI capabilities

2. **Technical Implementation** (25%)

   - Code quality and organization
   - Proper use of the Mastra framework
   - Efficient tool implementation

3. **Nosana Integration** (25%)

   - Successful deployment on Nosana
   - Resource efficiency
   - Stability and performance

4. **Real-World Impact** (25%)
   - Practical use cases
   - Potential for adoption
   - Value proposition

### Prizes

We're awarding the **top 10 submissions**:

- 🥇 1st: $1,000 USDC
- 🥈 2nd: $750 USDC
- 🥉 3rd: $450 USDC
- 🏅 4th: $200 USDC
- 🔟 5th–10th: $100 USDC

All prizes are paid out directly to participants on [SuperTeam](https://superteam.fun)

### Resources

- [Nosana Documentation](https://docs.nosana.io)
- [Mastra Documentation](https://mastra.ai/docs)
- [Mastra Guide: Build an AI stock agent](https://mastra.ai/en/guides/guide/stock-agent)
- [Nosana CLI](https://github.com/nosana-ci/nosana-cli)
- [Docker Documentation](https://docs.docker.com)

### Support

- Join [Nosana Discord](https://nosana.com/discord) for technical support where we have dedicated [Builders Challenge Dev chat](https://discord.com/channels/236263424676331521/1354391113028337664) channel.
- Follow [@nosana_ai](https://x.com/nosana_ai) for updates.

### Important Notes

- Ensure your agent doesn't expose sensitive data
- Test thoroughly before submission
- Keep your Docker images lightweight
- Document all dependencies clearly
- Make your code reproducible
- You can vibe code it if you want 😉
- **Only one submission per participant**
- **Submissions that do not compile, and do not meet the specified requirements, will not be considered**
- **Deadline is: 9 July 2025, 12.01 PM**
- **Announcement will be announced about one week later, stay tuned for our socials for exact date**
- **Finalize your submission at [SuperTeam](https://earn.superteam.fun/agent-challenge)**

### Don't Miss Nosana Builder Challenge Updates

Good luck, builders! We can't wait to see the innovative AI agents you create for the Nosana ecosystem.
**Happy Building!**

## New Features

### DeFi Risk Scoring Tool
Assigns a risk score (Low/Medium/High) to Uniswap and Raydium pools based on:
- Volume
- Volatility
- Impermanent loss
- Smart contract audit status

**How to use:**
- Ask: "What is the risk level of the Uniswap USDC/ETH pool?"
- Ask: "Give me a risk assessment for the Raydium WETH/USDC pool."
- Ask: "Rate the risk for Raydium pool [address]."
- Ask: "Assess the risk for Uniswap pool [address]."

The agent will automatically route these queries to the risk scoring tool and return a risk score and explanation.

### Generalized Arbitrage Tool
- Supports arbitrage checks for **any token pair** between Uniswap and Raydium.
- Dynamically resolves token symbols and finds the most liquid pools.
- Example: "Check for arbitrage between USDC and WETH."

### Natural Language Routing
- The agent is now able to route natural language queries to the correct tool (e.g., risk scoring, arbitrage, protocol summaries) using few-shot prompt examples.
- No need to use tool names directly—just ask in plain English.

## Docker Usage

### Build and Run with Docker
```sh
docker build -t yourusername/agent-challenge:latest .
docker run -p 8080:8080 --env-file .env yourusername/agent-challenge:latest
```

### Using Docker Compose or Custom Env Files
You can use Docker Compose or pass environment variables at runtime:
- With Docker Compose, specify `env_file: .env` in your service definition.
- Or, when running manually, use `--env-file .env` as shown above.

## Environment Variables
- See `.env.example` for required variables and example values.

## Features & Prompt Examples

### 1. Blockchain Monitoring Tool
Monitors on-chain activity, transactions, and token transfers for supported chains.

**Prompt Examples:**
- Monitor transactions for address 0x123... on Ethereum.
- Show recent token transfers for Solana address 9xQeWvG816bUx9EP.
- Track balance changes for my wallet on Solana.
- Show me the last 20 transactions for this Ethereum address: 0x388C818CA8B9251b393131C08a736A67ccB19297

### 2. Generalized Arbitrage Tool
Checks for arbitrage opportunities between Uniswap and Raydium for any token pair, dynamically resolving the best pools.

**Prompt Examples:**
- Check for arbitrage between USDC and WETH.
- Is there an arbitrage opportunity for SOL and USDT?
- Compare prices for ETH/USDC on Uniswap and Raydium.

### 3. DeFi Protocol Summary Tool
Summarizes activity and statistics for DeFi protocols and pools on Uniswap and Raydium.

**Prompt Examples:**
- Summarize the Uniswap USDC/ETH pool.
- Give me a summary of the Raydium WETH/USDC pool.
- What's the latest activity on Uniswap for USDT/DAI?

### 4. DeFi Risk Scoring Tool
Assigns a risk score (Low/Medium/High) to Uniswap and Raydium pools based on volume, volatility, impermanent loss, and audit status.

**Prompt Examples:**
- What is the risk level of the Uniswap USDC/ETH pool?
- Give me a risk assessment for the Raydium WETH/USDC pool.
- Rate the risk for Raydium pool DrdecJVzkaRsf1TQu1g7iFncaokikVTHqpzPjenjRySY.
- Assess the risk for Uniswap pool 0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8.

### 5. Alert Tools
Set up, list, and check custom blockchain alerts for addresses or events.

**Prompt Examples:**
- Set an alert for large transactions on Uniswap.
- List all my active alerts.
- Check if any alerts have been triggered for my wallet.
- Set an alert: "Alert me if Uniswap v3 pool 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640 has a swap over $100,000 for 2 hours"

### 6. Natural Language Routing
You can use plain English for all queries. The agent will automatically route your request to the correct tool.

**Prompt Examples:**
- How risky is the Raydium pool DrdecJVzkaRsf1TQu1g7iFncaokikVTHqpzPjenjRySY?
- Is there a price difference between Uniswap and Raydium for USDC/ETH?
- Give me a summary of the Uniswap USDT/DAI pool.

### 7. Raydium Pool Info & Stats
Get detailed information and statistics for Raydium pools.

**Prompt Examples:**
- Show me the Raydium pool info for 3ucNos4NbumPLZNWztqGHNFFgkHeRMBQAVemeeomsUxv
- Show me the 24h, 7d, and 30d stats for Raydium pool 3ucNos4NbumPLZNWztqGHNFFgkHeRMBQAVemeeomsUxv
