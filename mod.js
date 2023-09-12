export default {
  name: 'eval-plugin-node',

  setup({ initialOptions, onLoad, onResolve, esbuild }) {
    const options = {
      ...initialOptions,
      bundle: true,
      format: 'esm',
      write: false,
      metafile: true,
    }

    onResolve({ filter: /\.eval/, namespace: 'file' }, ({ path, resolveDir, kind }) => {
      if (kind === 'entry-point') throw new Error('You cannot use a .eval file as an entry point.')
      if (resolveDir.includes('node_modules')) return
      const { pathname } = new URL(path, `file://${resolveDir}/`)
      return { namespace: 'eval-plugin-node', path: pathname }
    })

    onLoad({ filter: /.*/, namespace: 'eval-plugin-node' }, async ({ path }) => {
      const { metafile, outputFiles } = await esbuild.build({ ...options, entryPoints: [path] })
      const file = outputFiles.find(f => /\.m?js$/.test(f.path))
      const watchFiles = Object.keys(metafile.inputs)

      const dataurl = `data:text/javascript;base64,${Buffer.from(file.contents).toString('base64url')}`
      const scriptEntries = Object.entries(await import(dataurl))

      const contents = scriptEntries.reduce((js, [k, v]) => {
        const ident = k === 'default' ? `${k} ` : `let ${k}=`
        return js + `export ${ident}${stringify(v)}\n`
      }, '')

      return { loader: 'js', contents, watchFiles }
    })
  },
}

function stringify(v) {
  switch (typeof v) {
    case 'object':
      if (v === null) return 'null'
      if (v instanceof Uint8Array) {
        return `Uint8Array.from(atob('${btoa(String.fromCharCode(...v))}'),x=>x.charCodeAt())`
      }
      if (Array.isArray(v)) return `[${v.map(stringify)}]`
      return `{${Object.entries(v).map(e => e.map(stringify).join(':'))}}`
    case 'function':
      try {
        return String(eval(`(${v})`))
      } catch (e) {
        return String(v).replace(/^async|^/, '$& function ')
      }
    case 'bigint':
      return `${v}n`
    case 'undefined':
      return 'undefined'
    default:
      return JSON.stringify(v)
  }
}
