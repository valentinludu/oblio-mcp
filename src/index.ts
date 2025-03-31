import { createOblioMcpServer } from "./mcpServer.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Main function to start the server
const startServer = async () => {
  // Check environment variables
  if (!process.env.OBLIO_API_EMAIL || !process.env.OBLIO_API_SECRET) {
    console.error(
      "Error: OBLIO_API_EMAIL and OBLIO_API_SECRET environment variables must be set"
    );
    process.exit(1);
  }

  try {
    // Create the MCP server
    const server = createOblioMcpServer();

    // Create a stdio transport for command line usage
    const transport = new StdioServerTransport();

    await server.connect(transport);
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

startServer().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
