import { registerExtensionCommand } from 'vscode-framework'

export const activate = () => {
    console.log('Extension active! yes!')
    registerExtensionCommand('sayHello', () => {})
}
