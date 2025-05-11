# electron-syphon-texture-client-test

Test of https://github.com/electron/electron/pull/46811

## How-To

Clone this repo

```sh
git clone https://github.com/benoitlahoz/electron-syphon-texture-client-test.git
```

Download and extract the Electron build

https://github.com/benoitlahoz/electron-syphon-texture-client-test/releases/download/v0.0.1/custom-electron-reitowo.zip

Clone the node-syphon repo

```sh
git clone https://github.com/benoitlahoz/node-syphon
```

Switch branch and install

```sh
cd node-syphon
git checkout client-to-surface
yarn

```

Install test dependencies

```sh
# Add electron from the downloaded dist.
yarn add link:[MYPATH]/custom-electron-reitowo
yarn add link:[MYPATH]/node-syphon
```

Run

```sh
yarn dev
```
