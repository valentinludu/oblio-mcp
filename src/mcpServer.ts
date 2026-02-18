import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { oblioClient } from "./oblioClient.js";
import { createDocumentInputSchema, collectSchema } from "./schema.js";

export const createOblioMcpServer = () => {
  const server = new McpServer({
    name: "oblio-server",
    version: "1.0.0",
  });

  // ──────────────────────────────────────────────
  //  TOOLS
  // ──────────────────────────────────────────────

  server.registerTool(
    "create_document",
    {
      title: "Create Document",
      description:
        "Creates an invoice (factura), proforma, or delivery notice (aviz) in Oblio via POST /api/docs/{type}. " +
        "Required fields: cif, client (with at least name), seriesName, issueDate, and at least one product. " +
        "Optional: inline payment via collect, reference to existing proforma/notice via referenceDocument, " +
        "stock deduction via useStock, auto e-Factura submission via spvExtern, and idempotencyKey to prevent duplicates. " +
        "Returns: seriesName, number, and a link to view/download the created document.",
      inputSchema: createDocumentInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ type, data }) => {
      try {
        const response = await oblioClient.createDoc(type, data);
        return {
          content: [
            { type: "text", text: JSON.stringify(response, null, 2) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating document: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "get_document",
    {
      title: "Get Document",
      description:
        "Retrieves a single document from Oblio via GET /api/docs/{type}. " +
        "Returns: documentType, seriesName, number, link (view/download URL), " +
        "and collects array (list of payments with issueDate, type, number, value).",
      inputSchema: {
        type: z
          .union([
            z.literal("proforma"),
            z.literal("invoice"),
            z.literal("notice"),
          ])
          .describe("Document type to retrieve"),
        seriesName: z
          .string()
          .describe('Document series name (e.g. "FCT", "PR")'),
        number: z.number().describe("Document number within the series"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ type, seriesName, number }) => {
      try {
        const response = await oblioClient.get(type, seriesName, number);
        return {
          content: [
            { type: "text", text: JSON.stringify(response, null, 2) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting document: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "delete_document",
    {
      title: "Delete Document",
      description:
        "Permanently deletes a document from Oblio via DELETE /api/docs/{type}. " +
        "Constraint: only the last document in a series can be deleted. This cannot be undone. " +
        "Set deleteCollect to true to also remove the associated payment (invoices only). " +
        "Returns: documentType, seriesName, number of the deleted document.",
      inputSchema: {
        type: z
          .union([
            z.literal("invoice"),
            z.literal("proforma"),
            z.literal("notice"),
          ])
          .describe("Document type to delete"),
        seriesName: z.string().describe("Document series name"),
        number: z.number().describe("Document number"),
        deleteCollect: z
          .boolean()
          .optional()
          .describe(
            "true to also delete the associated payment collection (invoices only). Default false"
          ),
        idempotencyKey: z
          .string()
          .optional()
          .describe("Unique key to prevent duplicate deletion"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ type, seriesName, number, deleteCollect, idempotencyKey }) => {
      try {
        const response = await oblioClient.delete(type, seriesName, number);
        return {
          content: [
            { type: "text", text: JSON.stringify(response, null, 2) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting document: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "cancel_document",
    {
      title: "Cancel Document",
      description:
        "Cancels (annuls) a document in Oblio via PUT /api/docs/{type}/cancel. " +
        "The document is marked as void but remains in the system. " +
        "Returns: documentType, seriesName, number, and link to the cancelled document.",
      inputSchema: {
        type: z
          .union([
            z.literal("invoice"),
            z.literal("proforma"),
            z.literal("notice"),
          ])
          .describe("Document type to cancel"),
        seriesName: z.string().describe("Document series name"),
        number: z.number().describe("Document number"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ type, seriesName, number }) => {
      try {
        const response = await oblioClient.cancel(
          type,
          seriesName,
          number,
          true
        );
        return {
          content: [
            { type: "text", text: JSON.stringify(response, null, 2) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error cancelling document: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "restore_document",
    {
      title: "Restore Document",
      description:
        "Restores a previously cancelled document in Oblio via PUT /api/docs/{type}/restore. " +
        "Reverses a cancellation and makes the document active again. " +
        "Returns: documentType, seriesName, number, and link to the restored document.",
      inputSchema: {
        type: z
          .union([
            z.literal("invoice"),
            z.literal("proforma"),
            z.literal("notice"),
          ])
          .describe("Document type to restore"),
        seriesName: z.string().describe("Document series name"),
        number: z.number().describe("Document number"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ type, seriesName, number }) => {
      try {
        const response = await oblioClient.cancel(
          type,
          seriesName,
          number,
          false
        );
        return {
          content: [
            { type: "text", text: JSON.stringify(response, null, 2) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error restoring document: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "get_nomenclatures",
    {
      title: "Get Nomenclatures",
      description:
        "Fetches reference/lookup data from Oblio via GET /api/nomenclature/{type}. Types and their returns:\n" +
        '- "companies": returns cif, company name, userTypeAccess for each account company\n' +
        '- "clients": returns cif, name, rc, code, address, state, city, iban, bank, email, phone, vatPayer. Filterable by name, clientCif\n' +
        '- "products": returns name, code, description, measuringUnit, productType, price, currency, vatName, vatPercentage, vatIncluded, and stock[] for stocked items. Filterable by name, code, management, workStation\n' +
        '- "vat_rates": returns name, percent, default for each VAT rate\n' +
        '- "series": returns type (Factura/Proforma/Aviz), name, start, next, default for each document series\n' +
        '- "languages": returns code and name for each configured language\n' +
        '- "management": returns management, workStation, managementType for each stock location\n' +
        "Paginated: max 250 results per page, use offset filter (0, 250, 500...) for next pages.",
      inputSchema: {
        type: z
          .union([
            z.literal("products"),
            z.literal("companies"),
            z.literal("clients"),
            z.literal("vat_rates"),
            z.literal("series"),
            z.literal("languages"),
            z.literal("management"),
          ])
          .describe("Nomenclature type to retrieve"),
        name: z
          .string()
          .optional()
          .describe(
            "Search by name (for products and clients nomenclatures)"
          ),
        filters: z
          .record(z.string(), z.any())
          .optional()
          .describe(
            "Additional filters as key-value pairs. For products: code, management, workStation, offset. For clients: clientCif, offset."
          ),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ type, name, filters }) => {
      try {
        const response = await oblioClient.nomenclature(type, name, filters);
        return {
          content: [
            { type: "text", text: JSON.stringify(response, null, 2) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting nomenclatures: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "collect_payment",
    {
      title: "Collect Payment",
      description:
        "Records a payment (incasare) against an existing invoice via PUT /api/docs/invoice/collect. " +
        "Identifies the invoice by seriesName + number. The collect object specifies payment method (type), " +
        "document number, optional value (defaults to full invoice total), and optional issueDate. " +
        "Available payment types: Chitanta, Bon fiscal, Bon fiscal card, Alta incasare numerar, " +
        "Ordin de plata, Mandat postal, Card, CEC, Bilet ordin, Alta incasare banca, Ramburs. " +
        "Returns: documentType, seriesName, number, link, and collects array with all payments on the invoice.",
      inputSchema: {
        seriesName: z
          .string()
          .describe("Invoice series name (e.g. FCT)"),
        number: z.number().describe("Invoice number"),
        collect: collectSchema.describe("Payment details"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ seriesName, number, collect }) => {
      try {
        const response = await oblioClient.collect(seriesName, number, collect);
        return {
          content: [
            { type: "text", text: JSON.stringify(response, null, 2) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error collecting payment: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "list_documents",
    {
      title: "List Documents",
      description:
        "Lists documents from Oblio via GET /api/docs/{type}/list with filters and pagination. " +
        "Each result contains: id, draft, canceled, seriesName, number, issueDate, dueDate, precision, " +
        "currency, exchangeRate, total, collected (0=unpaid, 1=paid), mentions, useStock, type, link, " +
        "einvoiceStatus (text, sent, code), and client object (clientId, cif, name, rc, code, address, etc.). " +
        "Optionally include product lines (withProducts=1), payment details (withCollects=1), " +
        "or e-Invoice SPV status (withEinvoiceStatus=1). Max 100 results per page.",
      inputSchema: {
        type: z
          .union([
            z.literal("invoice"),
            z.literal("proforma"),
            z.literal("notice"),
          ])
          .describe("Document type to list"),
        filters: z
          .object({
            id: z.string().optional().describe("Filter by document ID"),
            seriesName: z
              .string()
              .optional()
              .describe("Filter by series name"),
            number: z
              .string()
              .optional()
              .describe("Filter by document number"),
            issuedAfter: z
              .string()
              .optional()
              .describe("Start date filter in YYYY-MM-DD format"),
            issuedBefore: z
              .string()
              .optional()
              .describe("End date filter in YYYY-MM-DD format"),
            client: z
              .object({
                cif: z.string().optional().describe("Client CIF"),
                name: z.string().optional().describe("Client name"),
                code: z.string().optional().describe("Client code"),
                email: z.string().optional().describe("Client email"),
                phone: z.string().optional().describe("Client phone"),
              })
              .optional()
              .describe("Client filters"),
            draft: z
              .union([z.literal("0"), z.literal("1"), z.literal("-1")])
              .optional()
              .describe("-1 ignore, 0 not draft, 1 draft only"),
            canceled: z
              .union([z.literal("0"), z.literal("1"), z.literal("-1")])
              .optional()
              .describe("-1 ignore, 0 not cancelled, 1 cancelled only"),
            collected: z
              .union([z.literal("0"), z.literal("1"), z.literal("-1")])
              .optional()
              .describe(
                "-1 ignore, 0 not collected (unpaid), 1 collected (paid)"
              ),
            withProducts: z
              .union([z.literal("0"), z.literal("1")])
              .optional()
              .describe("1 to include product lines in the results"),
            withCollects: z
              .union([z.literal("0"), z.literal("1")])
              .optional()
              .describe("1 to include payment collections in the results"),
            withEinvoiceStatus: z
              .union([z.literal("0"), z.literal("1")])
              .optional()
              .describe("1 to include e-Invoice SPV status"),
            orderBy: z
              .union([
                z.literal("id"),
                z.literal("issueDate"),
                z.literal("number"),
              ])
              .optional()
              .describe("Sort field"),
            orderDir: z
              .union([z.literal("ASC"), z.literal("DESC")])
              .optional()
              .describe("Sort direction"),
            limitPerPage: z
              .string()
              .optional()
              .describe("Results per page (max 100)"),
            offset: z
              .string()
              .optional()
              .describe(
                "Pagination offset (multiples of limitPerPage, e.g. 0, 100, 200)"
              ),
          })
          .describe("Filter and pagination options"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ type, filters }) => {
      try {
        const response = await oblioClient.list(type, filters);
        return {
          content: [
            { type: "text", text: JSON.stringify(response, null, 2) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing documents: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "create_einvoice",
    {
      title: "Send e-Invoice to SPV",
      description:
        "Submits an existing invoice to Romania's SPV system via POST /api/docs/einvoice. " +
        "The invoice must already exist in Oblio. " +
        "Returns: text (explanation), sent (boolean), code (-1=not sent, 2=errors, 0=processing, 1=success).",
      inputSchema: {
        seriesName: z
          .string()
          .describe("Invoice series name (e.g. FCT)"),
        number: z.number().describe("Invoice number"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ seriesName, number }) => {
      try {
        const response = await oblioClient.createDoc("einvoice", {
          seriesName,
          number,
        });
        return {
          content: [
            { type: "text", text: JSON.stringify(response, null, 2) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error sending e-invoice to SPV: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "get_einvoice_archive",
    {
      title: "Get e-Invoice Archive from SPV",
      description:
        "Downloads the e-Invoice archive (XML) from Romania's SPV system via GET /api/docs/einvoice. " +
        "The invoice must have been previously submitted to SPV. " +
        "Returns the SPV archive data for the specified invoice.",
      inputSchema: {
        seriesName: z
          .string()
          .describe("Invoice series name (e.g. FCT)"),
        number: z.number().describe("Invoice number"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ seriesName, number }) => {
      try {
        const response = await oblioClient.get("einvoice", seriesName, number);
        return {
          content: [
            { type: "text", text: JSON.stringify(response, null, 2) },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting e-invoice archive: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "set_cif",
    {
      title: "Set Company CIF",
      description:
        "Sets the company CIF (Cod de Identificare Fiscala / tax ID) used for all subsequent Oblio API requests. " +
        "Must be called before other tools if the CIF environment variable is not configured. " +
        "The CIF identifies which company's data to access (e.g. RO37311090).",
      inputSchema: {
        cif: z
          .string()
          .describe(
            "Company CIF / tax ID (e.g. RO37311090)"
          ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ cif }) => {
      try {
        oblioClient.setCif(cif);
        return {
          content: [
            { type: "text", text: `CIF has been updated to ${cif}` },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting CIF: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "get_cif",
    {
      title: "Get Company CIF",
      description:
        "Returns the currently configured company CIF (tax ID) used for Oblio API requests.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const cif = oblioClient.getCif();
        return {
          content: [
            {
              type: "text",
              text: `Current company CIF is: ${cif}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting CIF: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ──────────────────────────────────────────────
  //  PROMPTS
  // ──────────────────────────────────────────────

  server.registerPrompt("createInvoice", {
    title: "Create Invoice",
    description:
      "Generate an invoice in Oblio with client details, a product, price and quantity.",
    argsSchema: {
      clientName: z.string().describe("Client company or person name"),
      clientCif: z.string().describe("Client CIF or CNP"),
      productName: z.string().describe("Product or service name"),
      productPrice: z.string().describe("Unit price"),
      quantity: z.string().describe("Quantity"),
    },
  }, (args) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please create an invoice with the following details:

Client Name: ${args.clientName}
Client CIF: ${args.clientCif}
Product: ${args.productName}
Price: ${args.productPrice}
Quantity: ${args.quantity}

You can use the create_document tool with the type "invoice" to create the invoice. Make sure to include all required fields.`,
        },
      },
    ],
  }));

  server.registerPrompt("createProforma", {
    title: "Create Proforma",
    description:
      "Generate a proforma document in Oblio with client details, a product, price and quantity.",
    argsSchema: {
      clientName: z.string().describe("Client company or person name"),
      clientCif: z.string().describe("Client CIF or CNP"),
      productName: z.string().describe("Product or service name"),
      productPrice: z.string().describe("Unit price"),
      quantity: z.string().describe("Quantity"),
    },
  }, (args) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please create a proforma with the following details:

Client Name: ${args.clientName}
Client CIF: ${args.clientCif}
Product: ${args.productName}
Price: ${args.productPrice}
Quantity: ${args.quantity}

You can use the create_document tool with the type "proforma" to create the proforma. Make sure to include all required fields.`,
        },
      },
    ],
  }));

  server.registerPrompt("createNotice", {
    title: "Create Notice (Aviz)",
    description:
      "Generate a delivery notice (aviz) in Oblio with client details, a product, price and quantity.",
    argsSchema: {
      clientName: z.string().describe("Client company or person name"),
      clientCif: z.string().describe("Client CIF or CNP"),
      productName: z.string().describe("Product or service name"),
      productPrice: z.string().describe("Unit price"),
      quantity: z.string().describe("Quantity"),
    },
  }, (args) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please create a notice (aviz) with the following details:

Client Name: ${args.clientName}
Client CIF: ${args.clientCif}
Product: ${args.productName}
Price: ${args.productPrice}
Quantity: ${args.quantity}

You can use the create_document tool with the type "notice" to create the notice. Make sure to include all required fields.`,
        },
      },
    ],
  }));

  server.registerPrompt("getInvoice", {
    title: "Get Invoice",
    description: "Retrieve an invoice by series name and number.",
    argsSchema: {
      seriesName: z.string().describe("Invoice series name (e.g. FCT)"),
      number: z.string().describe("Invoice number"),
    },
  }, ({ seriesName, number }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please retrieve the document with type "invoice", series "${seriesName}" and number "${number}".

You can use the get_document tool to fetch the invoice details.`,
        },
      },
    ],
  }));

  server.registerPrompt("getProforma", {
    title: "Get Proforma",
    description: "Retrieve a proforma by series name and number.",
    argsSchema: {
      seriesName: z.string().describe("Proforma series name (e.g. PR)"),
      number: z.string().describe("Proforma number"),
    },
  }, ({ seriesName, number }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please retrieve the document with type "proforma" and series "${seriesName}" and number "${number}".

You can use the get_document tool to fetch the proforma details.`,
        },
      },
    ],
  }));

  server.registerPrompt("getNotice", {
    title: "Get Notice (Aviz)",
    description: "Retrieve a delivery notice (aviz) by series name and number.",
    argsSchema: {
      seriesName: z.string().describe("Notice series name"),
      number: z.string().describe("Notice number"),
    },
  }, ({ seriesName, number }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please retrieve the document with type "notice" and series "${seriesName}" and number "${number}".

You can use the get_document tool to fetch the notice details.`,
        },
      },
    ],
  }));

  server.registerPrompt("cancelInvoice", {
    title: "Cancel Invoice",
    description: "Cancel (annul) an invoice. The document is marked as void but not deleted.",
    argsSchema: {
      seriesName: z.string().describe("Invoice series name"),
      number: z.string().describe("Invoice number"),
    },
  }, ({ seriesName, number }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please cancel the invoice with series "${seriesName}" and number "${number}".

You can use the cancel_document tool with type "invoice".`,
        },
      },
    ],
  }));

  server.registerPrompt("cancelProforma", {
    title: "Cancel Proforma",
    description: "Cancel (annul) a proforma document.",
    argsSchema: {
      seriesName: z.string().describe("Proforma series name"),
      number: z.string().describe("Proforma number"),
    },
  }, ({ seriesName, number }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please cancel the proforma with series "${seriesName}" and number "${number}".

You can use the cancel_document tool with type "proforma".`,
        },
      },
    ],
  }));

  server.registerPrompt("cancelNotice", {
    title: "Cancel Notice (Aviz)",
    description: "Cancel (annul) a delivery notice.",
    argsSchema: {
      seriesName: z.string().describe("Notice series name"),
      number: z.string().describe("Notice number"),
    },
  }, ({ seriesName, number }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please cancel the notice (aviz) with series "${seriesName}" and number "${number}".

You can use the cancel_document tool with type "notice".`,
        },
      },
    ],
  }));

  server.registerPrompt("restoreInvoice", {
    title: "Restore Invoice",
    description: "Restore a previously cancelled invoice, making it active again.",
    argsSchema: {
      seriesName: z.string().describe("Invoice series name"),
      number: z.string().describe("Invoice number"),
    },
  }, ({ seriesName, number }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please restore the invoice with series "${seriesName}" and number "${number}".

You can use the restore_document tool with type "invoice".`,
        },
      },
    ],
  }));

  server.registerPrompt("restoreProforma", {
    title: "Restore Proforma",
    description: "Restore a previously cancelled proforma document.",
    argsSchema: {
      seriesName: z.string().describe("Proforma series name"),
      number: z.string().describe("Proforma number"),
    },
  }, ({ seriesName, number }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please restore the proforma with series "${seriesName}" and number "${number}".

You can use the restore_document tool with type "proforma".`,
        },
      },
    ],
  }));

  server.registerPrompt("restoreNotice", {
    title: "Restore Notice (Aviz)",
    description: "Restore a previously cancelled delivery notice.",
    argsSchema: {
      seriesName: z.string().describe("Notice series name"),
      number: z.string().describe("Notice number"),
    },
  }, ({ seriesName, number }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please restore the notice (aviz) with series "${seriesName}" and number "${number}".

You can use the restore_document tool with type "notice".`,
        },
      },
    ],
  }));

  server.registerPrompt("deleteInvoice", {
    title: "Delete Invoice",
    description: "Permanently delete the last invoice in a series. This cannot be undone.",
    argsSchema: {
      seriesName: z.string().describe("Invoice series name"),
      number: z.string().describe("Invoice number"),
    },
  }, ({ seriesName, number }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please delete the invoice with series "${seriesName}" and number "${number}".

You can use the delete_document tool with type "invoice". Note: only the last document in a series can be deleted.`,
        },
      },
    ],
  }));

  server.registerPrompt("deleteProforma", {
    title: "Delete Proforma",
    description: "Permanently delete the last proforma in a series. This cannot be undone.",
    argsSchema: {
      seriesName: z.string().describe("Proforma series name"),
      number: z.string().describe("Proforma number"),
    },
  }, ({ seriesName, number }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please delete the proforma with series "${seriesName}" and number "${number}".

You can use the delete_document tool with type "proforma". Note: only the last document in a series can be deleted.`,
        },
      },
    ],
  }));

  server.registerPrompt("deleteNotice", {
    title: "Delete Notice (Aviz)",
    description: "Permanently delete the last delivery notice in a series. This cannot be undone.",
    argsSchema: {
      seriesName: z.string().describe("Notice series name"),
      number: z.string().describe("Notice number"),
    },
  }, ({ seriesName, number }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please delete the notice (aviz) with series "${seriesName}" and number "${number}".

You can use the delete_document tool with type "notice". Note: only the last document in a series can be deleted.`,
        },
      },
    ],
  }));

  server.registerPrompt("getProductsNomenclature", {
    title: "Search Products",
    description: "Look up products/services in the Oblio nomenclature by name or code.",
    argsSchema: {
      name: z.string().optional().describe("Product name to search"),
      code: z.string().optional().describe("Product code to search"),
      management: z.string().optional().describe("Stock management name filter"),
      workStation: z.string().optional().describe("Work station filter"),
      offset: z.string().optional().describe("Pagination offset (multiples of 250)"),
    },
  }, ({ name, code, management, workStation, offset }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please get the products nomenclature with the following filters:

name: ${name ?? "(not specified)"}
code: ${code ?? "(not specified)"}
management: ${management ?? "(not specified)"}
workStation: ${workStation ?? "(not specified)"}
offset: ${offset ?? "0"}

Use the get_nomenclatures tool with type "products". Pass the above as key/value pairs in the filters parameter. At least name or code should be provided.`,
        },
      },
    ],
  }));

  server.registerPrompt("getClientsNomenclature", {
    title: "Search Clients",
    description: "Look up clients in the Oblio nomenclature by name or CIF.",
    argsSchema: {
      name: z.string().optional().describe("Client name to search"),
      clientCif: z.string().optional().describe("Client CIF to search"),
      offset: z.string().optional().describe("Pagination offset (multiples of 250)"),
    },
  }, ({ name, clientCif, offset }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please get the clients nomenclature with the following filters:

name: ${name ?? "(not specified)"}
clientCif: ${clientCif ?? "(not specified)"}
offset: ${offset ?? "0"}

Use the get_nomenclatures tool with type "clients". Pass the above as key/value pairs in the filters parameter. At least name or clientCif should be provided.`,
        },
      },
    ],
  }));

  server.registerPrompt("getVatRatesNomenclature", {
    title: "Get VAT Rates",
    description: "List all VAT rates configured for your company in Oblio.",
    argsSchema: {},
  }, () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please get the VAT rates nomenclature for my company.
Use the get_nomenclatures tool with type "vat_rates". No additional filters are needed.`,
        },
      },
    ],
  }));

  server.registerPrompt("getCompaniesNomenclature", {
    title: "Get Companies",
    description: "List all companies linked to the Oblio account.",
    argsSchema: {},
  }, () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please get the companies nomenclature.
Use the get_nomenclatures tool with type "companies". No additional filters are needed.`,
        },
      },
    ],
  }));

  server.registerPrompt("getDocumentSeriesNomenclature", {
    title: "Get Document Series",
    description: "List all document series (invoice, proforma, notice) configured for your company.",
    argsSchema: {},
  }, () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please get the document series nomenclature for my company.
Use the get_nomenclatures tool with type "series". No additional filters are needed.`,
        },
      },
    ],
  }));

  server.registerPrompt("getLanguagesNomenclature", {
    title: "Get Languages",
    description: "List foreign languages configured for your company in Oblio.",
    argsSchema: {},
  }, () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please get the languages nomenclature for my company.
Use the get_nomenclatures tool with type "languages". No additional filters are needed.`,
        },
      },
    ],
  }));

  server.registerPrompt("getManagementNomenclature", {
    title: "Get Stock Management Locations",
    description: "List stock management locations (gestiuni) configured for your company. Only works if stock is enabled.",
    argsSchema: {},
  }, () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please get the management (gestiuni) nomenclature for my company.
Use the get_nomenclatures tool with type "management". No additional filters are needed. This only works if stock is enabled.`,
        },
      },
    ],
  }));

  server.registerPrompt("collectPayment", {
    title: "Collect Invoice Payment",
    description: "Record a payment against an existing invoice.",
    argsSchema: {
      invoiceSeriesName: z.string().describe("Invoice series name (e.g. FCT)"),
      invoiceNumber: z.string().describe("Invoice number"),
      type: z.union([
        z.literal("Chitanta"),
        z.literal("Bon fiscal"),
        z.literal("Bon fiscal card"),
        z.literal("Alta incasare numerar"),
        z.literal("Ordin de plata"),
        z.literal("Mandat postal"),
        z.literal("Card"),
        z.literal("CEC"),
        z.literal("Bilet ordin"),
        z.literal("Alta incasare banca"),
        z.literal("Ramburs"),
      ]).describe("Payment method"),
      seriesName: z.string().describe("Payment document series name (for Chitanta)"),
      documentNumber: z.string().describe("Payment document number"),
      value: z.string().describe("Amount paid"),
      mentions: z.string().optional().describe("Payment notes"),
    },
  }, ({ invoiceSeriesName, invoiceNumber, type, seriesName, documentNumber, value, mentions }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please collect the payment for the invoice with the following details:

Invoice series: ${invoiceSeriesName}
Invoice number: ${invoiceNumber}
Payment type: ${type}
Payment series: ${seriesName}
Document number: ${documentNumber}
Value: ${value}
Mentions: ${mentions ?? "(none)"}

Use the collect_payment tool. Pass seriesName=${invoiceSeriesName}, number=${invoiceNumber}, and the collect object with the payment details above.`,
        },
      },
    ],
  }));

  server.registerPrompt("getInvoiceList", {
    title: "List Invoices",
    description:
      "Search and list invoices with various filters (date range, client, status, etc.).",
    argsSchema: {
      id: z.string().optional().describe("Filter by document ID"),
      seriesName: z.string().optional().describe("Filter by series name"),
      number: z.string().optional().describe("Filter by document number"),
      issuedAfter: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      issuedBefore: z.string().optional().describe("End date (YYYY-MM-DD)"),
      clientCif: z.string().optional().describe("Filter by client CIF"),
      clientName: z.string().optional().describe("Filter by client name"),
      clientCode: z.string().optional().describe("Filter by client code"),
      draft: z.union([z.literal("0"), z.literal("1")]).optional().describe("0 = not draft, 1 = draft"),
      canceled: z.union([z.literal("0"), z.literal("1")]).optional().describe("0 = not cancelled, 1 = cancelled"),
      collected: z.union([z.literal("0"), z.literal("1")]).optional().describe("0 = unpaid, 1 = paid"),
      withProducts: z.union([z.literal("0"), z.literal("1")]).optional().describe("1 to include products"),
      withCollects: z.union([z.literal("0"), z.literal("1")]).optional().describe("1 to include payment details"),
      withEinvoiceStatus: z.union([z.literal("0"), z.literal("1")]).optional().describe("1 to include SPV status"),
      orderBy: z.union([z.literal("id"), z.literal("issueDate"), z.literal("number")]).optional().describe("Sort field"),
      orderDir: z.union([z.literal("ASC"), z.literal("DESC")]).optional().describe("Sort direction"),
      limitPerPage: z.string().optional().describe("Results per page (max 100)"),
      offset: z.string().optional().describe("Pagination offset"),
    },
  }, (args) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please get the list of invoices with the following filters:

${Object.entries(args)
  .filter(([, v]) => v !== undefined)
  .map(([k, v]) => `${k}: ${v}`)
  .join("\n")}

Use the list_documents tool with type "invoice". For client filters (clientCif, clientName, clientCode), nest them under a "client" object in filters, e.g. { client: { cif: "..." } }.

When returning results, indicate for each invoice whether it is paid or unpaid by checking the "collected" field (0 = unpaid).`,
        },
      },
    ],
  }));

  server.registerPrompt("sendInvoiceToSpv", {
    title: "Send Invoice to SPV",
    description: "Submit an invoice to Romania's SPV system to create an e-Factura.",
    argsSchema: {
      seriesName: z.string().describe("Invoice series name"),
      number: z.string().describe("Invoice number"),
    },
  }, ({ seriesName, number }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Send invoice to SPV (e-Factura) with series "${seriesName}" and number "${number}".

Use the create_einvoice tool.`,
        },
      },
    ],
  }));

  server.registerPrompt("getEinvoiceFromSpv", {
    title: "Get e-Invoice from SPV",
    description: "Download the e-Invoice archive from SPV for a specific invoice.",
    argsSchema: {
      seriesName: z.string().describe("Invoice series name"),
      number: z.string().describe("Invoice number"),
    },
  }, ({ seriesName, number }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Get the e-Invoice archive from SPV for series "${seriesName}" and number "${number}".

Use the get_einvoice_archive tool.`,
        },
      },
    ],
  }));

  server.registerPrompt("setCif", {
    title: "Set Company CIF",
    description: "Configure the company CIF (tax ID) for all subsequent API requests.",
    argsSchema: {
      cif: z.string().describe("Company CIF (e.g. RO37311090)"),
    },
  }, ({ cif }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Set the company CIF to "${cif}".

Use the set_cif tool.`,
        },
      },
    ],
  }));

  server.registerPrompt("getCif", {
    title: "Get Company CIF",
    description: "Check which company CIF is currently configured.",
    argsSchema: {},
  }, () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Get the currently configured company CIF.

Use the get_cif tool.`,
        },
      },
    ],
  }));

  return server;
};
