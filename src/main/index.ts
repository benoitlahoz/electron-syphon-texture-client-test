// @ts-ignore
import {
  app,
  BrowserWindow,
  // @ts-ignore
  sharedTexture,
  ipcMain
} from 'electron'
import { is } from '@electron-toolkit/utils'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import process from 'node:process'
import {
  SyphonMetalClient,
  SyphonServerDirectory,
  SyphonServerDirectoryListenerChannel
  // @ts-ignore
} from 'node-syphon'
import { time } from 'node:console'

export function logWithTime(message: string, ...optionalParams: any[]) {
  const date = new Date()
  const timestamp = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`
  console.log(`[${timestamp}] ${message}`, ...optionalParams)
}

logWithTime(JSON.stringify(sharedTexture, null, 2))
logWithTime('main pid: ', process.pid)

let client: SyphonMetalClient | undefined
const directory = new SyphonServerDirectory()
directory.listen()

const createWindow = (): void => {
  const win = new BrowserWindow({
    width: 1280,
    height: 720 + 32,
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
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

  win.webContents.on('did-finish-load', () => {
    logWithTime(`win pid: ${win.webContents.getOSProcessId()}`)
  })

  directory.on(
    SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification,
    (server: any) => {
      console.log('Server announced:', server)
      if (!client) {
        client = new SyphonMetalClient(server)
        const start = Date.now()
        /*
        webContents.getAllWebContents().forEach((wc) => {
          wc.send('syphon-client', client)
        })
        */
        client.on('texture', (texture: any) => {
          const imported = sharedTexture.importSharedTexture({
            pixelFormat: 'bgra',
            codedSize: {
              width: texture.width,
              height: texture.height
            },
            visibleRect: {
              x: 0,
              y: 0,
              width: texture.width,
              height: texture.height
            },
            contentRect: {
              x: 0,
              y: 0,
              width: texture.width,
              height: texture.height
            },
            timestamp: Date.now() - start,
            sharedTextureHandle: texture.surface,
            ioSurface: texture.surface
          })
          const transfer = imported.startTransferSharedTexture()

          console.log(transfer)

          const id = randomUUID()
          // capturedTextures.set(id, { imported, texture })

          // logWithTime('start send shared texture:', id)
          win.webContents.send('shared-texture', id, transfer)
        })
      }
      /*
      webContents.getAllWebContents().forEach((wc) => {
        wc.send('syphon-server', server)
      })
      */
    }
  )
  /*
  const osr = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    webPreferences: {
      offscreen: {
        useSharedTexture: true
      }
    }
  })
  
  // const spout = new SpoutOutput("electron");

  osr.webContents.setFrameRate(240)

  osr.webContents.on('did-finish-load', () => {
    logWithTime(`osr pid: ${osr.webContents.getOSProcessId()}`)
    logWithTime('directory: ', directory.servers)
  })

  const capturedTextures = new Map<string, any>()
  
  ipcMain.on('shared-texture-done', (event, id) => {
    const data = capturedTextures.get(id)
    if (data) {
      // logWithTime('main released shared texture:', id)
      const { imported, texture } = data

      imported.release(() => {
        // logWithTime('main released source texture:', id)
        texture.release()
      })

      capturedTextures.delete(id)
    }
  })
  
  osr.webContents.on(
    'paint',
    (
      event: Electron.WebContentsPaintEventParams,
      dirty: Electron.Rectangle,
      image: Electron.NativeImage
    ) => {
      const texture = event.texture!
      // console.log(texture.textureInfo)
      // @ts-ignore
      const imported = sharedTexture.importSharedTexture({
        ...texture.textureInfo,
        ioSurface: texture.textureInfo.sharedTextureHandle
      })

      const transfer = imported.startTransferSharedTexture()

      const id = randomUUID()
      capturedTextures.set(id, { imported, texture })

      // logWithTime('start send shared texture:', id)
      win.webContents.send('shared-texture', id, transfer)
    }
  )

  osr.loadURL('https://app.singular.live/output/6W76ei5ZNekKkYhe8nw5o8/Output?aspect=16:9')
  */
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
