// @ts-ignore
import {
  app,
  BrowserWindow,
  // @ts-ignore
  sharedTexture,
  ipcMain
} from 'electron'
import { is } from '@electron-toolkit/utils'
import path from 'node:path'
import process from 'node:process'
import {
  SyphonMetalClient,
  SyphonServerDirectory,
  SyphonServerDirectoryListenerChannel
  // @ts-ignore
} from 'node-syphon'

let client: SyphonMetalClient | undefined
const directory = new SyphonServerDirectory()
directory.listen()

const capturedTextures = new Map<number, any>()

const createWindow = (): void => {
  const win = new BrowserWindow({
    width: 1280,
    height: 720 + 32,
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      // backgroundThrottling: false,
      preload: path.join(__dirname, '../preload/index.js')
    }
  })

  win.webContents.setFrameRate(120)

  // win.loadFile(path.join(__dirname, '../index.html'))
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}`)
  } else {
    win.loadFile(`${path.join(__dirname, '../renderer/index.html')}`)
  }

  // win.webContents.openDevTools()

  directory.on(
    SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification,
    (server: any) => {
      console.log('Server announced:', server)
      if (!client) {
        client = new SyphonMetalClient(server)

        client.on('texture', (texture: any) => {
          // console.log('Texture is null or undefined', !texture.surface)
          // FIXME: Look like background throttling doesnt't send texture, with this error
          // -[IOGPUMetalTexture initWithDevice:descriptor:iosurface:plane:field:args:argsSize:]:648: failed assertion `IOSurface argument must not be NULL'
          const codedSize = {
            width: texture.width,
            height: texture.height
          }

          const { release } = texture

          const imported = sharedTexture.importSharedTexture({
            pixelFormat: texture.pixelFormat,
            codedSize,
            visibleRect: {
              x: 0,
              y: 0,
              ...codedSize
            },
            contentRect: {
              x: 0,
              y: 0,
              ...codedSize
            },
            metadata: {
              frameCount: texture.frameCount
            },
            timestamp: texture.timestamp,
            sharedTextureHandle: texture.surface,
            ioSurface: texture.surface
          })
          const transfer = imported.startTransferSharedTexture()

          capturedTextures.set(texture.frameCount, { imported, release })

          win.webContents.send('shared-texture', texture.frameCount, transfer)
        })
      }
    }
  )

  ipcMain.on('shared-texture-done', (event, id) => {
    const data = capturedTextures.get(id)
    if (data) {
      const { imported, release } = data

      imported.release(() => {
        // Release the node-syphon texture.
        release()
      })

      capturedTextures.delete(id)
    }
  })
}

app.whenReady().then(() => {
  createWindow()
})

app.on(
  'render-process-gone',
  (
    event: Electron.Event,
    webContents: Electron.WebContents,
    details: Electron.RenderProcessGoneDetails
  ) => {
    console.log('Render process gone:', event, webContents, details)
  }
)
