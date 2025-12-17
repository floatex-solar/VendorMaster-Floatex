import PdfPrinter from "pdfmake";

const fonts = {
  Roboto: {
    normal: "assets/fonts/Roboto-Regular.ttf",
    bold: "assets/fonts/Roboto-Medium.ttf",
  },
};

const printer = new PdfPrinter(fonts);

export function generateRfqPdfBuffer({ rfqNo, vendor, items }) {
  return new Promise((resolve, reject) => {
    const docDefinition = {
      content: [
        { text: "REQUEST FOR QUOTATION", style: "header" },
        { text: `RFQ No: ${rfqNo}` },
        { text: `Vendor: ${vendor.name}` },
        { text: "\n" },
        {
          table: {
            widths: ["auto", "*", "auto", "auto"],
            body: [
              ["#", "Item Description", "Qty", "UOM"],
              ...items.map((i, idx) => [
                idx + 1,
                `${i.description}\n${i.customDescription || ""}`,
                i.qty,
                i.uom,
              ]),
            ],
          },
        },
      ],
      styles: {
        header: { fontSize: 16, bold: true },
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

// import PdfPrinter from "pdfmake";

// const fonts = {
//   Roboto: {
//     normal: "assets/fonts/Roboto-Regular.ttf",
//     bold: "assets/fonts/Roboto-Medium.ttf",
//   },
// };

// const printer = new PdfPrinter(fonts);

// export function generateRfqPdfBuffer({ rfqNo, vendor, items }) {
//   return new Promise((resolve, reject) => {
//     const docDefinition = {
//       content: [
//         { text: "REQUEST FOR QUOTATION", style: "header" },
//         { text: `RFQ No: ${rfqNo}` },
//         { text: `Vendor: ${vendor.vendorName}` },
//         { text: "\n" },
//         {
//           table: {
//             widths: ["auto", "*", "auto", "auto"],
//             body: [
//               ["#", "Item Description", "Qty", "UOM"],
//               ...items.map((i, idx) => [
//                 idx + 1,
//                 `${i.description}\n${i.customDescription || ""}`,
//                 i.qty,
//                 i.uom,
//               ]),
//             ],
//           },
//         },
//       ],
//       styles: {
//         header: { fontSize: 16, bold: true },
//       },
//     };

//     const pdfDoc = printer.createPdfKitDocument(docDefinition);

//     const chunks = [];
//     pdfDoc.on("data", (chunk) => chunks.push(chunk));
//     pdfDoc.on("end", () => {
//       const buffer = Buffer.concat(chunks);
//       resolve(buffer);
//     });
//     pdfDoc.on("error", reject);

//     pdfDoc.end();
//   });
// }
