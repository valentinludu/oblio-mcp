---
name: oblio-mcp
description: Guides interactions with the Oblio.eu accounting MCP server for Romanian invoicing, payments, and e-Factura. Use when working with Oblio API, creating invoices, managing documents, collecting payments, querying nomenclatures, or submitting e-Factura to SPV.
---

# Oblio MCP Server

MCP server for [Oblio.eu](https://www.oblio.eu) Romanian accounting software. Provides tools for document management (invoices, proformas, notices), payment collection, nomenclature lookups, and e-Factura SPV integration.

## Romanian Accounting Terminology

| Romanian | English | MCP type value |
|----------|---------|----------------|
| Factura | Invoice | `"invoice"` |
| Proforma | Proforma | `"proforma"` |
| Aviz | Delivery notice | `"notice"` |
| Chitanta | Receipt | `"Chitanta"` |
| Bon fiscal | Fiscal receipt | `"Bon fiscal"` |
| Ordin de plata | Bank transfer | `"Ordin de plata"` |
| CIF | Tax ID (Cod de Identificare Fiscala) | string, e.g. `"RO37311090"` |
| TVA | VAT | — |
| Gestiune | Stock management location | — |
| SPV | e-Invoice verification system | — |
| Incasare | Payment collection | — |

## Setup Requirements

Environment variables required:
- `OBLIO_API_EMAIL` — Oblio account email
- `OBLIO_API_SECRET` — API secret from Oblio > Setari > Date Cont
- `CIF` — Default company CIF (optional, can be set via `set_cif` tool)

## Common Workflows

### 1. Check if a Client Paid Their Last Invoice

When the user asks something like "Did Carrefour pay the last invoice?":

```
Step 1: Find the client's CIF
  → get_nomenclatures(type: "clients", name: "Carrefour")
  → Extract the cif field from the result (e.g. "RO18321712")

Step 2: Get the most recent invoice for that client
  → list_documents(type: "invoice", filters: {
      client: { cif: "RO18321712" },
      orderBy: "issueDate",
      orderDir: "DESC",
      limitPerPage: "1"
    })

Step 3: Check the "collected" field in the result
  → 0 means unpaid, 1 means paid
  → Also check "total" for the invoice amount
```

### 2. List All Unpaid Invoices

```
list_documents(type: "invoice", filters: { collected: "0" })
```

To include payment details and products in results:

```
list_documents(type: "invoice", filters: {
  collected: "0",
  withProducts: "1",
  withCollects: "1"
})
```

### 3. Create an Invoice

```
Step 1: Look up document series → get_nomenclatures(type: "series")
        Pick the series where type="Factura" (e.g. name="FCT")

Step 2: Look up VAT rates       → get_nomenclatures(type: "vat_rates")
        Note the name and percent (e.g. "Normala", 19)

Step 3: Create the invoice      → create_document(type: "invoice", data: {...})
```

### 4. Create Invoice from Proforma

No client or product data needed -- it copies from the proforma:

```
create_document(type: "invoice", data: {
  cif: "RO...",
  seriesName: "FCT",
  referenceDocument: { type: "Proforma", seriesName: "PR", number: 8 }
})
```

### 5. Reverse (Storno) an Invoice

```
create_document(type: "invoice", data: {
  cif: "RO...",
  seriesName: "FCT",
  referenceDocument: { type: "Factura", seriesName: "FCT", number: 568, refund: 1 }
})
```

### 6. Collect a Payment on an Invoice

```
collect_payment(seriesName: "FCT", number: 55, collect: {
  type: "Ordin de plata",
  documentNumber: "OP 7001"
})
```

Value defaults to the full invoice total when omitted.

### 7. Send to SPV (e-Factura) and Check Status

```
Step 1: Submit → create_einvoice(seriesName: "FCT", number: 55)
        Check returned code: 0=processing, 1=success, 2=errors, -1=not sent

Step 2: Download archive → get_einvoice_archive(seriesName: "FCT", number: 55)
```

### 8. Find Invoices for a Date Range

```
list_documents(type: "invoice", filters: {
  issuedAfter: "2026-01-01",
  issuedBefore: "2026-01-31",
  orderBy: "issueDate",
  orderDir: "DESC"
})
```

### 9. Cancel vs Delete

- **Cancel** (`cancel_document`): marks the document as void. Can be restored later with `restore_document`. Works on any document.
- **Delete** (`delete_document`): permanently removes. Only works on the last document in a series. Cannot be undone.

## Key Data Relationships

- **Client lookup**: `get_nomenclatures(type: "clients")` returns `cif` which is used in `list_documents` filter `client.cif` and in `create_document` data `client.cif`
- **Series lookup**: `get_nomenclatures(type: "series")` returns `name` which maps to `seriesName` in all document tools
- **VAT lookup**: `get_nomenclatures(type: "vat_rates")` returns `name` and `percent` used as product `vatName` and `vatPercentage`
- **Product lookup**: `get_nomenclatures(type: "products")` returns product data that maps to the products array in `create_document`

## Field Format Reference

| Field | Format | Example |
|-------|--------|---------|
| Dates | `YYYY-MM-DD` | `"2026-02-18"` |
| CIF | With or without `RO` prefix | `"RO37311090"` or `"37311090"` |
| Prices | String for products, number for collect value | `"200"` / `200` |
| Currency | ISO 4217 code | `"RON"`, `"EUR"`, `"USD"` |
| Series name | Short uppercase code | `"FCT"`, `"PR"`, `"AVZ"` |

## Available Tools (12)

| Tool | Purpose | Read-only |
|------|---------|-----------|
| `create_document` | Issue invoice, proforma, or notice | No |
| `get_document` | Retrieve a single document by series + number | Yes |
| `delete_document` | Permanently delete last doc in series | No |
| `cancel_document` | Cancel (annul) a document | No |
| `restore_document` | Restore a cancelled document | No |
| `get_nomenclatures` | Fetch reference data (products, clients, VAT, series, etc.) | Yes |
| `collect_payment` | Record payment against an invoice | No |
| `list_documents` | List/filter documents with pagination | Yes |
| `create_einvoice` | Submit invoice to SPV (e-Factura) | No |
| `get_einvoice_archive` | Download SPV archive | Yes |
| `set_cif` | Set company CIF for API requests | No |
| `get_cif` | Get currently configured CIF | Yes |

## Tips

- Always call `get_nomenclatures(type: "series")` before creating a document to get valid series names.
- The `list_documents` filters use nested client objects: `{ client: { cif: "..." } }`, not flat keys.
- Only the last document in a series can be deleted. Use `cancel_document` instead for non-last documents.
- Payment `value` defaults to the full invoice amount when omitted.
- Product `price` in `create_document` is a string, not a number.
- `vatIncluded: 1` means the price already includes VAT (default). Set to `0` for net prices.
- When checking if an invoice is paid, look at the `collected` field (0=unpaid, 1=paid) in `list_documents` results.
- When the user refers to a client by name, first resolve the CIF via `get_nomenclatures(type: "clients", name: "...")` before filtering documents.
