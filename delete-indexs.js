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
  await deleteIndex('lrztp')
  await deleteIndex('tibetan_pdfs')
}

run().catch(console.log)
