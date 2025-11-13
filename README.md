# Reusable Agents Library

A collection of reusable agents that can be integrated into any project. This repository provides agents in multiple languages and formats for maximum flexibility.

## 🎯 Repository Structure

```
agents/
├── python/          # Python-based agents
├── javascript/      # JavaScript/TypeScript agents
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
- **Chat Agent** - LLM-powered conversational agent
- **Data Processor** - Data transformation and analysis
- **Task Scheduler** - Automated task execution
- **Web Scraper** - Intelligent web scraping

### JavaScript Agents
- **Chat Agent** - LLM-powered conversational agent
- **API Agent** - RESTful API interaction handler
- **Event Processor** - Event-driven automation
- **File Watcher** - File system monitoring

### Docker Agents
- **Multi-language Support** - Run any agent as a service
- **Easy Deployment** - Deploy anywhere with Docker
- **Scalable** - Scale agents independently

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
