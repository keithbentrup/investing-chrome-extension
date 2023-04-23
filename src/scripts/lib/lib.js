import jq363 from 'jquery'
import style1 from '../../../styles/content.scss'

var OH = OH || {}

// ally and maybe other sites overwrite the console object
OH.cl = window.console.log

OH.cl('Hi from the OH injected script!')

OH.extId = document.currentScript.src.replace('chrome-extension://', '').split('/')[0]
OH.WARPrefix='chrome-extension://' + OH.extId
OH.TLD = location.host.lastIndexOf('.', location.host.lastIndexOf('.') - 1)
OH.TLD = OH.TLD === -1 ? location.host : location.host.substring(OH.TLD + 1)


// if need to send message from page to extension background service worker
// https://developer.chrome.com/docs/extensions/mv3/messaging/#simple
// https://stackoverflow.com/questions/59914490/how-to-handle-unchecked-runtime-lasterror-the-message-port-closed-before-a-res/59915897#59915897
// chrome.runtime.sendMessage(OH.extId, {msg: 'hi, khb!'},
//   function(response) {
//     console.log(response)
//   }
// )


OH.copyToClipboard = function (el) {
  el.ownerDocument.getSelection().selectAllChildren(el)
  el.ownerDocument.execCommand('copy')
}
