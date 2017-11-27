# promake-env

[![Build Status](https://travis-ci.org/jcoreio/promake-env.svg?branch=master)](https://travis-ci.org/jcoreio/promake-env)
[![Coverage Status](https://codecov.io/gh/jcoreio/promake-env/branch/master/graph/badge.svg)](https://codecov.io/gh/jcoreio/promake-env)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

helps ensure promake rules will rerun when environment variables have changed

# How it works

`envRule`s you define write the values of the environment variables you specify to a target file you specify.  However,
it won't modify the file if the current values are equal to the ones in the file (from the last build), so by making the
target file a prerequisite of another `rule`, you can ensure that rule will rerun whenever any of those environment
variable values is different from the last build.

# Usage

```sh
npm install --save promake-env
```

# API

### `envRule(rule)(file, vars, [options])`

First you create the function for defining environment rules by passing the `rule` function from `Promake`:
```js
const Promake = require('promake')
const {rule} = new Promake()
const envRule = require('promake-env').envRule(rule)
```

Then you call the `envRule` function with `(file, vars)` to define a rule for creating and updating `file`.

Make sure to include `file` in the `prerequisites` of any other `rules` you want to rerun when the environment variables
change.

#### `file`

The name of the file to write the environment variable values to.

#### `vars`

An array of environment variable names to check for changes and write to the file.

#### `options.getEnv` (optional, default: `async () => process.env`)

Allows you to customize which environment variables are used.  Should be a function which returns a promise that will
resolve to the environment variable hash you wish to use.

# Example

Here's a make script for a babel project that makes sure it will recompile all the code when run with a different
`NODE_ENV` or `BABEL_ENV`.

```js
#!/usr/bin/env node

const Promake = require('promake')
const glob = require('glob').sync
const fs = require('fs-extra')

const buildEnv = 'lib/.buildEnv'
const srcFiles = glob('src/server/**/*.js')
const libFiles = srcFiles.map(file => file.replace(/^src/, 'lib'))
const prerequisites = [...srcFiles, buildEnv, '.babelrc', ...glob('src/**/.babelrc')]

const {rule, task, cli, exec} = new Promake()
const envRule = require('promake-env').envRule(rule)

envRule(buildEnv, ['NODE_ENV', 'BABEL_ENV'])
rule(libFiles, prerequisites, () => exec('babel src/ --out-dir lib'))

task('build', libFiles)

task('clean', () => fs.remove('build'))

cli()
```

