# Oblio MCP Server

MCP Server for the Oblio API, enabling Claude and other MCP compatible platforms to interact with Oblio.eu accounting software.

## Technologies

- TypeScript
- Node.js
- Model Context Protocol (MCP) SDK
- Oblio SDK
- Docker (optional)

## Prerequisites

- Node.js >= 18.0.0
- Docker (optional, for containerized deployment)
- An active Oblio.eu configured account with API access and a valid CIF

## Tools

1. `create_document`

   - Create a new document (invoice, proforma, notice)
   - Required inputs:
     - `type` (string): Type of document ("invoice", "proforma", "notice")
     - `data` (object): Document data including client, products, etc.
   - Returns: Created document details

2. `get_document`

   - Retrieve a specific document
   - Required inputs:
     - `type` (string): Type of document ("invoice", "proforma", "notice")
     - `seriesName` (string): Document series name
     - `number` (string): Document number
   - Returns: Document details

3. `delete_document`

   - Delete a specific document
   - Required inputs:
     - `type` (string): Type of document ("invoice", "proforma", "notice")
     - `seriesName` (string): Document series name
     - `number` (number): Document number
   - Returns: Deletion confirmation

4. `cancel_restore_document`

   - Cancel or restore a document
   - Required inputs:
     - `type` (string): Type of document ("invoice", "proforma", "notice")
     - `seriesName` (string): Document series name
     - `number` (number): Document number
     - `cancel` (boolean): true to cancel, false to restore
   - Returns: Operation confirmation

5. `get_nomenclatures`

   - Get various nomenclatures (products, clients, VAT rates, etc.)
   - Required inputs:
     - `type` (string): Type of nomenclature ("product", "clients", "vat_rates", etc.)
   - Optional inputs:
     - `name` (string): Filter by name
     - `filters` (object): Additional filters
   - Returns: List of nomenclature items

6. `collect_payment`

   - Collect payment for an invoice
   - Required inputs:
     - `seriesName` (string): Invoice series name
     - `number` (number): Invoice number
     - `collect` (map): Payment collection details
   - Returns: Payment collection confirmation

7. `list_documents`

   - List documents with filters
   - Required inputs:
     - `type` (string): Type of document
     - `filters` (map): Filter criteria
   - Returns: List of matching documents

8. `create_einvoice`

   - Send invoice to SPV for e-invoice creation
   - Required inputs:
     - `seriesName` (string): Invoice series name
     - `number` (number): Invoice number
   - Returns: E-invoice creation confirmation

9. `get_einvoice_archive`

   - Get e-invoice archive from SPV
   - Required inputs:
     - `seriesName` (string): Invoice series name
     - `number` (number): Invoice number
   - Returns: E-invoice archive details

10. `set_cif`

    - Set company CIF for API requests
    - Required inputs:
      - `cif` (string): Company CIF
    - Returns: Confirmation message

11. `get_cif`
    - Get current company CIF
    - Returns: Current CIF value

## Setup

1. Create an Oblio Account:

   - Visit the Oblio website
   - Create an account if you don't have one
   - Log in to your account

2. Get API Credentials:

   - Navigate to your account settings
   - Generate API credentials
   - Save your API email and secret

### Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`:

#### tsx

```json
{
  "mcpServers": {
    "oblio-mcp": {
      "command": "tsx",
      "args": ["/Users/{your_user}/.../oblio-mcp/src/index.ts"],
      "env": {
        "OBLIO_API_EMAIL": "your-email@example.com",
        "OBLIO_API_SECRET": "your-api-secret",
        "CIF": "your-cif"
      }
    }
  }
}
```

#### docker

```json
{
  "mcpServers": {
    "oblio": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "OBLIO_API_EMAIL",
        "-e",
        "OBLIO_API_SECRET",
        "-e",
        "CIF"
        "oblio-mcp"
      ],
      "env": {
        "OBLIO_API_EMAIL": "your-email@example.com",
        "OBLIO_API_SECRET": "your-api-secret",
        "CIF": "your-cif"
      }
    }
  }
}
```

## Build

Docker build

```bash
docker build -t oblio-mcp Dockerfile .
```

### Troubleshooting

If you encounter issues, verify that:

1. Your Oblio account is active and has API access
2. API credentials are correctly set in your config
3. You have the necessary permissions for the operations you're trying to perform
4. Your company CIF is correctly set

## License

ISC
