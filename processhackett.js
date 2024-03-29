const fs = require('fs');
const PropertiesReader = require('properties-reader');

const outputDir = './pdf-output/'

const getDirectories = source =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

const dirs = getDirectories("./pdf-output")

//console.log(dirs)

const PAGE_REGEX = /_pp([0-9]{4}).txt/

const toProcess = []

dirs.forEach (dir => {

  const baseName = dir
  const ocrName = baseName + "_ocr_pp"

  const propFile = outputDir+dir+"/"+'fields.properties'
  console.log("Looking for prop file: "+propFile)
  const customProperties = fs.existsSync(propFile) ? PropertiesReader(outputDir+dir+"/"+'fields.properties').getAllProperties() : null
  console.log(customProperties)

  console.log("Processing " + baseName)

  const ocrFiles = fs.readdirSync(outputDir+dir, { withFileTypes: true })
    .filter(dirent => dirent.isFile() && dirent.name.endsWith(".txt") && dirent.name.startsWith(ocrName))
    .map(dirent => {
      const matches = PAGE_REGEX.exec(dirent.name)
      const text = fs.readFileSync(outputDir+dir+"/"+dirent.name,"utf8")
      //console.log(text)
      return {
        name: dirent.name,
        dirent: dirent,
        page: parseInt(matches[1]),
        text: text,
        customProperties: customProperties
      }
    })

  toProcess.push({
    baseName: baseName,
    ocrName: ocrName,
    ocrFiles: ocrFiles
  })
})

//console.log(toProcess)

const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  node: 'http://127.0.0.1:9200'
})

const INDEX = 'tibetan_pdfs'

async function run () {

  for (const next of toProcess) {
    const baseName = next.baseName
    const files = next.ocrFiles
    for (const nextFile of files) {
        console.log(`Processing ${baseName} - ${nextFile.name}`)
        const id = nextFile.name.replace(".txt","")
        const exists = false //await client.exists({ id, index:INDEX })
        if (!exists) {
          const document = {
            ocr: true,
            text: nextFile.text,
            fileName: nextFile.name,
            baseName: baseName,
            page: nextFile.page,
            ...nextFile.customProperties
          }
          console.log("customProperties: ", next.customProperties)
          console.log("document: ", document)
          await client.index({
            index: INDEX,
            id,
            document
          })
          console.log(`- id ${id} created`)
        }
        else {
          console.log(`- id ${id} already exists`)
        }
    }

  }

}

run().catch(console.log)
