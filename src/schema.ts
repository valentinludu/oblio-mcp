import { z } from "zod";

const boolFlag = z.union([z.literal(0), z.literal(1)]);

const collectTypeSchema = z.union([
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
]);

export const collectSchema = z.object({
  type: collectTypeSchema.describe(
    'Payment method. E.g. "Chitanta", "Ordin de plata", "Card", "Bon fiscal", etc.'
  ),
  seriesName: z
    .string()
    .optional()
    .describe("Receipt series name (required when type is Chitanta)"),
  documentNumber: z
    .string()
    .optional()
    .describe("Payment document number (required when type is not Chitanta)"),
  value: z
    .number()
    .optional()
    .describe("Amount paid. Defaults to the invoice total if omitted"),
  issueDate: z
    .string()
    .optional()
    .describe("Payment date in YYYY-MM-DD format. Defaults to today"),
  mentions: z.string().optional().describe("Payment notes / mentions"),
});

export const createDocumentInputSchema = {
  type: z
    .union([
      z.literal("invoice"),
      z.literal("proforma"),
      z.literal("notice"),
    ])
    .describe(
      'Document type to create: "invoice" (factura), "proforma", or "notice" (aviz)'
    ),
  data: z.object({
    cif: z
      .string()
      .describe(
        "Your company CIF (tax identification number), e.g. RO37311090"
      ),
    client: z
      .object({
        cif: z
          .string()
          .optional()
          .describe("Client CIF or CNP (for individuals)"),
        name: z.string().describe("Client company name or person name"),
        rc: z
          .string()
          .optional()
          .describe("Trade Register number (Registru Comert)"),
        code: z.string().optional().describe("Internal client code"),
        address: z.string().optional().describe("Client address"),
        state: z.string().optional().describe("County (Judet)"),
        city: z.string().optional().describe("City"),
        country: z.string().optional().describe("Country"),
        iban: z.string().optional().describe("Client IBAN"),
        bank: z.string().optional().describe("Client bank name"),
        email: z.string().optional().describe("Client email address"),
        phone: z.string().optional().describe("Client phone number"),
        contact: z.string().optional().describe("Contact person name"),
        vatPayer: boolFlag
          .optional()
          .describe("1 if client is a VAT payer, 0 otherwise"),
        save: boolFlag
          .optional()
          .describe("1 to update client data in Oblio, 0 to keep existing. Default 0"),
        autocomplete: boolFlag
          .optional()
          .describe(
            "1 to auto-fill client data from Romanian registries using CIF. Default 0"
          ),
      })
      .describe("Client (customer) details"),
    issueDate: z
      .string()
      .describe("Issue date in YYYY-MM-DD format. Defaults to today"),
    dueDate: z
      .string()
      .optional()
      .describe("Due date in YYYY-MM-DD format"),
    deliveryDate: z
      .string()
      .optional()
      .describe("Delivery date in YYYY-MM-DD format (invoices only)"),
    collectDate: z
      .string()
      .optional()
      .describe("Collection date in YYYY-MM-DD format (invoices only)"),
    seriesName: z
      .string()
      .describe(
        "Document series name (e.g. FCT, PR). Use get_nomenclatures with type 'series' to list available series"
      ),
    disableAutoSeries: boolFlag
      .optional()
      .describe("1 to disable automatic numbering. Default 0"),
    number: z
      .number()
      .optional()
      .describe(
        "Manual document number. Only used when disableAutoSeries is 1"
      ),
    collect: collectSchema
      .optional()
      .describe("Inline payment collection when creating the document"),
    referenceDocument: z
      .object({
        type: z
          .union([
            z.literal("Factura"),
            z.literal("Proforma"),
            z.literal("Aviz"),
          ])
          .describe(
            "Reference document type: Factura (invoice), Proforma, or Aviz (notice)"
          ),
        seriesName: z
          .string()
          .describe("Series name of the reference document"),
        number: z.number().describe("Number of the reference document"),
        refund: boolFlag.describe(
          "1 to refund/reverse the associated payment (only for type Factura)"
        ),
      })
      .optional()
      .describe(
        "Reference document for creating an invoice based on a proforma, notice, or for reversing another invoice"
      ),
    language: z
      .string()
      .optional()
      .describe(
        'Language code for the document (e.g. "RO", "EN"). Default is "RO"'
      ),
    precision: z
      .number()
      .optional()
      .describe("Decimal precision (2-4). Default is 2"),
    currency: z
      .string()
      .optional()
      .describe('Document currency code (e.g. "RON", "EUR"). Default is "RON"'),
    exchangeRate: z
      .number()
      .optional()
      .describe("Exchange rate for foreign currency documents"),
    products: z
      .array(
        z.union([
          z.object({
            name: z.string().describe("Product or service name"),
            code: z.string().optional().describe("Product code / SKU"),
            description: z
              .string()
              .optional()
              .describe("Product description"),
            price: z.string().describe("Unit price"),
            measuringUnit: z
              .string()
              .describe('Unit of measure (e.g. "buc", "kg", "ora"). Default "buc"'),
            currency: z.string().optional().describe("Product-level currency override"),
            exchangeRate: z
              .number()
              .optional()
              .describe("Product-level exchange rate override"),
            vatName: z
              .string()
              .optional()
              .describe('VAT rate name from nomenclature (e.g. "Normala", "Redusa")'),
            vatPercentage: z
              .number()
              .optional()
              .describe("VAT percentage (e.g. 19, 9, 0)"),
            vatIncluded: boolFlag
              .optional()
              .describe("1 if price includes VAT, 0 if not. Default 1"),
            quantity: z.number().optional().describe("Quantity. Default 1"),
            management: z
              .string()
              .optional()
              .describe(
                "Stock management name (gestiune). Only for stockable products when stock is enabled"
              ),
            nameTranslation: z
              .string()
              .optional()
              .describe("Translated product name for foreign-language documents"),
            measuringUnitTranslation: z
              .string()
              .optional()
              .describe("Translated measuring unit for foreign-language documents"),
            save: boolFlag
              .optional()
              .describe("1 to save the list price in Oblio. Default 1"),
            productType: z
              .union([
                z.literal("Marfa"),
                z.literal("Materii prime"),
                z.literal("Materiale consumabile"),
                z.literal("Semifabricate"),
                z.literal("Produs finit"),
                z.literal("Produs rezidual"),
                z.literal("Produse agricole"),
                z.literal("Animale si pasari"),
                z.literal("Ambalaje"),
                z.literal("Obiecte de inventar"),
                z.literal("Serviciu"),
              ])
              .optional()
              .describe(
                "Product type classification. Only relevant when stock is enabled"
              ),
          }),
          z.object({
            name: z
              .string()
              .describe("Discount label shown on the document"),
            discountType: z
              .union([z.literal("procentual"), z.literal("valoric")])
              .optional()
              .describe(
                '"procentual" for percentage discount, "valoric" for fixed amount. Default "valoric"'
              ),
            discount: z.number().describe("Discount value"),
            discountAllAbove: boolFlag
              .optional()
              .describe(
                "1 to apply to all preceding products without a discount, 0 for only the product directly above. Default 0"
              ),
          }),
        ])
      )
      .describe("Array of products/services and optional discount lines"),
    issuerName: z
      .string()
      .optional()
      .describe("Name of the person who issued the document (Intocmit de)"),
    issuerId: z
      .string()
      .optional()
      .describe("CNP of the person who issued the document"),
    noticeNumber: z
      .string()
      .optional()
      .describe("Accompanying notice number (Nr. aviz insotire)"),
    internalNote: z
      .string()
      .optional()
      .describe("Internal note (not visible to the client)"),
    deputyName: z.string().optional().describe("Delegate name (Delegat)"),
    deputyIdentityCard: z
      .string()
      .optional()
      .describe("Delegate identity card"),
    deputyAuto: z.string().optional().describe("Delegate vehicle"),
    selesAgent: z.string().optional().describe("Sales agent name"),
    mentions: z
      .string()
      .optional()
      .describe("Public mentions shown on the document"),
    workStation: z
      .string()
      .optional()
      .describe('Work station / branch (Punct de lucru). Default "Sediu"'),
    sendEmail: boolFlag
      .optional()
      .describe("1 to send the document by email to the client"),
    orderNumber: z
      .string()
      .optional()
      .describe("Order number (BT-13)"),
    contractNumber: z
      .string()
      .optional()
      .describe("Contract number (BT-12)"),
    receptionNotice: z
      .string()
      .optional()
      .describe("Project reference (BT-11)"),
    projectNumber: z
      .string()
      .optional()
      .describe("Buyer identifier (BT-46)"),
    buyerIdentifier: z
      .string()
      .optional()
      .describe("Reception notice number (BT-15)"),
    clientAccountReference: z
      .string()
      .optional()
      .describe("Buyer accounting reference (BT-19)"),
    useStock: boolFlag
      .optional()
      .describe(
        "1 to deduct from stock when creating the document. Only for invoices and notices when stock is enabled"
      ),
    spvExtern: boolFlag
      .optional()
      .describe(
        "1 to automatically send the invoice to SPV (e-Factura) if auto-send is enabled in Oblio settings. Invoices only"
      ),
    idempotencyKey: z
      .string()
      .optional()
      .describe("Unique key to prevent duplicate document creation"),
  }),
};
