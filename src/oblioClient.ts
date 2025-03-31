import OblioApi from "@obliosoftware/oblioapi";

let oblio: OblioApi | null = null;

const getOblioClient = () => {
  if (!oblio) {
    oblio = new OblioApi(
      process.env.OBLIO_API_EMAIL || "",
      process.env.OBLIO_API_SECRET || ""
    );
  }
  oblio.setCif(process.env.CIF || "");
  return oblio;
};

export const oblioClient = getOblioClient();
