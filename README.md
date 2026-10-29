# Oblio.eu accounting MCP Server

MCP Server for the [Oblio API](https://www.oblio.eu/api), enabling Claude and other MCP-compatible platforms to interact with [Oblio.eu](https://www.oblio.eu) accounting software.

Create invoices, manage documents, collect payments, query nomenclatures, and submit e-Factura to Romania's SPV system -- all through natural language.

> This project is independent of Oblio. It uses their public API and the `@obliosoftware/oblioapi` package.

## Prerequisites

- Node.js >= 24 and npm >= 11.14. Node.js 24.18 and later already include a new enough npm (24.18 bundles npm 11.16). Node.js 24.17 and earlier bundle npm 11.13, which is too old.
- An active [Oblio.eu](https://www.oblio.eu) account with API access

## Setup

### 1. Get your Oblio API credentials

- Log in at [oblio.eu](https://www.oblio.eu)
- Email and API secret: **Setari > Date Cont** ([account settings](https://www.oblio.eu/account/settings))
- Company CIF: **Setari > Date firma** (e.g. `RO37311090`)

Oblio regenerates the API secret whenever the account password is reset.

### 2. Add the server in Claude Desktop

In Claude Desktop settings, add the marketplace `https://github.com/valentinludu/oblio-mcp`, then install the `oblio-mcp` plugin. Claude asks for your Oblio email, API secret, and company CIF. Node.js has to be installed, because the plugin starts the server with `npx`.

Claude Code can add the same marketplace from a shell:

```bash
claude plugin marketplace add valentinludu/oblio-mcp
claude plugin install oblio-mcp@oblio
```

The shell install does not ask for credentials. In a Claude Code session, run `/plugin configure oblio-mcp@oblio` and enter your Oblio email, API secret, and company CIF.

### Other apps

Apps that take an MCP server config can use the same npm package. No clone or build is needed.

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

### Local clone

```bash
git clone https://github.com/valentinludu/oblio-mcp.git
cd oblio-mcp
npm install
```

`npm install` runs `prepare`, which builds `dist/index.js`.

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
| `delete_document`  | Permanently deletes a document. Only the last document in a series can be deleted. Optionally removes the associated payment, and accepts an idempotency key so the same delete is not processed twice.   |
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

| Tool                   | Description                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `create_einvoice`      | Submits an existing invoice to Romania's SPV system for e-Factura. Returns status code: 0=processing, 1=success, 2=errors, -1=not sent.                      |
| `get_einvoice_archive` | Downloads the e-Invoice archive from SPV for a previously submitted invoice. Returns the file as a base64 resource, or JSON when the API responds with JSON. |

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

## Releasing

1. Run `npm version 1.0.1 --no-git-tag-version` to update `package.json` and `package-lock.json`.
2. Set the same version in `.claude-plugin/plugin.json`.
3. Commit and push.
4. Run `npm login` if you are not already logged in, then `npm stage publish --access public` or `npm publish --access public`. Both run `prepare`, which builds `dist/` before packing.

## License

[MIT](LICENSE)
