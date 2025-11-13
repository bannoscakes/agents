# Docker Agents

Run any agent as a containerized service. This approach allows you to:
- Deploy agents independently
- Scale agents horizontally
- Use agents from any programming language
- Ensure consistent environments

## Directory Structure

```
docker/
├── python-agent/       # Python agent container
├── javascript-agent/   # JavaScript agent container
└── multi-agent/        # Multiple agents in one container
```

## Quick Start

### 1. Build an agent image

```bash
cd docker/python-agent
docker build -t my-python-agent .
```

### 2. Run the agent

```bash
docker run -p 8080:8080 my-python-agent
```

### 3. Use the agent

```bash
# HTTP API
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, agent!"}'
```

## Creating Custom Docker Agents

1. Copy one of the example directories
2. Modify the agent code
3. Update the Dockerfile if needed
4. Build and run

## Environment Variables

Configure agents using environment variables:

```bash
docker run -e API_KEY=your-key -e LOG_LEVEL=debug my-agent
```

## Docker Compose

Run multiple agents together:

```bash
docker-compose up
```

See `docker-compose.yml` examples in each directory.
