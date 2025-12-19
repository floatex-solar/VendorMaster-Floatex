import PdfPrinter from "pdfmake";
import { getBase64Image } from "../utils/pdf-assets.js";

const fonts = {
  Roboto: {
    normal: "assets/fonts/Roboto-Regular.ttf",
    bold: "assets/fonts/Roboto-Medium.ttf",
    italics: "assets/fonts/Roboto-Italic.ttf",
  },
};

const printer = new PdfPrinter(fonts);

export function generateRfqPdfBuffer({ rfqNo, vendor, items }) {
  return new Promise((resolve, reject) => {
    const logoBase64 = getBase64Image("assets/logo.png");
    const today = new Date().toLocaleDateString("en-GB");

    const docDefinition = {
      pageSize: "A4",

      // 🔴 Increased top margin to allow bigger header
      pageMargins: [20, 160, 20, 60],

      defaultStyle: {
        fontSize: 9,
        lineHeight: 1,
      },

      /* ===========================
         HEADER (FUNCTION + REPEATS)
      ============================ */
      header: function () {
        return {
          margin: [20, 20, 20, 10],
          stack: [
            /* ---- Company + Logo + Title ---- */
            {
              columns: [
                {
                  width: "33%",
                  stack: [
                    { text: "FLOATEX SOLAR", style: "companyName" },
                    { text: "NIMS, 1st Floor, City Tower," },
                    { text: "Netaji Subhash Place," },
                    { text: "Pitampura, Delhi – 110034" },
                    { text: "Email: purchase@floatexsolar.com" },
                    { text: "Phone: +91 88086 86934" },
                  ],
                },
                {
                  width: "34%",
                  text: "REQUEST FOR QUOTATION",
                  style: "title",
                },
                {
                  width: "33%",
                  alignment: "right",
                  image: logoBase64,
                  fit: [90, 60],
                },
              ],
            },

            /* ---- RFQ + Vendor Details (NOW IN HEADER) ---- */
            {
              margin: [0, 15, 0, 0],
              columns: [
                {
                  width: "*",
                  stack: [
                    { text: "Vendor Details", bold: true },
                    { text: vendor.name, style: "vendorName" },
                    vendor.address && { text: vendor.address },
                    vendor.gst && { text: `GSTIN: ${vendor.gst}` },
                  ].filter(Boolean),
                },
                {
                  width: "auto",
                  stack: [
                    { text: `RFQ No: ${rfqNo}`, bold: true, color: "#17447B" },
                    { text: `RFQ Date: ${today}` },
                  ],
                  alignment: "right",
                },
              ],
            },
          ],
        };
      },

      /* ===========================
         FOOTER (REPEATS)
      ============================ */
      footer: function (currentPage, pageCount) {
        return {
          margin: [40, 10],
          columns: [
            {
              text: "This is a system generated RFQ.",
              fontSize: 8,
              color: "gray",
            },
            {
              text: `Page ${currentPage} of ${pageCount}`,
              alignment: "right",
              fontSize: 8,
              color: "gray",
            },
          ],
        };
      },

      /* ===========================
         CONTENT (TABLE ONLY)
      ============================ */
      content: [
        {
          table: {
            headerRows: 1,
            widths: [30, "*", 50, 50],
            body: [
              [
                { text: "#", style: "tableHeader" },
                { text: "Item Description", style: "tableHeader" },
                { text: "Qty", style: "tableHeader" },
                { text: "UOM", style: "tableHeader" },
              ],

              ...items.map((i, idx) => [
                idx + 1,
                {
                  stack: [
                    { text: i.description },
                    i.customDescription
                      ? {
                          text: i.customDescription,
                          italics: true,
                          color: "#555555",
                          margin: [10, 2, 0, 0],
                        }
                      : "",
                  ],
                },
                { text: i.qty },
                { text: i.uom },
              ]),
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#aaaaaa",
            vLineColor: () => "#aaaaaa",
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 4,
            paddingBottom: () => 4,
          },
        },

        {
          text: "\nKindly provide your quotation at the earliest.\n\nRegards,\nProcurement Team\nEmail: purchase@floatexsolar.com\nPhone: +91 88086 86934",
          margin: [0, 20, 0, 0],
          fontSize: 10,
        },
      ],

      /* ===========================
         STYLES
      ============================ */
      styles: {
        companyName: {
          fontSize: 15,
          bold: true,
          color: "#17447B",
        },
        vendorName: {
          fontSize: 13,
          bold: true,
        },
        title: {
          fontSize: 12,
          bold: true,
          alignment: "center",
          color: "#17447B",
        },
        tableHeader: {
          bold: true,
          fillColor: "#eeeeee",
          fontSize: 10,
        },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    const chunks = [];
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
    pdfDoc.on("error", reject);

    pdfDoc.end();
  });
}
