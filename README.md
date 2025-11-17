# Reusable Agents Library

A collection of reusable agents that can be integrated into any project. This repository provides agents in multiple languages and formats for maximum flexibility.

## 🎯 Repository Structure

```
agents/
├── python/          # Python-based agents
├── javascript/      # JavaScript/Node.js agents
├── typescript/      # TypeScript/Supabase agents
├── docker/          # Dockerized agents (language-agnostic)
├── examples/        # Integration examples
└── docs/           # Documentation
```

## 🚀 Quick Start

### Method 1: Git Submodule (Recommended)
```bash
# Add this repo as a submodule in your project
git submodule add https://github.com/yourusername/agents.git lib/agents

# Use agents in your code
# Python: from lib.agents.python.chat_agent import ChatAgent
# JavaScript: import ChatAgent from './lib/agents/javascript/chat-agent'
```

### Method 2: Direct Copy
```bash
# Copy specific agents you need
cp -r agents/python/chat_agent your_project/agents/
```

### Method 3: Package Installation
```bash
# Python agents (coming soon)
pip install your-agents-package

# JavaScript agents (coming soon)
npm install your-agents-package
```

### Method 4: Docker
```bash
# Run agents as services
docker run -p 8080:8080 your-agents:chat-agent
```

## 📦 Available Agents

### Python Agents

#### Core Agents
- **Chat Agent** - LLM-powered conversational agent
- **Data Processor** - Data transformation and analysis
- **Task Scheduler** - Automated task execution
- **Cake Production Reporter** - Production reporting for bakeries

#### E-commerce Agents
- **Shopify Chatbot Agent** - AI customer support for Shopify stores
  - Product inquiries and recommendations
  - Order tracking and status updates
  - Shipping and returns information
  - Smart escalation to human support
  - Shopify API integration
  - Embeddable web widget included
  - Cost: ~$0.015 per conversation

#### Business Automation Agents
- **Email Automation Agent** - Intelligent email handling
  - Auto-classify emails (order, complaint, question, spam)
  - Sentiment analysis
  - Priority detection
  - Auto-draft responses
  - Extract order numbers, dates, amounts
  - Smart escalation rules
  - Multi-language support

- **Social Media Content Generator** - Create engaging social posts
  - Instagram, Facebook, Twitter/X, LinkedIn support
  - Auto-generate captions and hashtags
  - Platform-specific formatting
  - Best posting time suggestions
  - Brand voice customization
  - Multi-platform campaigns

- **FAQ Generator Agent** - Auto-generate FAQs from documentation
  - Extract common questions from content
  - Generate clear answers
  - Update FAQs from customer inquiries
  - JSON output format

- **Marketing Copy Generator** - Professional marketing content
  - Product descriptions
  - Email campaigns
  - Ad copy (Google, Facebook, etc.)
  - Landing page copy
  - SEO-optimized content
  - Multiple tone options

#### Bakery-Specific Agents
- **Recipe Management Agent** - Intelligent recipe management
  - Scale recipes to any serving size
  - Ingredient substitution suggestions
  - Allergen detection and warnings
  - Nutrition calculation
  - Waste reduction optimization
  - Recipe search and organization

#### Development & Analytics Agents
- **Code Review Agent** - Automated code review
  - Security vulnerability detection
  - Performance analysis
  - Best practices enforcement
  - Style guide compliance
  - Bug detection
  - Supports multiple languages

- **Sales Forecasting Agent** - Predict sales trends
  - Historical data analysis
  - Trend detection
  - Seasonality patterns
  - 30-day forecasts
  - Anomaly detection
  - Confidence scoring

- **Customer Segmentation Agent** - Segment customers intelligently
  - RFM analysis (Recency, Frequency, Monetary)
  - Behavioral segmentation
  - Marketing recommendations per segment
  - Churn prediction
  - Lifetime value estimation

#### Voice Agents
- **Voice Transcription Agent** - Speech-to-text conversion
  - OpenAI Whisper, Google Speech-to-Text, AssemblyAI support
  - Speaker diarization (who said what)
  - Timestamp support
  - Multi-language support (50+ languages)
  - Cost: ~$0.006/minute

- **Voice Synthesis Agent** - Text-to-speech conversion
  - OpenAI TTS, ElevenLabs, Google TTS, AWS Polly support
  - Multiple voice options (6+ voices per provider)
  - Adjustable speech speed (0.25x to 4x)
  - Multi-language support
  - Cost: ~$0.015/1K characters

- **Voice Chat Agent** - Full voice-based conversational AI
  - Complete voice conversation pipeline (listen → think → speak)
  - Combines STT + LLM + TTS
  - Conversation history management
  - Mix and match providers
  - Text input with voice output option
  - Cost: ~$0.014 per conversation turn

### JavaScript Agents

#### Core Agents
- **Chat Agent** - LLM-powered conversational agent
- **API Agent** - RESTful API interaction handler

#### E-commerce Agents
- **Shopify Chatbot Agent** - AI customer support with Node.js backend
  - Express.js server example included
  - Real-time order and product lookups
  - Embeddable widget for Shopify themes

#### Voice Agents
- **Voice Transcription Agent** - Speech-to-text with OpenAI Whisper
- **Voice Synthesis Agent** - Text-to-speech with multiple providers

### TypeScript/Supabase Agents

#### E-commerce Agents
- **Shopify Chatbot Agent** - Serverless Shopify support with Supabase
  - Deploy as Supabase Edge Function
  - TypeScript with full type safety
  - Shopify Admin API integration
  - Conversation history in Supabase
  - Perfect for scalable deployments

#### Voice Agents
- **Voice Chat Agent** - Full voice conversational AI for Supabase Edge Functions
  - TypeScript implementation with full type safety
  - Supabase Edge Function ready
  - Voice input/output for web applications
  - Real-time voice conversations
  - Combines OpenAI Whisper + Anthropic Claude + OpenAI TTS

#### Production & Operations
- **Cake Production Reporter** - Bi-weekly production reports with Supabase integration
  - Works with PostgreSQL database
  - Runs as Supabase Edge Function
  - React frontend components included
  - Scheduled reporting twice a week
  - BOM/Inventory integration for ingredient requirements

#### Quality Control
- **Cake Quality Control Agent** - AI vision-powered quality control system
  - Claude Vision / OpenAI GPT-4 Vision
  - OCR for reading text on cakes
  - Spelling verification
  - Quality scoring (0-10)
  - Auto-approval workflow
  - Issue detection and flagging
  - Cost: ~$0.01 per cake

#### Webhook Processing
- **Webhook Order Processor** - Intelligent webhook-to-order conversion
  - **THREE methods:** Deterministic (FREE), Hybrid (smart), AI-powered
  - Liquid template-based extraction (production-ready)
  - Multi-cake order splitting (#B21345-A, #B21345-B)
  - Accessory handling (stays with first cake)
  - Supabase Edge Function deployment
  - React monitoring dashboard
  - Cost: FREE to ~$0.0001 per order

### Docker Agents
- **Multi-language Support** - Run any agent as a service
- **Easy Deployment** - Deploy anywhere with Docker
- **Scalable** - Scale agents independently

## 🎯 Multi-Agent Teams Framework

**NEW:** Hierarchical agent teams with leader coordination for complex workflows!

Instead of single agents working independently, create teams where a **leader agent** coordinates multiple **specialist agents** to accomplish complex goals.

### Built-in Teams

#### 1. **Shopify Store Team** (`python/teams/shopify_store_team/`)
Complete e-commerce automation:
- **Leader** coordinates: Customer Support, Email Marketing, Social Media, Sales Forecasting, Customer Segmentation
- **Use cases:** "Run marketing campaign", "Daily operations", "Weekly analytics"
- **Cost:** ~$0.10-$0.20 per workflow

```python
from teams.team_factory import create_team

leader = create_team('teams/configs/shopify_team.yaml')
result = leader.execute_goal("marketing_campaign", context={
    'product': 'New Product',
    'platforms': ['instagram', 'facebook']
})
```

#### 2. **Repository Management Team** (`python/teams/repository_team/`)
Automated software development workflows:
- **Leader** coordinates: Code Review, Documentation, Testing, Security Auditing
- **Use cases:** "Review PR", "Pre-release checklist", "Security audit"
- **Cost:** ~$0.02-$0.20 per workflow

```python
leader = create_team('teams/configs/repository_team.yaml')
result = leader.execute_goal("review_pr", context={
    'pr_number': 123,
    'code': code_changes,
    'language': 'python'
})
```

#### 3. **Bakery Operations Team** (`python/teams/bakery_team/`)
Complete bakery management:
- **Leader** coordinates: Recipe Management, Production Planning, Quality Control, Customer Service, Forecasting
- **Use cases:** "Plan production", "Custom cake order", "Check allergens"
- **Cost:** ~$0.05-$0.30 per workflow

```python
leader = create_team('teams/configs/bakery_team.yaml')
result = leader.execute_goal("plan_production", context={
    'sales_data': historical_sales,
    'recipes': recipes_to_scale
})
```

### Team Framework Features

- ✅ **Hierarchical Delegation** - Leader plans, delegates, and aggregates
- ✅ **Load Balancing** - Automatically distributes tasks
- ✅ **Task Management** - Track pending, in-progress, completed, failed tasks
- ✅ **Team Metrics** - Monitor success rates and performance
- ✅ **YAML Configuration** - Build teams from config files
- ✅ **Strategic Recommendations** - AI-powered team optimization

### Quick Start with Teams

```python
# Method 1: Use configuration file
from teams.team_factory import create_team
leader = create_team('teams/configs/shopify_team.yaml')

# Method 2: Programmatic setup
from teams.shopify_store_team import ShopifyStoreLeader
leader = ShopifyStoreLeader(config={'store_name': 'My Store'})
leader.register_agent('ChatBot', chatbot_instance, ['customer_support'])

# Execute goals
result = leader.execute_goal("marketing_campaign", context={...})

# Monitor team
status = leader.get_team_status()
recommendations = leader.get_recommendations()
```

See `python/teams/README.md` for complete documentation on creating custom teams.

## 💡 Usage Examples

See the [examples/](examples/) directory for complete integration examples:
- [Python Project Integration](examples/python-integration/)
- [JavaScript Project Integration](examples/javascript-integration/)
- [Docker Deployment](examples/docker-deployment/)
- [Multi-Agent System](examples/multi-agent/)

## 🛠️ Creating Custom Agents

Each agent directory contains a `TEMPLATE.md` file showing how to create new agents following the same patterns.

## 📚 Documentation

- [Agent Architecture](docs/architecture.md)
- [Configuration Guide](docs/configuration.md)
- [Best Practices](docs/best-practices.md)
- [API Reference](docs/api-reference.md)

## 🤝 Contributing

Feel free to add new agents or improve existing ones! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - feel free to use in any project!
