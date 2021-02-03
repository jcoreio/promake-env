import Rule from 'promake/Rule'

type Options = {
  getEnv?: () => Promise<{ [name: string]: string | undefined }>
}

export function envRuleRecipe(
  target: string,
  vars: Array<string>,
  options?: Options
): (rule?: Rule) => Promise<any>

type RuleFn = (
  target: string,
  recipe: () => Promise<any>,
  options?: { runAtLeastOnce?: boolean }
) => Rule

export const envRule: (
  rule: RuleFn
) => (target: string, vars: Array<string>, options?: Options) => Rule
