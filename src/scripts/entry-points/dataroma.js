import jq363 from 'jquery'

import '../../styles/dataroma.scss'

console.log('On dataroma!')

window.jq363 = jq363 // not required but make it available to the console for debugging


// days since hold
// get current quotes
// show curr and % diff

jq363(function () {
  jq363('.tit_ctl div').each(function (i, el) {
    let txt = jq363(el).text()
    txt = txt.replace(/.*Ownership\s*:/, '#:')
      .replace(/Hold Price:/i, '<br>Hold:')
    console.log(txt)
    jq363(el).html(txt)
  })
})
