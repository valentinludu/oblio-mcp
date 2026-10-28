---
name: oblio-mcp
description: Guides interactions with the Oblio.eu accounting MCP server for Romanian invoicing, payments, and e-Factura. Use when working with Oblio API, creating invoices, managing documents, collecting payments, querying nomenclatures, or submitting e-Factura to SPV.
---

# Oblio MCP Server

MCP server for [Oblio.eu](https://www.oblio.eu) Romanian accounting software. Provides tools for document management (invoices, proformas, notices), payment collection, nomenclature lookups, and e-Factura SPV integration.

## Romanian Accounting Terminology

| Romanian | English | MCP type value |
|----------|---------|----------------|
| Factura | Invoice | `"invoice"` for document tools; `"Factura"` inside `referenceDocument.type` |
| Proforma | Proforma | `"proforma"` / `"Proforma"` |
| Aviz | Delivery notice | `"notice"` / `"Aviz"` |
| CIF | Tax ID (Cod de Identificare Fiscala) | string, e.g. `"RO37311090"` |
| TVA | VAT | — |
| Gestiune | Stock management location | `get_nomenclatures` type `"management"` |
| SPV | e-Invoice verification system | — |
| Incasare | Payment collection | `collect` / `collect_payment` |

Document tools use `invoice`, `proforma`, and `notice`. Series results and `referenceDocument.type` use `Factura`, `Proforma`, and `Aviz`.

## Setup Requirements

Environment variables required:
- `OBLIO_API_EMAIL` — Oblio account email
- `OBLIO_API_SECRET` — API secret from Oblio > Setari > Date Cont
- `CIF` — Default company CIF (optional, can be set via `set_cif` tool)

`set_cif` selects the company for later requests. `create_document` still requires `data.cif` (the same company CIF) on every create.

## Common Workflows

### 1. Check if a Client Paid Their Last Invoice

When the user asks something like "Did Carrefour pay the last invoice?":

```
Step 1: Find the client's CIF
  → get_nomenclatures(type: "clients", name: "Carrefour")
  → Extract the cif field (e.g. "RO18321712")
  → Search by tax ID with filters: { clientCif: "RO18321712" }

Step 2: Get the most recent invoice for that client
  → list_documents(type: "invoice", filters: {
      client: { cif: "RO18321712" },
      orderBy: "issueDate",
      orderDir: "DESC",
      limitPerPage: "1"
    })

Step 3: Read "collected" and "total"
  → collected 1 means fully collected, 0 means not
  → A partial payment still needs withCollects: "1" to see each payment value
```

`list_documents` also accepts `client.name`, `client.code`, `client.email`, and `client.phone`. Prefer `client.cif` when the name may match more than one client.

### 2. List All Unpaid Invoices

```
list_documents(type: "invoice", filters: {
  collected: "0",
  limitPerPage: "100",
  offset: "0"
})
```

Page size max is 100. Continue with `offset` `"100"`, `"200"`, and so on until a page returns fewer rows than `limitPerPage`. Add `withProducts: "1"` and `withCollects: "1"` when the lines or payment history are needed.

### 3. Create an Invoice

```
Step 1: Look up document series → get_nomenclatures(type: "series")
        Pick the series where type="Factura" (e.g. name="FCT")

Step 2: Look up VAT rates       → get_nomenclatures(type: "vat_rates")
        Note the name and percent (e.g. "Normala", 19)

Step 3: Create the invoice
  → create_document(type: "invoice", data: {
      cif: "RO37311090",
      client: { name: "Carrefour", cif: "RO18321712" },
      issueDate: "2026-02-18",
      seriesName: "FCT",
      products: [{
        name: "Consultanta",
        price: "200",
        measuringUnit: "buc",
        vatName: "Normala",
        vatPercentage: 19,
        vatIncluded: 1,
        quantity: 1
      }]
    })
```

Required on every create: `cif`, `client.name`, `issueDate`, `seriesName`, and at least one product with `name`, `price` (string), and `measuringUnit`. Pass `issueDate` explicitly. The same shape works for `type: "proforma"` and `type: "notice"`.

Optional on create: `idempotencyKey` (avoid a duplicate issue), inline `collect` (same object as `collect_payment`), `spvExtern: 1` (send the invoice to SPV when Oblio auto-send is enabled), `sendEmail: 1`, and a discount line `{ name: "Discount", discount: 10, discountType: "procentual" }` or `"valoric"`.

### 4. Create an Invoice from a Proforma or Aviz

Oblio copies the source document. This tool still requires `client`, `issueDate`, `products`, and `referenceDocument.refund`. Load the source first and pass its client and product lines through. Use `refund: 0`.

```
list_documents(type: "proforma", filters: {
  seriesName: "PR", number: "8", withProducts: "1", limitPerPage: "1"
})

create_document(type: "invoice", data: {
  cif: "RO37311090",
  client: { name: "<client name from the proforma>" },
  issueDate: "2026-02-18",
  seriesName: "FCT",
  products: [{ name: "<line name>", price: "<line price>", measuringUnit: "buc" }],
  referenceDocument: { type: "Proforma", seriesName: "PR", number: 8, refund: 0 }
})
```

For a delivery notice, list `type: "notice"` and set `referenceDocument.type` to `"Aviz"`.

### 5. Reverse (Storno) an Invoice

A storno is `referenceDocument.type: "Factura"`. `refund` does not mean "storno". `refund: 1` also deletes the payment collected on that invoice. `refund: 0` leaves the payment in place. Pass the original client and product lines, same as workflow 4.

```
create_document(type: "invoice", data: {
  cif: "RO37311090",
  client: { name: "<client name from the invoice>" },
  issueDate: "2026-02-18",
  seriesName: "FCT",
  products: [{ name: "<line name>", price: "<line price>", measuringUnit: "buc" }],
  referenceDocument: { type: "Factura", seriesName: "FCT", number: 568, refund: 0 }
})
```

### 6. Collect a Payment on an Invoice

Payment `type` is one of: `Chitanta`, `Bon fiscal`, `Bon fiscal card`, `Alta incasare numerar`, `Ordin de plata`, `Mandat postal`, `Card`, `CEC`, `Bilet ordin`, `Alta incasare banca`, `Ramburs`.

`Chitanta` requires `collect.seriesName` (the receipt series). Every other type requires `collect.documentNumber`. `value` defaults to the full invoice total. `issueDate` defaults to today.

```
collect_payment(seriesName: "FCT", number: 55, collect: {
  type: "Ordin de plata",
  documentNumber: "OP 7001"
})

collect_payment(seriesName: "FCT", number: 55, collect: {
  type: "Chitanta",
  seriesName: "CH"
})
```

### 7. Send to SPV (e-Factura) and Check Status

```
Submit → create_einvoice(seriesName: "FCT", number: 55)
         code: 0=processing, 1=success, 2=errors, -1=not sent
```

Read status later without submitting again:

```
list_documents(type: "invoice", filters: {
  seriesName: "FCT",
  number: "55",
  withEinvoiceStatus: "1",
  limitPerPage: "1"
})
```

Each row can include `einvoiceStatus` with `text`, `sent`, and `code`. Download the archive with `get_einvoice_archive(seriesName: "FCT", number: 55)`. A file comes back as a base64 resource. A JSON body is returned as text.

### 8. Find Invoices for a Date Range

```
list_documents(type: "invoice", filters: {
  issuedAfter: "2026-01-01",
  issuedBefore: "2026-01-31",
  orderBy: "issueDate",
  orderDir: "DESC",
  limitPerPage: "100",
  offset: "0"
})
```

Other status filters, all strings: `draft`, `canceled`, and `collected` accept `"0"`, `"1"`, or `"-1"` (ignore).

### 9. Cancel vs Delete

- **Cancel** (`cancel_document`): marks the document as void. Restore it later with `restore_document`. Works on any invoice, proforma, or notice, not only the last in the series.
- **Delete** (`delete_document`): permanently removes the document. Only the last document in a series can be deleted. Set `deleteCollect: true` to also remove the linked payment (invoices only). Pass `idempotencyKey` so the same delete is not processed twice.

## Key Data Relationships

- **Client lookup**: `get_nomenclatures(type: "clients", name: "...")` returns `cif`. By tax ID, use `filters: { clientCif: "..." }`. That `cif` goes to `list_documents` `client.cif` and `create_document` `client.cif`. Clients page at 250 rows; pass `filters.offset` `"250"`, `"500"`, and so on.
- **Series lookup**: `get_nomenclatures(type: "series")` returns `name`, used as `seriesName` on every document tool.
- **VAT lookup**: `get_nomenclatures(type: "vat_rates")` returns `name` and `percent`, used as product `vatName` and `vatPercentage`.
- **Product lookup**: `get_nomenclatures(type: "products", name: "...")` returns lines for `create_document` `products`. Other filters: `code`, `management`, `workStation`, `offset` (page size 250).
- **Other nomenclatures**: `companies` (which CIFs this account can use), `languages` (document `language` codes), `management` (gestiune names for stock).

`get_document` returns `seriesName`, `number`, a view link, and `collects`. Products, totals, client, and `collected` come from `list_documents`.

## Field Format Reference

| Field | Format | Example |
|-------|--------|---------|
| Dates | `YYYY-MM-DD` | `"2026-02-18"` |
| CIF | With or without `RO` prefix | `"RO37311090"` or `"37311090"` |
| Product price | String | `"200"` |
| Collect `value` | Number | `200` |
| Flags on create | Number `0` or `1` | `vatIncluded: 1` |
| `deleteCollect` | Boolean | `true` |
| List filters | Strings | `collected: "0"`, `limitPerPage: "100"` |
| Currency | ISO 4217 code | `"RON"`, `"EUR"`, `"USD"` |
| Series name | As returned by the series nomenclature | `"FCT"`, `"PR"`, `"AVZ"` |

## Available Tools (12)

| Tool | Purpose | Read-only |
|------|---------|-----------|
| `create_document` | Issue invoice, proforma, or notice | No |
| `get_document` | Series, number, link, and payments for one document | Yes |
| `delete_document` | Permanently delete last doc in series | No |
| `cancel_document` | Cancel (annul) a document | No |
| `restore_document` | Restore a cancelled document | No |
| `get_nomenclatures` | Companies, clients, products, VAT, series, languages, management | Yes |
| `collect_payment` | Record payment against an invoice | No |
| `list_documents` | List/filter documents with pagination | Yes |
| `create_einvoice` | Submit invoice to SPV (e-Factura) | No |
| `get_einvoice_archive` | Download SPV archive | Yes |
| `set_cif` | Set company CIF for API requests | No |
| `get_cif` | Get currently configured CIF | Yes |

## Tips

- Call `get_nomenclatures(type: "series")` before creating a document and use a series whose `type` matches the document.
- `list_documents` client filters are nested: `{ client: { cif: "..." } }`.
- Only the last document in a series can be deleted. Use `cancel_document` for any other document.
- When deleting an invoice that has a collected payment, set `deleteCollect: true`.
- Pass `idempotencyKey` on `create_document` and `delete_document` when the same request might be retried.
- Product `price` is a string. `vatIncluded: 1` means the price already includes VAT (default). Set `0` for a net price.
- `collected: 1` means fully collected. Use `withCollects: "1"` to see partial payments.
- Resolve a client name with `get_nomenclatures(type: "clients", name: "...")` before filtering documents by CIF.
