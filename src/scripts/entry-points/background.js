// chrome.runtime.onMessageExternal.addListener(function(request, sender, callback) {
//   console.log('msg received', request, sender, callback)
//   callback({msg: 'back at ya'})
// })

// overwrite existing downloaded file using '..' (a specifically ignored value) and the 'overwrite' strategy
// https://github.com/zach-adams/downloads-overwrite-already-existing-files/blob/master/bg.js
chrome.downloads.onDeterminingFilename.addListener(function (item, suggest) {
  // fix names with "/" and > 64 chars
  let filename = item.filename.replaceAll('/','_').substring(0,64)
  suggest({filename: `transactions/${filename}`, conflictAction: 'overwrite'})
})

// for debugging see https://github.com/keithbentrup/manifest-v3-header-mod/blob/main/service-worker.js

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(function(details) {
    console.log('KHB onRuleMatchedDebug', details)
  }
)