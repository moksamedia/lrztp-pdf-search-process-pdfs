const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  node: 'http://127.0.0.1:9200'
})

const INDEX = 'lrztp'

async function run () {

  if (await client.indices.exists({index: INDEX})) {
    await client.indices.delete({index: INDEX})
    console.log("Deleting index "+INDEX)
  }

  const indexConfig = {
    index: INDEX,
    mappings: {
      properties: {
        id: { type: 'keyword' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
        text: { type: 'text'},
        module: { type: 'integer' },
        lesson: { type: 'integer' },
        tags: { type: 'keyword' },
        ocr: { type: 'boolean'},
        fileName: { type: 'text'},
        baseName: { type: 'text'}
      },
    },
    settings: {}
  }
  console.log("Creating index: ", JSON.stringify(indexConfig,null,2))
  await client.indices.create(indexConfig);
}

run().catch(console.log)
