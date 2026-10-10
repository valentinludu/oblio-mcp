# Oblio.eu accounting MCP Server

MCP Server for the [Oblio API](https://www.oblio.eu/api), enabling Claude and other MCP-compatible platforms to interact with [Oblio.eu](https://www.oblio.eu) accounting software.

Create invoices, manage documents, collect payments, query nomenclatures, and submit e-Factura to Romania's SPV system -- all through natural language.

## Prerequisites

- Node.js >= 24 and npm >= 11.14. Node.js 24.18 and later already include a new enough npm (24.18 bundles npm 11.16). Node.js 24.17 and earlier bundle npm 11.13, which is too old.
- An active [Oblio.eu](https://www.oblio.eu) account with API access

## Setup

### 1. Get your Oblio API credentials

- Log in at [oblio.eu](https://www.oblio.eu)
- Email and API secret: **Setari > Date Cont** ([account settings](https://www.oblio.eu/account/settings))
- Company CIF: **Setari > Date firma** (e.g. `RO37311090`)

Oblio regenerates the API secret whenever the account password is reset.

### 2. Add the server to your MCP client

Add the server to your MCP client config, such as Claude Desktop's `claude_desktop_config.json` or Cursor's `mcp.json`. The server speaks stdio only.

### Local clone

```bash
git clone https://github.com/valentinludu/oblio-mcp.git
cd oblio-mcp
npm install
npm run build
```

`npm install` does not build the project. `dist/index.js` is produced by `npm run build`.

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

### Docker

```bash
docker build -t oblio-mcp .
```

Pass the same variables through the MCP client. `docker run -e` forwards them into the container:

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

### Required

| Variable           | Description                              |
| ------------------ | ---------------------------------------- |
| `OBLIO_API_EMAIL`  | Your Oblio account email                 |
| `OBLIO_API_SECRET` | API secret from Oblio settings           |
| `CIF`              | Company CIF from **Setari > Date firma** |

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
3. If authentication fails after a password reset, copy the new API secret from **Setari > Date Cont**
4. Ensure your company CIF is set (via the `CIF` env var or the `set_cif` tool)
5. Confirm you have the necessary permissions for the operations you're performing

## License

ISC
