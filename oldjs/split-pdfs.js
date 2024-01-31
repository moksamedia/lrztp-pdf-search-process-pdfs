const fs = require('fs');
const PDFDocument = require('pdf-lib').PDFDocument;

const toProcessDir = './pdf-to-process/'
const outputDir = './pdf-output/'

async function splitPdf(fileName) {

    let baseName = fileName.replace(".pdf","")
    let pathToPdf = toProcessDir+fileName

    const docmentAsBytes = await fs.promises.readFile(pathToPdf);

    // Load your PDFDocument
    const pdfDoc = await PDFDocument.load(docmentAsBytes)

    const numberOfPages = pdfDoc.getPages().length;

    for (let i = 0; i < numberOfPages; i++) {

        // Create a new "sub" document
        const subDocument = await PDFDocument.create();
        // copy the page at current index
        const [copiedPage] = await subDocument.copyPages(pdfDoc, [i])
        subDocument.addPage(copiedPage);
        const pdfBytes = await subDocument.save()
        await writePdfBytesToFile(`${outputDir}${baseName}--pp${i + 1}.pdf`, pdfBytes);

    }
}

function writePdfBytesToFile(fileName, pdfBytes) {
    return fs.promises.writeFile(fileName, pdfBytes);
}

(async () => {
  fs.readdirSync(toProcessDir).forEach( async file => {
    if(/\.pdf$/gm.test(file))
    {
      console.log(file);
      await splitPdf(file);
    }
  });
})();
