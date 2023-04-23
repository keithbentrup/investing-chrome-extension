// this entry point is for testing

import jq363 from 'jquery'
import { getTLD, createNavIFrame } from '../lib/util.mjs'
import * as OH from '../lib/options.mjs'

import '../../styles/localhost.scss'

window.jq363 = jq363

createNavIFrame()
console.log('On: ', getTLD())

let fullSymbols = '' // to concat open options

jq363('.oh-vanguard-opt:not(.oh-vanguard-expired):not(.oh-vanguard-zero-quantity) th:first-child .holding_ticker:visible').each(function () {
  let fullSymbol = this.textContent.replace(/\s/g, '')
  fullSymbols += `${fullSymbol}\n`
  // add roll tables to UI
  // invoke async parts in own function, so main loop can avoid tracking promises
  let that = this
  ;(async function () {
    let rolls = await OH.findRollsForCredit({fullSymbol: fullSymbol}),
      jEl = await OH.createRollResult(rolls)
    jEl.css({top: jq363(that).offset().top + 20, left: jq363(that).offset().left})
  })()
})

OH.updateSavedPositions(fullSymbols)
