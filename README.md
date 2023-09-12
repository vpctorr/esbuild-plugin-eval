# esbuild-plugin-eval (for Node.JS)

This is an esbuild plugin that evaluates a module before importing it. It's useful in cases where you want to render static parts of your application at build time to prune runtime dependencies, such as pre-rendering html from JSX, or pre-calculating CSP header hashes.

This plugin will evaluate any imported module with `.eval` before the extension (`example.eval.ts` or `example.eval.jsx` and so on). It does this by bundling the module into a data url, dynamically importing it, and then re-exporting the results.

## Usage

Install the dependency:

```
npm install esbuild-plugin-eval --save-dev

yarn add esbuild-plugin-eval -D
```

Add it to your esbuild plugins:

```js
import { build } from 'esbuild'
import evalPlugin from 'esbuild-plugin-eval'

await build({
  ...yourConfig
  plugins: [evalPlugin],
})
```


**Example input:**

```js
// index.js (entry point)
export * from './schema.eval.js'

// schema.eval.js
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

const mySchema = z
  .object({
    myString: z.string().min(5),
    myUnion: z.union([z.number(), z.boolean()]),
  })
  .describe('My neat object schema')

export const jsonSchema = zodToJsonSchema(mySchema, 'mySchema')
```

**Example after building:**

```js
// build/index.js

var jsonSchema = { "$ref": "#/definitions/mySchema", "definitions": { "mySchema": { "type": "object", "properties": { "myString": { "type": "string", "minLength": 5 }, "myUnion": { "type": ["number", "boolean"] } }, "required": ["myString", "myUnion"], "additionalProperties": false, "description": "My neat object schema" } }, "$schema": "http://json-schema.org/draft-07/schema#" };
```

In this case, we generate JSON schema at build time, and then serve it as a static file at runtime. The two dependecies used to create the schema, namely `zod` and `zod-to-json-schema`, are not included in the final bundle, thus reducing its size from 299KB to just 712 bytes.

## Caveats

A best effort is made to properly handle function exports, but keep in mind that all variables accessed from exported *functions* will need to be exported as well.

So this won't work:

```js
let message = 'Hello, world!'

export default () => console.log(message)
```

But this will:

```js
export let message = 'Hello, world!'
//^^^^
export default () => console.log(message)
```

---

Thanks to @jed for the original Deno implementation.
