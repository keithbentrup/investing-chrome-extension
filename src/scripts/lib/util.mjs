import jq363 from 'jquery'

function getTLD(obj=window) {
  let TLD = obj.location.hostname.lastIndexOf('.', obj.location.hostname.lastIndexOf('.') - 1)
  return TLD === -1 ? obj.location.hostname : obj.location.hostname.substring(TLD + 1)
}

function getExtId() {
  let scriptSrc = chrome?.runtime?.getURL && chrome?.runtime?.getURL('')
  // console.log('a', scriptSrc)
  if (!scriptSrc) {
    scriptSrc = document?.currentScript?.src
    // console.log('b', scriptSrc)
    if (!scriptSrc) {
      scriptSrc = document.getElementById('oh-wp-entry-point').src
      // console.log('c', scriptSrc)
    }
  }
  // console.log('d', scriptSrc)
  return scriptSrc.replace('chrome-extension://', '').split('/')[0]
}

function getWARPrefix() {
  return `chrome-extension://${getExtId()}`
}

function createNavIFrame() {
  let iframeBody = jq363('<iframe class="oh-iframe oh-nav-links" frameBorder="0"></iframe>').appendTo(document.body).contents().find('body')[0],
    s = document.createElement('script')
  s.id = 'oh-wp-entry-point'
  s.src = `${getWARPrefix()}/scripts/injectedNavIframe.webpack.js`
  iframeBody.appendChild(s)
  return iframeBody
}

function downloadText(filename, contents) {
  let jEl = jq363('<a>').attr('href', `data:text/plain;charset=utf-8,${encodeURIComponent(contents)}`)
    .attr('download', filename)
    .css({display: 'none'})
    .appendTo(document.body)
  jEl[0].click()
  jEl.remove()
}

export { getTLD, getExtId, getWARPrefix, createNavIFrame, downloadText }
