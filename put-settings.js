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


async function run () {

  await client.indices.close({ index: ['lrztp','tibetan_pdfs'] })

  let result = await client.indices.putSettings({
    index: ['lrztp','tibetan_pdfs'],
    settings: {
      number_of_shards:1,
      number_of_replicas:0
    }
  })

  console.log(JSON.stringify(result, null, 2))

  await client.indices.open({ index: ['lrztp','tibetan_pdfs'] })

}

run().catch(console.log)
