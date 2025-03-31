import { z } from "zod";

export const createDocumentValidation = {
  type: z.union([
    z.literal("invoice"),
    z.literal("proforma"),
    z.literal("notice"),
  ]),
  data: z.object({
    cif: z.string(),
    client: z.object({
      cif: z.string(),
      name: z.string(),
      rc: z.string().optional(),
      code: z.string().optional(),
      address: z.string().optional(),
      state: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      iban: z.string().optional(),
      bank: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      contact: z.string().optional(),
      vatPayer: z.union([z.literal(0), z.literal(1)]).optional(),
      save: z.union([z.literal(0), z.literal(1)]).optional(),
      autocomplete: z.union([z.literal(0), z.literal(1)]).optional(),
    }),
    issueDate: z.string(),
    dueDate: z.string().optional(),
    deliveryDate: z.string().optional(),
    collectDate: z.string().optional(),
    seriesName: z.string(),
    disableAutoSeries: z.union([z.literal(0), z.literal(1)]).optional(),
    number: z.number().optional(),
    collect: z
      .object({
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
        seriesName: z.string().optional(),
        documentNumber: z.string().optional(),
        value: z.number().optional(),
        issueDate: z.date().optional(),
        mentions: z.string().optional(),
      })
      .optional(),
    referenceDocument: z
      .object({
        type: z.union([
          z.literal("Factura"),
          z.literal("Proforma"),
          z.literal("Aviz"),
        ]),
        seriesName: z.string(),
        number: z.number(),
        refund: z.union([z.literal(0), z.literal(1)]), // only for "Factura" type
      })
      .optional(),
    language: z.string().optional(),
    precision: z.number().optional(),
    currency: z.string().optional(),
    exchangeRate: z.number().optional(),
    products: z.array(
      z.object({
        name: z.string(),
        code: z.string().optional(),
        description: z.string().optional(),
        price: z.string(),
        measuringUnit: z.string(),
        currency: z.string().optional(),
        exchangeRate: z.number().optional(),
        vatName: z.string().optional(),
        vatPercentage: z.number().optional(),
        vatIncluded: z.union([z.literal(0), z.literal(1)]).optional(),
        quantity: z.number().optional(),
        management: z.string().optional(),
        nameTranslation: z.string().optional(),
        measuringUnitTranslation: z.string().optional(),
        save: z.union([z.literal(0), z.literal(1)]).optional(),
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
          .optional(),
      }),
      z
        .object({
          name: z.string(),
          discountType: z
            .union([z.literal("procentual"), z.literal("valoric")])
            .optional(),
          discount: z.number(),
          discountAllAbove: z.union([z.literal(0), z.literal(1)]).optional(),
        })
        .optional()
    ),
    issuerName: z.string().optional(),
    issuerId: z.string().optional(),
    noticeNumber: z.string().optional(),
    internalNote: z.string().optional(),
    deputyName: z.string().optional(),
    deputyIdentityCard: z.string().optional(),
    deputyAuto: z.string().optional(),
    selesAgent: z.string().optional(),
    mentions: z.string().optional(),
    workStation: z.string().optional(),
    sendEmail: z.union([z.literal(0), z.literal(1)]).optional(),
    contractNumber: z.string().optional(),
    receptionNotice: z.string().optional(),
    projectNumber: z.string().optional(),
    buyerIdentifier: z.string().optional(),
    clientAccountReference: z.string().optional(),
    useStock: z.union([z.literal(0), z.literal(1)]).optional(),
  }),
};
