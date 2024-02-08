
const fs = require('fs');
const PropertiesReader = require('properties-reader');

const outputDir = './pdf-output/'

const getDirectories = source =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

const indexDirs = getDirectories("./pdf-output")

const PAGE_REGEX = /_pp([0-9]{4}).txt/

const toProcess = []

// pdf-output/<index name>
// -- pdf-output should contain directories with index names, and
//    inside that, files ready to be loaded into the ea index
indexDirs.forEach (indexDir => {

  const indexName = indexDir
  console.log("indexName = " + indexName)

  // get the directories under the index directory
  const dirs = getDirectories("./pdf-output/"+indexDir)

  // each dir here is a processed file directory ready to be loaded into ea
  dirs.forEach (dir => {

    const baseName = dir
    const ocrName = baseName + "_ocr_pp"
    const rawName = baseName + "_pp"

    const index = indexName
    console.log(`index=${index}`)

    // what is the procssing directory for this index and file dir
    const processingDirectory = outputDir+indexDir+"/"+dir+"/"
    console.log('processingDirectory='+processingDirectory)
    const propFile = processingDirectory+'fields.properties'

    // load the prop file
    console.log("Looking for prop file: "+propFile)
    const customProperties = fs.existsSync(propFile) ? PropertiesReader(processingDirectory+'fields.properties').getAllProperties() : null
    if (customProperties.index) delete customProperties.index
    if (customProperties.numpages) delete customProperties.numpages
    console.log("Processing " + baseName)
    console.log("customProperties:", customProperties)

    let ocrFiles = fs.readdirSync(processingDirectory, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith(".txt") && dirent.name.startsWith(ocrName));

    const numOcrPages = ocrFiles.length

    ocrFiles = ocrFiles.map(dirent => {
        const matches = PAGE_REGEX.exec(dirent.name)
        const text = fs.readFileSync(processingDirectory+dirent.name,"utf8")
        //console.log(text)
        return {
          name: dirent.name,
          dirent: dirent,
          page: parseInt(matches[1]),
          text: text,
          numPages: numOcrPages,
          customProperties: customProperties,
          index: index
        }
      })

    let rawFiles = fs.readdirSync(processingDirectory, { withFileTypes: true })
        .filter(dirent => dirent.isFile() && dirent.name.endsWith(".txt") && dirent.name.startsWith(rawName))

    const numRawPages = rawFiles.length

    rawFiles = rawFiles.map(dirent => {
        const matches = PAGE_REGEX.exec(dirent.name)
        const text = fs.readFileSync(processingDirectory+dirent.name,"utf8")
        //console.log(text)
        return {
          name: dirent.name,
          dirent: dirent,
          page: parseInt(matches[1]),
          text: text,
          numpages: numRawPages,
          customProperties: customProperties,
          index: index
        }
      })

    toProcess.push({
      baseName: baseName,
      ocrName: ocrName,
      rawFiles: rawFiles,
      ocrFiles: ocrFiles,
      index,
      customProperties
    })
  })
})

//console.log(toProcess)

const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  node: 'http://127.0.0.1:9200'
})

const INDEX = 'lrztp'

function assert(value) {
  if (!value) {
    throw new Error("Assert failed!")
    process.exit(1)
  }
}

async function run () {

  for (const next of toProcess) {
    const baseName = next.baseName
    const files = next.ocrFiles
    assert(next.index)
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
            numPages: nextFile.numPages,
            ...nextFile.customProperties
          }
          console.log("customProperties: ", next.customProperties)
          console.log("document: ", document)
          await client.index({
            index: next.index,
            id,
            document
          })
          console.log(`- id ${id} created`)
        }
        else {
          console.log(`- id ${id} already exists`)
        }
    }

    const rawFiles = next.rawFiles
    for (const nextFile of rawFiles) {
        console.log(`Processing ${baseName} - ${nextFile.name}`)
        const id = nextFile.name.replace(".txt","")
        const exists = false //await client.exists({ id, index:INDEX })
        if (!exists) {
          await client.index({
            index: next.index,
            id: id,
            document: {
              ocr: false,
              text: nextFile.text,
              fileName: nextFile.name,
              baseName: baseName,
              page: nextFile.page,
              numPages: nextFile.numPages,
              ...nextFile.customProperties
            }
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
