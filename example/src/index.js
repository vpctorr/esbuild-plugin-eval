import { jsonSchema } from './schema.eval'

export default {
  async fetch() {
    return new Response(
      JSON.stringify(jsonSchema),
      { headers: { 'content-type': 'application/schema+json' } },
    )
  },
}
