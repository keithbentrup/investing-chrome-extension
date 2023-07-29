const fs = require('fs')
const path = require('path')
const cp  = require('child_process')

const chromeExtDir = `${__dirname}/../..`
const distDir = `${chromeExtDir}/dist`

try {
  fs.rmSync(distDir, { recursive: true, force: true })
} catch (error) {
  console.error('Failed to delete dist directory:', error)
}

// create the dist directory
fs.mkdirSync(distDir)
fs.mkdirSync(`${distDir}/images`)
fs.mkdirSync(`${distDir}/option-chains-latest`)
fs.mkdirSync(`${distDir}/html`)

// copy the manifest file
fs.copyFileSync(`${chromeExtDir}/src/manifest.json`, `${distDir}/manifest.json`)
fs.copyFileSync(`${chromeExtDir}/src/manifest-v3-request-rules.json`, `${distDir}/manifest-v3-request-rules.json`)
fs.copyFileSync(`${chromeExtDir}/src/images/favicon-16x16.png`, `${distDir}/images/favicon-16x16.png`)
fs.copyFileSync(`${chromeExtDir}/src/images/favicon-32x32.png`, `${distDir}/images/favicon-32x32.png`)
fs.copyFileSync(`${chromeExtDir}/src/html/popup.html`, `${distDir}/html/popup.html`)

let lines = fs.readFileSync(`${chromeExtDir}/../data/config/.tckr-watchlist`, 'utf-8').split('\n')
lines.forEach(line => {
  line = line.trim()
  if (line && !/^#/.test(line)) {
    cp.spawn('ln', ['-sf', `${chromeExtDir}/../data/option-chains-latest/${line}`, `${distDir}/option-chains-latest/${line}`], {stdio: 'inherit'})
  }
})
cp.spawn('ln', ['-sf', `${chromeExtDir}/../data/earnings-cal`, `${distDir}/earnings-cal`], {stdio: 'inherit'})
