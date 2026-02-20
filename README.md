# Oblio.eu accounting MCP Server (Unofficial)

MCP Server for the [Oblio API](https://www.oblio.eu/api), enabling Claude and other MCP-compatible platforms to interact with [Oblio.eu](https://www.oblio.eu) accounting software.

Create invoices, manage documents, collect payments, query nomenclatures, and submit e-Factura to Romania's SPV system -- all through natural language.

## Prerequisites

- Node.js >= 22.0.0
- Docker (optional)
- An active [Oblio.eu](https://www.oblio.eu) account with API access

## Setup

1. **Get your Oblio API credentials:**
   - Log in at [oblio.eu](https://www.oblio.eu)
   - Go to **Setari > Date Cont**
   - Copy your **email** and **API secret**
   - Note your **company CIF** (e.g. `RO37311090`)

2. **Add to your Claude Desktop config or other AI tool** (`claude_desktop_config.json`):

### Using npx (coming soon)

Once the package is published to npm, no installation will be required:

```json
{
  "mcpServers": {
    "oblio": {
      "command": "npx",
      "args": ["-y", "oblio-mcp"],
      "env": {
        "OBLIO_API_EMAIL": "your-email@example.com",
        "OBLIO_API_SECRET": "your-api-secret",
        "CIF": "your-company-cif"
      }
    }
  }
}
```

### Using a local clone (recommended)

```bash
git clone https://github.com/valentinludu/oblio-mcp.git
cd oblio-mcp
npm install
```

Then add to your config:

```json
{
  "mcpServers": {
    "oblio": {
      "command": "node",
      "args": ["/path/to/oblio-mcp/dist/index.js"],
      "env": {
        "OBLIO_API_EMAIL": "your-email@example.com",
        "OBLIO_API_SECRET": "your-api-secret",
        "CIF": "your-company-cif"
      }
    }
  }
}
```

### Using Docker

```bash
docker build -t oblio-mcp .
```

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
        "CIF",
        "oblio-mcp"
      ],
      "env": {
        "OBLIO_API_EMAIL": "your-email@example.com",
        "OBLIO_API_SECRET": "your-api-secret",
        "CIF": "your-company-cif"
      }
    }
  }
}
```

## Environment Variables

| Variable           | Required | Description                                                            |
| ------------------ | -------- | ---------------------------------------------------------------------- |
| `OBLIO_API_EMAIL`  | Yes      | Your Oblio account email                                               |
| `OBLIO_API_SECRET` | Yes      | API secret from Oblio > Setari > Date Cont                             |
| `CIF`              | No       | Default company CIF. Can also be set at runtime via the `set_cif` tool |

## Tools

### Document Management

| Tool               | Description                                                                                                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create_document`  | Creates an invoice (factura), proforma, or delivery notice (aviz). Requires client details, at least one product, a series name, and issue date. Returns the created document's series, number, and link. |
| `get_document`     | Retrieves a single document by type, series name, and number. Returns document details, link, and payment history.                                                                                        |
| `list_documents`   | Lists and filters documents with pagination. Supports filtering by series, date range, client, draft/cancelled/collected status. Returns up to 100 results per page.                                      |
| `delete_document`  | Permanently deletes a document. Only the last document in a series can be deleted. Optionally removes the associated payment.                                                                             |
| `cancel_document`  | Cancels (annuls) a document, marking it as void. The document remains in the system.                                                                                                                      |
| `restore_document` | Restores a previously cancelled document, making it active again.                                                                                                                                         |

### Payments

| Tool              | Description                                                                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `collect_payment` | Records a payment against an existing invoice. Supports payment types: Chitanta, Bon fiscal, Ordin de plata, Card, CEC, and others. Defaults to the full invoice amount if value is omitted. |

### Nomenclatures (Reference Data)

| Tool                | Description                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_nomenclatures` | Fetches reference data from Oblio. Types: `companies`, `clients`, `products`, `vat_rates`, `series`, `languages`, `management`. Results are paginated (max 250 per page). |

### e-Factura (SPV)

| Tool                   | Description                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `create_einvoice`      | Submits an existing invoice to Romania's SPV system for e-Factura. Returns status code: 0=processing, 1=success, 2=errors, -1=not sent. |
| `get_einvoice_archive` | Downloads the e-Invoice archive (XML) from SPV for a previously submitted invoice.                                                      |

### Configuration

| Tool      | Description                                                         |
| --------- | ------------------------------------------------------------------- |
| `set_cif` | Sets the company CIF (tax ID) used for all subsequent API requests. |
| `get_cif` | Returns the currently configured company CIF.                       |

## Prompts

The server includes 28 prompt templates for common operations: creating documents, retrieving documents, cancelling/restoring/deleting documents, searching nomenclatures, collecting payments, listing invoices, and managing e-Factura submissions.

## Troubleshooting

If you encounter issues:

1. Verify your Oblio account is active and has API access
2. Check that `OBLIO_API_EMAIL` and `OBLIO_API_SECRET` are correctly set
3. Ensure your company CIF is set (via `CIF` env var or the `set_cif` tool)
4. Confirm you have the necessary permissions for the operations you're performing

## License

ISC
