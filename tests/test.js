import { build } from 'esbuild'
import evalPlugin from '../src/mod.js'
import assert from 'node:assert'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const entryPoint = fileURLToPath(import.meta.resolve('../example/src/index.js'))
const outfile = fileURLToPath(import.meta.resolve('../example/build/worker.js'))

await build({
  bundle: true,
  format: 'esm',
  entryPoints: [entryPoint],
  outfile,
  plugins: [evalPlugin],
  allowOverwrite: true,
})

const { default: worker } = await import(outfile)
const response = await worker.fetch()

const expected =
  `{"$ref":"#/definitions/mySchema","definitions":{"mySchema":{"type":"object","properties":{"myString":{"type":"string","minLength":5},"myUnion":{"type":["number","boolean"]}},"required":["myString","myUnion"],"additionalProperties":false,"description":"My neat object schema"}},"$schema":"http://json-schema.org/draft-07/schema#"}`

assert.equal(await response.text(), expected)
assert.equal((await readFile(outfile, 'utf8')).includes('z'), false)
