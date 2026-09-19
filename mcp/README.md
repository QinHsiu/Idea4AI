# Idea4AI MCP

Stdio MCP server that wraps the Idea4AI HTTP API (`/api/validate`, `/api/ideas`, `/api/health`).

## Tools

| Tool | Purpose |
|---|---|
| `validate_idea` | Create + validate; returns report |
| `get_report` | Fetch report by `idea_id` |
| `quick_check` | Health / backend / LLM mode |
| `list_ideas` | Recent ideas |

## Run

```bash
# Terminal 1 — Next app
cd .. && npm run dev

# Terminal 2 — MCP
cd mcp && npm install && npm start
```

Env: `IDEA4AI_API_BASE` (default `http://localhost:3000`).

## Cursor MCP config example

```json
{
  "mcpServers": {
    "idea4ai": {
      "command": "npx",
      "args": ["tsx", "D:/PycharmProjects/pythonProject/projects/Idea4ai/Idea4AI/mcp/src/index.ts"],
      "env": {
        "IDEA4AI_API_BASE": "http://localhost:3000"
      }
    }
  }
}
```
