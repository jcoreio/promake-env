import Rule from 'promake/Rule'

type Env = { [name: string]: string | undefined }

type Options = {
  getEnv?: () => Env | Promise<Env>
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
