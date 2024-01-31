

const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  node: 'http://127.0.0.1:9200'
})

const INDEX = 'lrztp'

async function run () {
  // Let's search!
  const result = await client.search({
    index: INDEX,
    highlight: {
      "fields": {
        "text": {}
      }
    },
    query: {
      match: {
        text: 'father'
      }
    }
  })

  console.log(result.hits.hits)

}

run().catch(console.log)
