import dotenv from "dotenv";

dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";

import { StdioServerTransport }
from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

import { Octokit } from "@octokit/rest";



// GITHUB CLIENT
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});



// MCP SERVER
const server = new Server(
  {
    name: "github-mcp",
    version: "1.0.0"
  },

  {
    capabilities: {
      tools: {}
    }
  }
);



// LIST TOOLS
server.setRequestHandler(
  ListToolsRequestSchema,

  async () => {

    return {
      tools: [
        {
          name: "get_repo",

          description:
            "Get GitHub repository information",

          inputSchema: {
            type: "object",

            properties: {
              owner: {
                type: "string",
                description:
                  "GitHub username/org"
              },

              repo: {
                type: "string",
                description:
                  "Repository name"
              }
            },

            required: ["owner", "repo"]
          }
        }
      ]
    };
  }
);



// HANDLE TOOL CALLS
server.setRequestHandler(
  CallToolRequestSchema,

  async (request) => {

    const toolName =
      request.params.name;

    const args =
      request.params.arguments;

    // TOOL: get_repo
    if (toolName === "get_repo") {

      const owner =
        String(args?.owner);

      const repo =
        String(args?.repo);

      try {

        // FETCH FROM GITHUB
        const response =
          await octokit.repos.get({
            owner,
            repo
          });

        const data =
          response.data;

        return {
          content: [
            {
              type: "text",

              text: JSON.stringify(
                {
                  full_name:
                    data.full_name,

                  description:
                    data.description,

                  stars:
                    data.stargazers_count,

                  forks:
                    data.forks_count,

                  open_issues:
                    data.open_issues_count,

                  url:
                    data.html_url
                },

                null,
                2
              )
            }
          ]
        };

      } catch (error) {

        return {
          content: [
            {
              type: "text",

              text:
                "Failed to fetch repository"
            }
          ]
        };
      }
    }

    throw new Error("Unknown tool");
  }
);



// START SERVER
async function main() {

  const transport =
    new StdioServerTransport();

  await server.connect(
    transport
  );

  console.log(
    "GitHub MCP Server Running..."
  );
}

main();
