// @flow

import type Rule from 'promake/lib/Rule'
import path from 'path'
import fs from 'fs'
import promisify from 'es6-promisify'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdirp = promisify(require('mkdirp'))

function envRuleRecipe(target: string, vars: Array<string>): () => Promise<any> {
  return async function updateEnvFile(): Promise<any> {
    const varmap = {}
    for (let name of [...vars].sort()) varmap[name] = process.env[name]
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
    (target: string, vars: Array<string>): Rule =>
      rule(target, envRuleRecipe(target, vars), {runAtLeastOnce: true})

