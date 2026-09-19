#!/usr/bin/env node
/**
 * Idea4AI MCP server — wraps the HTTP Validation API for Cursor / Claude.
 *
 * Env:
 *   IDEA4AI_API_BASE  default http://localhost:3000
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BASE = (process.env.IDEA4AI_API_BASE ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

async function api(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const server = new Server(
  { name: "idea4ai", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "validate_idea",
      description:
        "Create an idea and run the full Idea4AI validation pipeline. Returns idea_id, run_id, verdict, and report.",
      inputSchema: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "One-sentence vibe-coding product idea",
          },
          fixture: {
            type: "string",
            enum: ["kill", "test", "build"],
            description: "Optional MOCK_LLM fixture override",
          },
        },
        required: ["text"],
      },
    },
    {
      name: "get_report",
      description: "Fetch the latest ValidationReport for an idea_id",
      inputSchema: {
        type: "object",
        properties: {
          idea_id: { type: "string" },
        },
        required: ["idea_id"],
      },
    },
    {
      name: "quick_check",
      description:
        "Lightweight health + backend probe (memory vs supabase, llm mode)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_ideas",
      description: "List recent validated ideas with verdict/composite",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = (request.params.arguments ?? {}) as Record<string, unknown>;

  try {
    if (name === "validate_idea") {
      const text = String(args.text ?? "").trim();
      if (!text) throw new Error("text is required");
      const body: Record<string, string> = { text };
      if (typeof args.fixture === "string") body.fixture = args.fixture;
      const { status, json } = await api("/api/validate", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ http_status: status, ...((json as object) ?? {}) }, null, 2),
          },
        ],
        isError: status >= 400,
      };
    }

    if (name === "get_report") {
      const ideaId = String(args.idea_id ?? "").trim();
      if (!ideaId) throw new Error("idea_id is required");
      const { status, json } = await api(`/api/ideas/${encodeURIComponent(ideaId)}/report`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ http_status: status, report: json }, null, 2),
          },
        ],
        isError: status >= 400,
      };
    }

    if (name === "quick_check") {
      const { status, json } = await api("/api/health");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ http_status: status, ...(json as object) }, null, 2),
          },
        ],
        isError: status >= 400,
      };
    }

    if (name === "list_ideas") {
      const { status, json } = await api("/api/ideas");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ http_status: status, ...(json as object) }, null, 2),
          },
        ],
        isError: status >= 400,
      };
    }

    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: err instanceof Error ? err.message : String(err),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
