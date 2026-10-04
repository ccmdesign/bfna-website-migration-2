import type { Nitro } from 'nitropack'
import { writeAgentFiles } from './write-agent-files'

export function registerAgentFilesHook(nitro: Nitro): void {
  nitro.hooks.hook('prerender:done', async () => {
    await writeAgentFiles()
  })
}
