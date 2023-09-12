# esbuild-plugin-eval

This is an esbuild plugin that evaluates a module before importing it. It's useful in cases where you want to render static parts of your application at build time to prune runtime dependencies, such as pre-rendering html from JSX, or pre-calculating CSP header hashes.

A best effort is made to properly handle function exports, but keep in mind that all variables accessed from exported functions will need to be exported as well.

So this won't work:

```js
// hello.js
let message = 'Hello, world!'
export default () => console.log(message)
```

But this will:

```js
// hello.js
export let message = 'Hello, world!'
export default () => console.log(message)
```

## Usage

When added to esbuild's `plugins` option, this plugin will evaluate any imported module with `eval` in the query string of its path. It does this by bundling the module into a data url, dynamically importing it, and then re-exporting the results.

In the provided example, the following file:

```js
// example/src/index.js
import { jsonSchema } from './schema.eval'

export default {
  async fetch() {
    return new Response(
      JSON.stringify(jsonSchema),
      { headers: { 'content-type': 'application/schema+json' } },
    )
  },
}

// example/src/schema.eval.js
import { z } from 'https://esm.sh/zod@3'
import { zodToJsonSchema } from 'https://esm.sh/zod-to-json-schema@3'

const mySchema = z
  .object({
    myString: z.string().min(5),
    myUnion: z.union([z.number(), z.boolean()]),
  })
  .describe('My neat object schema')

export const jsonSchema = zodToJsonSchema(mySchema, 'mySchema')
```

is bundled via the code like the following:

```js
import { build } from 'esbuild'
import evalPlugin from 'esbuild-plugin-eval'

const outfile = 

await build({
  bundle: true,
  format: 'esm',
  entryPoints: ['./example/src/index.js'],
  outfile: './example/build/worker.js',
  plugins: [evalPlugin],
})
```

to create the following:

```js
var jsonSchema = { "$ref": "#/definitions/mySchema", "definitions": { "mySchema": { "type": "object", "properties": { "myString": { "type": "string", "minLength": 5 }, "myUnion": { "type": ["number", "boolean"] } }, "required": ["myString", "myUnion"], "additionalProperties": false, "description": "My neat object schema" } }, "$schema": "http://json-schema.org/draft-07/schema#" };

var src_default = {
  async fetch() {
    return new Response(
      JSON.stringify(jsonSchema),
      { headers: { "content-type": "application/schema+json" } }
    );
  }
};
export {
  src_default as default
};
```

In this case, we generate JSON schema at build time, and then serve it as a static file at runtime. The two dependecies used to create the schema, namely `zod` and `zod-to-json-schema`, are not included in the final bundle, thus reducing its size from 299KB to just 712 bytes.
