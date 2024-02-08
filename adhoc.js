const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  node: 'http://127.0.0.1:9200'
})

const INDEX = 'tibetan_pdfs'
async function run () {

/*

  await client.deleteByQuery({
    index:'lrztp',
    query: {
      match: {
        title: "Hackett Verb Lexicon Vol. 2"
      }
    }
  })

  let result = await client.updateByQuery({
      index: 'tibetan_pdfs',
      refresh: true,
      script: {
        lang: 'painless',
        source: 'ctx._source["numpages"] = "513"'
      },
      query: {
        match: {
          title: 'Hackett Verb Lexicon Vol. 2'
        }
      }
    })

  console.log(JSON.stringify(result))
*/
  let result = await client.search({
    index: 'tibetan_pdfs',
    query: { match_all: {} }
  })

  console.log(result.hits.hits)

}
run().catch(console.log)
