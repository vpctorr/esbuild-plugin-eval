// eval-plugin-node:/Users/victor/Desktop/Dev/esbuild-plugin-eval/example/src/schema.eval
var jsonSchema = { "$ref": "#/definitions/mySchema", "definitions": { "mySchema": { "type": "object", "properties": { "myString": { "type": "string", "minLength": 5 }, "myUnion": { "type": ["number", "boolean"] } }, "required": ["myString", "myUnion"], "additionalProperties": false, "description": "My neat object schema" } }, "$schema": "http://json-schema.org/draft-07/schema#" };

// example/src/index.js
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
