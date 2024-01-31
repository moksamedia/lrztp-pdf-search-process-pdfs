const fs = require('fs');

const outputDir = './pdf-output/'

const getDirectories = source =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

const dirs = getDirectories("./pdf-output")

console.log(dirs)

const PAGE_REGEX = /_pp([0-9]{4}).txt/

const toProcess = []

dirs.forEach (dir => {
  const baseName = dir
  const ocrName = baseName + "_ocr_pp"
  const rawName = baseName + "_pp"

  console.log("Processing " + baseName)

  const ocrFiles = fs.readdirSync(outputDir+dir, { withFileTypes: true })
    .filter(dirent => dirent.isFile() && dirent.name.endsWith(".txt") && dirent.name.startsWith(ocrName))
    .map(dirent => {
      const matches = PAGE_REGEX.exec(dirent.name)
      const text = fs.readFileSync(outputDir+dir+"/"+dirent.name,"utf8")
      console.log(text)
      return {
        name: dirent.name,
        dirent: dirent,
        page: parseInt(matches[1]),
        text: text
      }
    })

  const rawFiles = fs.readdirSync(outputDir+dir, { withFileTypes: true })
    .filter(dirent => dirent.isFile() && dirent.name.endsWith(".txt") && dirent.name.startsWith(rawName))
    .map(dirent => {
      const matches = PAGE_REGEX.exec(dirent.name)
      const text = fs.readFileSync(outputDir+dir+"/"+dirent.name,"utf8")
      console.log(text)
      return {
        name: dirent.name,
        dirent: dirent,
        page: parseInt(matches[1]),
        text: text
      }
    })

  toProcess.push({
    baseName: baseName,
    ocrName: ocrName,
    rawFiles: rawFiles,
    ocrFiles: ocrFiles
  })
})

console.log(toProcess)

const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  node: 'http://127.0.0.1:9200'
})

const INDEX = 'lrztp'

async function run () {

  for (const next of toProcess) {
    const baseName = next.baseName
    const files = next.ocrFiles
    for (const nextFile of files) {
        console.log(`Processing ${baseName} - ${nextFile.name}`)
        const id = nextFile.name.replace(".txt","")
        const exists = await client.exists({ id, index:INDEX })
        if (!exists) {
          await client.index({
            index: INDEX,
            id: id,
            document: {
              ocr: true,
              text: nextFile.text,
              fileName: nextFile.name,
              baseName: baseName,
              page: nextFile.page
            }
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
        const exists = await client.exists({ id, index:INDEX })
        if (!exists) {
          await client.index({
            index: INDEX,
            id: id,
            document: {
              ocr: false,
              text: nextFile.text,
              fileName: nextFile.name,
              baseName: baseName,
              page: nextFile.page
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
