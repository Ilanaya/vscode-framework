/// <reference types="jest" />

import fs from 'fs'
import { join } from 'path'
import { PackageJson } from 'type-fest'
import { validRange } from 'semver'
import { propsGenerators } from '../../src/cli/manifest-generator/propsGenerators'
import { defaultConfig } from '../../src/config'
import { screenRecorderManifest } from './fixtures'
import { pick } from 'lodash'

type HaveOwnTests = 'repository'

type Tests = {
    [K in Exclude<keyof typeof propsGenerators, HaveOwnTests>]: (packageJson: PackageJson) => void
}

const productionMeta = {
    target: { desktop: true, web: true },
    mode: 'production',
    config: defaultConfig.development,
} as const

// TODO-low transfer test from here
test('Repository field', async () => {
    const testGitConfig = `
[remote "origin"]
url=https://github.com/test-author/vscode-extension-name.git
    `
    const spyReadFile = jest.spyOn(fs, 'readFile')
    spyReadFile.mockImplementation((path, callback) => {
        expect(path).toBe(join(process.cwd(), '.git/config'))
        callback(null, testGitConfig as any)
    })
    expect(await propsGenerators.repository()).toMatchInlineSnapshot(`
        Object {
          "repository": "https://github.com/test-author/vscode-extension-name",
        }
    `)
})

// TODO!
describe.skip('Generated commands', () => {
    test("Doesn't touch original", async () => {
        await propsGenerators['contributes.commands'](
            {
                ...pick(screenRecorderManifest, 'name', 'displayName'),
                contributes: {
                    commands: [],
                },
            },
            productionMeta,
        )
    })
})

const tests: Tests = {
    'contributes.commands': expected =>
        expect(expected).toMatchInlineSnapshot(`
Object {
  "contributes": Object {
    "commands": Array [
      Object {
        "category": "Screen Recorder",
        "command": "startRecording",
        "title": "Start Screen Recording",
      },
      Object {
        "category": "Screen Recorder",
        "command": "editRecording",
        "icon": "$(edit)",
        "shortTitle": "Edit",
        "title": "Edit Screen Recording",
      },
    ],
  },
}
`),
    activationEvents: expected =>
        expect(expected).toMatchInlineSnapshot(`
Object {
  "activationEvents": Array [
    "onCommand:startRecording",
    "onCommand:editRecording",
  ],
}
`),
    engines: expected => expect(validRange(expected.engines!.vscode)).not.toBeNull(),
    extensionEntryPoint: expected =>
        expect(expected).toMatchInlineSnapshot(`
Object {
  "browser": "extension-web.js",
  "main": "extension-node.js",
}
`),
    qnaFalse: expected =>
        expect(expected).toMatchInlineSnapshot(`
Object {
  "qna": false,
}
`),
}

test.each<{ name: keyof Tests; expect: (data) => void }>(
    Object.entries(tests).map(([name, expect]) => ({ name, expect })),
)('Auto-generated field $name', async ({ name, expect }) => {
    expect(await propsGenerators[name](screenRecorderManifest, productionMeta))
})
