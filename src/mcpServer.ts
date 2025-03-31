import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { oblioClient } from "./oblioClient.js";
import { createDocumentValidation } from "./schema.js";

// Create the MCP server for Oblio
export const createOblioMcpServer = () => {
  const server = new McpServer({
    name: "oblio-server",
    version: "1.0.0",
  });

  // Define tools for the Oblio API functionalities

  // 1. Create Document tool
  server.tool(
    "create_document",
    createDocumentValidation,
    async ({ type, data }) => {
      try {
        const response = await oblioClient.createDoc(type, data);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating invoice: ${
                error instanceof Error ? error.message : String(error)
              }`,
              error,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 2. Get document tool by type
  server.tool(
    "get_document",
    {
      type: z.union([
        z.literal("proforma"),
        z.literal("invoice"),
        z.literal("notice"), // aviz
      ]),
      seriesName: z.string(),
      number: z.string(),
    },
    async ({ type, seriesName, number }) => {
      try {
        const response = await oblioClient.get(
          type,
          seriesName,
          Number(number)
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting document: ${
                error instanceof Error ? error.message : String(error)
              }`,
              error: error,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 3. Delete document tool
  server.tool(
    "delete_document",
    {
      type: z.union([
        z.literal("factura"),
        z.literal("proforma"),
        z.literal("notice"),
      ]),
      seriesName: z.string(),
      number: z.number(),
    },
    async ({ type, seriesName, number }) => {
      try {
        const response = await oblioClient.delete(type, seriesName, number);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting document: ${
                error instanceof Error ? error.message : String(error)
              }`,
              error,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 4. Cancel or Restore document tool
  server.tool(
    "cancel_restore_document",
    {
      type: z.union([
        z.literal("invoice"),
        z.literal("proforma"),
        z.literal("notice"),
      ]),
      seriesName: z.string(),
      number: z.number(),
      cancel: z.boolean().optional(), // cancel or restore
    },
    async ({ type, seriesName, number, cancel }) => {
      try {
        const response = await oblioClient.cancel(
          type,
          seriesName,
          number,
          cancel
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting document: ${
                error instanceof Error ? error.message : String(error)
              }`,
              error,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 5. Get nomenclatures tool
  server.tool(
    "get_nomenclatures",
    {
      type: z.union([
        z.literal("product"), // produse
        z.literal("companies"), // companiile asociate contului
        z.literal("clients"), // clienti
        z.literal("vat_rates"), // rate de TVA
        z.literal("series"), // serii de documente
        z.literal("languages"), // limbi asociate contului
        z.literal("management"), // gestiuni
      ]),
      name: z.string().optional(),
      filters: z.record(z.any()).optional(),
    },
    async ({ type, name, filters }) => {
      try {
        const response = await oblioClient.nomenclature(type, name, filters);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting nomenclatures: ${
                error instanceof Error ? error.message : String(error)
              }`,
              error,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 6. Collect tool
  server.tool(
    "collect_payment",
    {
      seriesName: z.string(),
      number: z.number(),
      collect: z.map(z.string(), z.string()), // Map of product code to quantity
    },
    async ({ seriesName, number, collect }) => {
      try {
        const response = await oblioClient.collect(seriesName, number, collect);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error collecting document: ${
                error instanceof Error ? error.message : String(error)
              }`,
              params: { seriesName, number, collect },
              error,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 7. List documents tool
  server.tool(
    "list_documents",
    {
      type: z.string(), // invoice
      filters: z.map(z.string(), z.string()), // Map of product code to quantity
    },
    async ({ type, filters }) => {
      try {
        const response = await oblioClient.list(type, filters);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error collecting document: ${
                error instanceof Error ? error.message : String(error)
              }`,
              error,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 8. Send einvoice to SPV
  server.tool(
    "create_einvoice",
    {
      seriesName: z.string(),
      number: z.number(),
    },
    async ({ seriesName, number }) => {
      try {
        const response = await oblioClient.createDoc("einvoice", {
          seriesName,
          number,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error collecting document: ${
                error instanceof Error ? error.message : String(error)
              }`,
              error,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 9. Get einvoice archive from SPV
  server.tool(
    "get_einvoice_archive",
    {
      seriesName: z.string(),
      number: z.number(),
    },
    async ({ seriesName, number }) => {
      try {
        const response = await oblioClient.get("einvoice", seriesName, number);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting document: ${
                error instanceof Error ? error.message : String(error)
              }`,
              error: error,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 10. Set cif for oblio client
  server.tool(
    "set_cif",
    {
      cif: z.string(),
    },
    async ({ cif }) => {
      try {
        oblioClient.setCif(cif);

        return {
          content: [
            {
              type: "text",
              text: "Cif has ben updated",
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting cif for oblio client: ${
                error instanceof Error ? error.message : String(error)
              }`,
              error: error,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 11. Get oblio client cif tool
  server.tool("get_cif", {}, async () => {
    try {
      const cif = oblioClient.getCif();

      return {
        content: [
          {
            type: "text",
            text: "Your oblio client cif is " + cif,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting cif from oblio client: ${
              error instanceof Error ? error.message : String(error)
            }`,
            error: error,
          },
        ],
        isError: true,
      };
    }
  });

  // Define useful prompts

  // 1. Create invoice prompt
  server.prompt(
    "createInvoice",
    {
      clientName: z.string(),
      clientCif: z.string(),
      productName: z.string(),
      productPrice: z.string(),
      quantity: z.string(),
    },
    (args, extra) => ({
      description: "Create an invoice document",
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
    })
  );

  // 2. Create proforma prompt
  server.prompt(
    "createProforma",
    {
      clientName: z.string(),
      clientCif: z.string(),
      productName: z.string(),
      productPrice: z.string(),
      quantity: z.string(),
    },
    (args, extra) => ({
      description: "Create a proforma document",
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
    })
  );

  // 3. Create notice (aviz) prompt
  server.prompt(
    "createNotice",
    {
      clientName: z.string(),
      clientCif: z.string(),
      productName: z.string(),
      productPrice: z.string(),
      quantity: z.string(),
    },
    (args, extra) => ({
      description: "Create a notice (aviz)",
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
    })
  );

  // 4. Get invoice prompt
  server.prompt(
    "getInvoice",
    {
      seriesName: z.string(),
      number: z.string(),
    },
    ({ seriesName, number }) => ({
      description: "Get an invoice document",
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
    })
  );

  // 5. Get proforma prompt
  server.prompt(
    "getProforma",
    {
      seriesName: z.string(),
      number: z.string(),
    },
    ({ seriesName, number }) => ({
      description: "Get a proforma document",
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
    })
  );

  // 6. Get notice (aviz) prompt
  server.prompt(
    "getNotice",
    {
      seriesName: z.string(),
      number: z.string(),
    },
    ({ seriesName, number }) => ({
      description: "Get a notice (aviz)",
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
    })
  );

  // 7. Cancel an invoice prompt
  server.prompt(
    "cancelInvoice",
    {
      seriesName: z.string(),
      number: z.string(),
    },
    ({ seriesName, number }) => ({
      description: "Cancel an invoice",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please cancel the invoice with type "invoice", series "${seriesName}", number "${number} and cancel "true".
            
            You can use the cancel_restore_document tool.`,
          },
        },
      ],
    })
  );

  // 8. Cancel an proforma prompt
  server.prompt(
    "cancelProforma",
    {
      seriesName: z.string(),
      number: z.string(),
    },
    ({ seriesName, number }) => ({
      description: "Cancel a proforma document",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please cancel the proforma with type "proforma", series "${seriesName}", number "${number}" and cancel "true".
            
            You can use the cancel_restore_document tool.`,
          },
        },
      ],
    })
  );

  // 9. Cancel an notice (aviz) prompt
  server.prompt(
    "cancelNotice",
    {
      seriesName: z.string(),
      number: z.string(),
    },
    ({ seriesName, number }) => ({
      description: "Cancel a notice (aviz)",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please cancel the notice (aviz) with type "notice", series "${seriesName}", number "${number}" and cancel "true".
            
            You can use the cancel_restore_document tool.`,
          },
        },
      ],
    })
  );

  // 10. Restore an invoice prompt
  server.prompt(
    "restoreInvoice",
    {
      seriesName: z.string(),
      number: z.string(),
    },
    ({ seriesName, number }) => ({
      description: "Restore an invoice document",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please restore the invoice with type "invoice", series "${seriesName}", number "${number}" and cancel "false".
              
              You can use the cancel_restore_document tool.`,
          },
        },
      ],
    })
  );

  // 11. Restore an proforma prompt
  server.prompt(
    "restoreProforma",
    {
      seriesName: z.string(),
      number: z.string(),
    },
    ({ seriesName, number }) => ({
      description: "Restore a proforma document",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please restore the proforma with type "proforma", series "${seriesName}", number "${number}" and cancel "false".
                
                You can use the cancel_restore_document tool.`,
          },
        },
      ],
    })
  );

  // 12. Restore an notice (aviz) prompt
  server.prompt(
    "restoreNotice",
    {
      seriesName: z.string(),
      number: z.string(),
    },
    ({ seriesName, number }) => ({
      description: "Restore a notice (aviz)",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please restore the notice (aviz) with type "notice", series "${seriesName}", number "${number}" and cancel "false".
                  
                  You can use the cancel_restore_document tool.`,
          },
        },
      ],
    })
  );

  // 13. Delete an invoice prompt
  server.prompt(
    "deleteInvoice",
    {
      seriesName: z.string(),
      number: z.string(),
    },
    ({ seriesName, number }) => ({
      description: "Delete an invoice document",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please delete the invoice with type "invoice", series "${seriesName}" and number "${number}".
                  
                  You can use the delete_document tool.`,
          },
        },
      ],
    })
  );

  // 14. Delete an proforma prompt
  server.prompt(
    "deleteProforma",
    {
      seriesName: z.string(),
      number: z.string(),
    },
    ({ seriesName, number }) => ({
      description: "Delete a proforma document",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please delete the proforma with type "proforma", series "${seriesName}" and number "${number}".
                  
                  You can use the delete_document tool.`,
          },
        },
      ],
    })
  );

  // 15. Delete notice (aviz) prompt
  server.prompt(
    "deleteNotice",
    {
      seriesName: z.string(),
      number: z.string(),
    },
    ({ seriesName, number }) => ({
      description: "Delete a notice (aviz)",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please delete the notice (aviz) with type "notice", series "${seriesName}" and number "${number}".

                  You can use the delete_document tool.`,
          },
        },
      ],
    })
  );

  // 16. Get products nomenclature prompt
  server.prompt(
    "getProductsNomenclature",
    {
      name: z.string().optional(),
      code: z.string().optional(),
      management: z.string().optional(),
      workStation: z.string().optional(),
      offset: z.string().optional(),
    },
    ({ name, code, management, workStation, offset }) => ({
      description: "Get products nomenclature",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please get the products nomenclature with the following details:
            
                  name: ${name}
                  code: ${code}
                  management: ${management}
                  workStation: ${workStation}
                  offset: ${offset}

                  You can use the get_nomenclatures tool with the type "product" to get the products nomenclature. The details above are filters and need to be written as key/value pairs. Make sure name or/and code is provided. Management, Work Station and Offset are optional.`,
          },
        },
      ],
    })
  );

  // 17. Get clients nomenclature prompt
  server.prompt(
    "getClientsNomenclature",
    {
      name: z.string().optional(),
      clientCif: z.string().optional(),
      offset: z.string().optional(),
    },
    ({ name, clientCif, offset }) => ({
      description: "Get clients nomenclature",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please get the clients nomenclature with the following details:
              
                    name: ${name}
                    clientCif: ${clientCif}
                    offset: ${offset}
  
                    You can use the get_nomenclatures tool with the type "clients" to get the clients nomenclature. The details above are filters and need to be written as key/value pairs. Make sure name or/and clientCif is provided. Offset is optional.`,
          },
        },
      ],
    })
  );

  // 18. Get VAT rates nomenclature prompt
  server.prompt("getVatRatesNomenclature", {}, () => ({
    description: "Get VAT rates nomenclature",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please get the VAT rates nomenclature for my company.
                 You can use the get_nomenclatures tool with the type "vat_rates" to get the vat rates nomenclature. No other filters are needed. The vat rates will be returned based on the company's settings.`,
        },
      },
    ],
  }));

  // 19. Get companies nomenclature prompt
  server.prompt("getCompaniesNomenclature", {}, () => ({
    description: "Get companies nomenclature",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please get the companies nomenclature for me.
               You can use the get_nomenclatures tool with the type "companies" to get the companies nomenclature. No other filters are needed. The companies will be returned based on the company's settings.`,
        },
      },
    ],
  }));

  // 20. Get document series nomenclature prompt
  server.prompt("getDocumentSeriesNomenclature", {}, () => ({
    description: "Get document series nomenclature",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please get the document series nomenclature for my company
                  You can use the get_nomenclatures tool with the type "series" to get the series nomenclature. No other filters are needed. The series will be returned based on the company's settings.`,
        },
      },
    ],
  }));

  // 21. Get languages nomenclature prompt
  server.prompt("getLanguagesNomenclature", {}, () => ({
    description: "Get languages nomenclature",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please get the languages nomenclature for my company
                 You can use the get_nomenclatures tool with the type "languages" to get the languages nomenclature. No other filters are needed. The series will be returned based on the company's settings.`,
        },
      },
    ],
  }));

  // 22. Get management (gestiuni) nomenclature prompt
  server.prompt("getManagementNomenclature", {}, () => ({
    description: "Get management (gestiuni) nomenclature",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please get the management (gestiuni) nomenclature for my company
                 You can use the get_nomenclatures tool with the type "management" to get the management nomenclature. No other filters are needed. The series will be returned based on the company's settings.`,
        },
      },
    ],
  }));

  // 23. Collect payment for invoice prompt
  server.prompt(
    "collectPayment",
    {
      invoiceSeriesName: z.string(),
      invoiceNumber: z.string(),
      type: z.union([
        z.literal("Chitanta"),
        z.literal("Bon fiscal"),
        z.literal("Alta incasare numerar"),
        z.literal("Ordin de plata"),
        z.literal("Mandat postal"),
        z.literal("Card"),
        z.literal("CEC"),
        z.literal("Bilet ordin"),
        z.literal("Alta incasare banca"),
      ]),
      seriesName: z.string(),
      documentNumber: z.string(),
      value: z.string(),
      mentions: z.string().optional(),
    },
    ({
      invoiceSeriesName,
      invoiceNumber,
      type,
      seriesName,
      documentNumber,
      value,
      mentions,
    }) => ({
      description: "Collect payment for invoice",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please collect the payment for the invoice with the following details:
              
                    seriesName: ${invoiceSeriesName}
                    number: ${invoiceNumber}
                    collect: {
                      type: ${type},
                      seriesName: ${seriesName},
                      documentNumber: ${documentNumber},
                      value: ${value},
                      mentions: ${mentions}
                    }
  
                    You can use the collect_payment tool to collect the payment. The details above are collect data and need to be written as key/value pairs. Make sure invoiceSeriesName, invoiceNumber and collect object is provided. Mentions is optional.`,
          },
        },
      ],
    })
  );

  // 24. Get invoice list prompt
  server.prompt(
    "getInvoiceList",
    {
      id: z.string().optional(),
      seriesName: z.string().optional(),
      number: z.string().optional(),
      issuedAfter: z.string().optional(),
      issuedBefore: z.string().optional(),
      cliendCif: z.string().optional(),
      draft: z.union([z.literal("0"), z.literal("1")]).optional(),
      canceled: z.union([z.literal("0"), z.literal("1")]).optional(),
      withProducts: z.union([z.literal("0"), z.literal("1")]).optional(),
      withEinvoiceStatus: z.union([z.literal("0"), z.literal("1")]).optional(),
      orderBy: z
        .union([
          z.literal("id"),
          z.literal("issueDate"),
          z.literal("issueDate"),
        ])
        .optional(),
      orderDir: z.union([z.literal("ASC"), z.literal("DESC")]).optional(),
      limitPerPage: z.string().optional(),
      offset: z.string().optional(),
    },
    ({
      id,
      seriesName,
      number,
      issuedAfter,
      issuedBefore,
      cliendCif,
      canceled,
      draft,
      withProducts,
      withEinvoiceStatus,
      orderBy,
      orderDir,
      limitPerPage,
      offset,
    }) => ({
      description: "Get invoice list",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please get the list of invoices with the following details:
            
                  id: ${id}
                  seriesName: ${seriesName}
                  number: ${number}
                  issuedAfter: ${issuedAfter}
                  issuedBefore: ${issuedBefore}
                  draft: ${draft}
                  canceled: ${canceled}
                  withProducts: ${withProducts}
                  withEinvoiceStatus: ${withEinvoiceStatus}
                  orderBy: ${orderBy}
                  orderDir: ${orderDir}
                  limitPerPage: ${limitPerPage}
                  offset: ${offset}
                  client:{
                    cif: ${cliendCif}
                  }

                  You can use the list_documents tool with the type "invoice" to get the list of invoices. The details above are filters and need to be written as key/value pairs. Make sure at least one filter is provided.`,
          },
        },
      ],
    })
  );

  // 25. Send invoice to SPV prompt
  server.prompt(
    "sendInvoiceToSpv",
    {
      seriesName: z.string().optional(),
      number: z.string().optional(),
    },
    ({ seriesName, number }) => ({
      description: "Send invoice to SPV",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Send invoice to SPV in order to create an einvoice with the following details:
              
                    seriesName: ${seriesName}
                    number: ${number}
  
                    You can use the create_einvoice tool to create the einvoice in SPV.`,
          },
        },
      ],
    })
  );

  // 26. Get einvoice from SPV prompt
  server.prompt(
    "getEinvoiceFromSpv",
    {
      seriesName: z.string().optional(),
      number: z.string().optional(),
    },
    ({ seriesName, number }) => ({
      description: "Get einvoice from SPV",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Get einvoice archive to SPV with the following details:
              
                  seriesName: ${seriesName}
                  number: ${number}

                  You can use the get_einvoice_archive tool to get the einvoices from SPV.`,
          },
        },
      ],
    })
  );

  // 27. Set oblio client cif prompt
  server.prompt(
    "setCif",
    {
      cif: z.string(),
    },
    ({ cif }) => ({
      description: "Set cif for all requests",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Set the cif for oblio client:
              
                  cif: ${cif}

                  You can use the set_cif tool.`,
          },
        },
      ],
    })
  );

  // 28. Get oblio client cif prompt
  server.prompt("getCif", {}, () => ({
    description: "Get cif used by the oblio client",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Get the cif for oblio client:

                You can use the get_cif tool.`,
        },
      },
    ],
  }));

  return server;
};
