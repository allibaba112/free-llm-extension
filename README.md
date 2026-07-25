# Free LLM Router - VS Code Extension

Intelligent VS Code extension that automatically routes code completion requests to available free LLM APIs, managing rate limits and provider selection.

## Features

✨ **Automatic Provider Routing** - Intelligently routes to the fastest available free LLM  
🔄 **Rate Limit Management** - Tracks and respects provider rate limits  
📊 **Provider Status** - Real-time view of which providers are available  
⚙️ **Simple Configuration** - Easy setup with command palette  
🚀 **Inline Completions** - Get suggestions as you type

## Supported Providers

- **Groq** (Fastest inference)
- **OpenRouter** (Model variety)
- **Cohere** (Coming soon)
- **Cloudflare** (Coming soon)
- **Mistral** (Coming soon)

## Quick Start

1. Install the extension from VS Code Marketplace
2. Run: `Free LLM: Configure Providers`
3. Add at least one API key:
   - [Groq](https://console.groq.com) - Free, very fast
   - [OpenRouter](https://openrouter.ai) - Multiple models
   - [Cohere](https://cohere.com) - Free tier available

## Usage

### Get a completion:
```
Cmd+Shift+P > Free LLM: Get Completion
```

### View provider status:
```
Cmd+Shift+P > Free LLM: Show Provider Status
```

### Configure providers:
```
Cmd+Shift+P > Free LLM: Configure Providers
```

## Settings

Configure in VS Code settings or via command palette:

```json
{
  "freeLlmRouter.groqApiKey": "",
  "freeLlmRouter.openrouterApiKey": "",
  "freeLlmRouter.enabledProviders": ["groq", "openrouter"],
  "freeLlmRouter.maxTokens": 256
}
```

## How It Works

1. **Initialization** - Loads configured API keys on startup
2. **Request** - User triggers completion via command or inline
3. **Provider Selection** - Picks best provider based on:
   - Rate limit availability
   - Provider speed (round-robin)
   - Configuration preferences
4. **Completion** - Fetches from provider and inserts result
5. **Tracking** - Updates rate limit counters

## Architecture

```
src/
├── extension.ts           # VS Code entry point
├── providers/
│   ├── baseProvider.ts    # Abstract provider class
│   ├── groqProvider.ts    # Groq implementation
│   ├── openrouterProvider.ts  # OpenRouter implementation
│   └── providerManager.ts # Orchestrates providers
├── utils/
│   ├── config.ts          # Settings management
│   ├── rateLimiter.ts     # Rate limit tracking
│   └── cache.ts           # Response caching (optional)
└── views/
    └── statusBar.ts       # Status bar UI
```

## Development

### Setup
```bash
git clone https://github.com/allibaba112/free-llm-extension
cd free-llm-extension
npm install
```

### Compile
```bash
npm run compile
```

### Run
```bash
# Open in VS Code and press F5 to debug
```

## Adding a New Provider

1. Create `src/providers/yourproviderProvider.ts`:
```typescript
import { BaseProvider, CompletionRequest, CompletionResponse } from './baseProvider';

export class YourProviderProvider extends BaseProvider {
  constructor() { super('YourProvider'); }
  
  async getCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    // Implement API call
  }
  
  getStatus() { /* Return status */ }
}
```

2. Register in `providerManager.ts`
3. Add config schema in `package.json`

## License

MIT

## Contributing

Contributions welcome! Please open issues and PRs.

## Data Source

Provider list maintained by [free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources)
