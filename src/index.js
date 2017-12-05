// @flow

import type Rule from 'promake/lib/Rule'
import path from 'path'
import fs from 'fs'
import promisify from 'es6-promisify'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdirp = promisify(require('mkdirp'))

type Options = {
  getEnv?: () => Promise<{[name: string]: ?string}>,
}

function envRuleRecipe(target: string, vars: Array<string>, options: Options = {}): () => Promise<any> {
  const getEnv = options.getEnv || (async () => process.env)
  return async function updateEnvFile(): Promise<any> {
    const varmap = {}
    const env = await getEnv()
    for (let name of [...vars].sort()) varmap[name] = env[name]
    const data = JSON.stringify(varmap, null, 2)

    let existingData
    try {
      existingData = await readFile(target, 'utf8')
    } catch (error) {
      existingData = ''
    }

    if (data !== existingData) {
      await mkdirp(path.dirname(target))
      await writeFile(target, data, 'utf8')
    }
  }
}
exports.envRuleRecipe = envRuleRecipe

type RuleFn = (target: string, recipe: () => Promise<any>, options?: {runAtLeastOnce?: boolean}) => Rule

exports.envRule =
  (rule: RuleFn) =>
    (target: string, vars: Array<string>, options?: Options): Rule =>
      rule(target, envRuleRecipe(target, vars, options), {runAtLeastOnce: true})

