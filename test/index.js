// @flow

import {exec} from 'promisify-child-process'
import {expect} from 'chai'
import fs from 'fs'
import path from 'path'
import promisify from 'es6-promisify'

import '../src/index'

async function getMTime(file: string): Promise<number> {
  return (await promisify(fs.stat)(file)).mtime.getTime()
}

const cwd = path.resolve(__dirname, 'integration')
const buildDir = path.resolve(cwd, 'build')
const serverFile = path.join(buildDir, 'server', 'index.js')
const clientFile = path.join(buildDir, 'assets', 'client.bundle.js')
const serverEnvFile = path.join(buildDir, '.serverEnv')

describe('envRule', function () {
  this.timeout(15 * 60000)

  it('works', async function (): Promise<void> {
    await exec(`babel-node promake clean server client`, {cwd})

    const firstBuildTime = await getMTime(buildDir)
    const firstServerTime = await getMTime(serverFile)
    const firstClientTime = await getMTime(clientFile)

    await exec(`babel-node promake server client`, {cwd})
    expect(await getMTime(buildDir)).to.equal(firstBuildTime)

    await exec(`babel-node promake server client`, {cwd, env: {...process.env, FOO: 1}})
    const secondServerTime = await getMTime(serverFile)
    expect(secondServerTime).to.be.above(firstServerTime)
    expect(await getMTime(clientFile)).to.equal(firstClientTime)

    await exec(`babel-node promake server client`, {cwd, env: {...process.env, FOO: 1, QUX: 1}})
    const secondClientTime = await getMTime(clientFile)
    expect(secondClientTime).to.be.above(firstClientTime)
    expect(await getMTime(serverFile)).to.equal(secondServerTime)
  })
  it('replaces invalid JSON', async function (): Promise<void> {
    await promisify(fs.writeFile)(serverEnvFile, 'blah', 'utf8')
    await exec(`babel-node promake server`, {cwd})
    const newData = JSON.parse(await promisify(fs.readFile)(serverEnvFile, 'utf8'))
    expect(newData).to.be.an.instanceOf(Object)
  })
})
