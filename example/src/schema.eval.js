import { z } from 'https://esm.sh/zod@3'
import { zodToJsonSchema } from 'https://esm.sh/zod-to-json-schema@3'

const mySchema = z
  .object({
    myString: z.string().min(5),
    myUnion: z.union([z.number(), z.boolean()]),
  })
  .describe('My neat object schema')

export const jsonSchema = zodToJsonSchema(mySchema, 'mySchema')
