import { downloadText } from './util.mjs'

function downloadXHR(filesObjs=[]) {
  if (filesObjs === []) {
    console.log('No files to download.')
    return
  }
  const XHR = XMLHttpRequest.prototype
  const open = XHR.open
  const send = XHR.send
  const setRequestHeader = XHR.setRequestHeader

  XHR.open = function () {
    this._requestHeaders = {}
    return open.apply(this, arguments)
  }

  XHR.setRequestHeader = function (header, value) {
    if (this?._requestHeaders) {
      this._requestHeaders[header] = value
    }
    return setRequestHeader.apply(this, arguments)
  }

  XHR.send = function () {
    this.addEventListener('load', function () {
      if (this.responseType === 'blob') {
        return // bail quickly
      }
      const url = this.responseURL
      for (let fileObj of filesObjs) {
        if (url.includes(fileObj.url)) {
          try {
            let responseBody
            if ((this.responseType === '' || this.responseType === 'text') && this.responseText.trim()[0] === '{') {
              responseBody = JSON.parse(this.responseText)
            } else {
              responseBody = this.response
            }
            if (responseBody?.accounts && responseBody?.client) {
              downloadText(fileObj.filename, this.responseText)
            }
          } catch (err) {
            console.log('Error reading or processing response.', err)
          }
          break
        }
      }
    })
    return send.apply(this, arguments)
  }

  console.log('hi from xhr.js')
}

export { downloadXHR }