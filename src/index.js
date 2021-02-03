// @flow

import type Rule from 'promake/Rule'
import Promake from 'promake'
import path from 'path'
import fs from 'fs'
import promisify from 'es6-promisify'

const { VERBOSITY } = Promake

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdirp = promisify(require('mkdirp'))

type Env = { [name: string]: ?string }

type Options = {
  getEnv?: () => Env | Promise<Env>,
}

export function envRuleRecipe(
  target: string,
  vars: Array<string>,
  options: Options = {}
): (rule?: Rule) => Promise<any> {
  const getEnv = options.getEnv || (async () => process.env)
  return async function updateEnvFile(rule?: Rule): Promise<any> {
    const log = rule ? rule.promake.log : (...args: Array<any>) => {}
    const env = await getEnv()
    const varmap = {}
    for (let name of [...vars].sort()) varmap[name] = env[name]

    let previousEnv
    let previousEnvError
    try {
      previousEnv = JSON.parse(await readFile(target, 'utf8'))
      if (!(previousEnv instanceof Object))
        throw new Error(`${target} didn't contain a JSON object`)
    } catch (error) {
      previousEnvError = error
      log(
        VERBOSITY.DEFAULT,
        'Failed to load previous environment;',
        error.message
      )
      previousEnv = {}
    }

    const changedVars: Array<string> = []
    for (let name of new Set([...vars, ...Object.keys(previousEnv)])) {
      if (env[name] !== previousEnv[name]) changedVars.push(name)
    }

    if (changedVars.length) {
      log(
        VERBOSITY.DEFAULT,
        'environment variables have changed:',
        changedVars[0],
        changedVars.length > 1 ? `(+${changedVars.length} more)` : ''
      )
    }
    if (changedVars.length || previousEnvError) {
      await mkdirp(path.dirname(target))
      await writeFile(target, JSON.stringify(varmap, null, 2), 'utf8')
    } else {
      log(VERBOSITY.DEFAULT, 'Nothing to be done for', target)
    }
  }
}

type RuleFn = (
  target: string,
  recipe: () => Promise<any>,
  options?: { runAtLeastOnce?: boolean }
) => Rule

export const envRule: (
  rule: RuleFn
) => (target: string, vars: Array<string>, options?: Options) => Rule = (
  rule: RuleFn
) => (target: string, vars: Array<string>, options?: Options): Rule =>
  rule(target, envRuleRecipe(target, vars, options), { runAtLeastOnce: true })
