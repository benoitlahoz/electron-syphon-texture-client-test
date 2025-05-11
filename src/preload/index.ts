// @ts-ignore
import { sharedTexture, contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('textures', {
  // @ts-ignore
  onSharedTexture: (cb: (id: string, data: any) => Promise<void>) =>
    ipcRenderer.on('shared-texture', async (e, id, transfer) => {
      const imported = sharedTexture.finishTransferSharedTexture(transfer)

      await cb(id, imported)

      imported.release(() => {
        ipcRenderer.send('shared-texture-done', id)
      })
    })
})
