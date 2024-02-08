/*
node create-index http://localhost:3000
- indexes should already be deleted or not exist before creation
*/

if (process.argv.length === 2) {
  console.error('Expected at least one argument!');
  process.exit(1);
}

const elasticsearchUri = process.argv[2]

console.log("elasticsearchUri = " + elasticsearchUri)

const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  node: elasticsearchUri
})

async function indexExists(name) {
  return await client.indices.exists({index: name})
}

async function deleteIndex(name) {
  if (await client.indices.exists({index: name})) {
    console.log("Deleting index "+name)
    const result = await client.indices.delete({index: name})
    console.log(JSON.stringify(result,null,2))
  }
  else {
    console.log(`Index ${name} does not exist`)
  }
}

async function run () {

  if (await indexExists('lrztp')) {
    console.log('Index lrztp exists!')
    process.exit(1);
  }

  const lzrtpIndexConfig = {
    index: 'lrztp',
    mappings: {
      properties: {
        id: { type: 'keyword' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
        text: { type: 'text', term_vector: 'with_positions_offsets' },
        module: { type: 'integer' },
        lesson: { type: 'integer' },
        tags: { type: 'keyword' },
        ocr: { type: 'boolean'},
        fileName: { type: 'text'},
        baseName: { type: 'text'},
        numpages: {type: 'integer'}
      },
    },
    settings: {
      number_of_shards:1,
      number_of_replicas:0,
    }
  }
  console.log("Creating index: ", JSON.stringify(lzrtpIndexConfig,null,2))
  let result = await client.indices.create(lzrtpIndexConfig);
  console.log(JSON.stringify(result,null,2))

  if (await indexExists('tibetan_pdfs')) {
    console.log('Index tibetan_pdfs exists!')
    process.exit(1);
  }

  const tibetanPdfsIndexConfig = {
    index: 'tibetan_pdfs',
    mappings: {
      properties: {
        id: { type: 'keyword' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
        text: { type: 'text', term_vector: 'with_positions_offsets' },
        tags: { type: 'keyword' },
        ocr: { type: 'boolean'},
        fileName: { type: 'text'},
        baseName: { type: 'text'},
        title: { type: 'text'},
        author: { type: 'text'},
        loadByPages: {type: 'boolean'},
        numPages: {type: 'integer'}
      },
    },
    settings: {
      number_of_shards:1,
      number_of_replicas:0,
    }
  }
  console.log("Creating index: ", JSON.stringify(tibetanPdfsIndexConfig,null,2))
  result = await client.indices.create(tibetanPdfsIndexConfig);
  console.log(JSON.stringify(result,null,2))

}

run().catch(console.log)
