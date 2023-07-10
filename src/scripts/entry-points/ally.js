import $ from 'jquery'
import { DateTime } from "luxon"
import { createNavIFrame } from '../lib/util.mjs'

import '../../styles/ally.scss'

$(createNavIFrame)

function downloadAllyActivity() {
  $('activity-table tr td span:empty').text('-') // replace empty spans with dashes
  let csv = ''
  $('activity-table tr').each(function () {
    csv += $(this).text().trim()
      .replace(/\d,\d/g, '') // remove any comma in the thousands place
      .replace(/\n\s+/g, ',')
      .replace(/\$/g,'')
      .replace(/,-,/g,',,') // remove the dash we added for empty spans
      + '\n'
  })
  let jEl = $('<a>').attr('href', `data:text/plain;charset=utf-8,${encodeURIComponent(csv)}`)
    .attr('download', 'ally-account-activity.csv')
    .css({display: 'none'})
    .appendTo(document.body)
  jEl[0].click()
  jEl.remove()
}

if (/ally.com/.test(location.href)) {
  console.log('On ally.com!')

  // on specific pages scan DOM for opts at set interval
  if (/accounts\/holdings-balances\/overview/.test(location.href)) {
    let findOptsInterval = setInterval(function () {
      let jOpts = $('span[title$=" CALL"], span[title$=" PUT"]')
      if (jOpts.length) {
        clearInterval(findOptsInterval)

        let fullSymbols = '' // to concat open options

        jOpts.parent().each(function (i) {
          let [matched, tckr, strike, optType, expDt] = $(this).text().replace(/\s+/g, ' ').trim().match(/(\w+)\s+([\d.]+)\s+(CALL|PUT)\s+(.*)/)
          expDt = DateTime.fromFormat(expDt, 'MMM dd, yyyy')
          expDt = expDt.toFormat('yyMMdd')
          let fullSymbol = tckr + expDt + optType[0] + strike
          fullSymbols += `${fullSymbol}\n`

          // add roll tables to UI
          // invoke async parts in own function, so main loop can avoid tracking promises
          jParent = $(this).parents('.symbol-container')
          if (jParent.length) {
            jParent.addClass('oh-roll-results-iframe-container')
            ;(async function () {
              let rolls = await OH.findRollsForCredit({fullSymbol: fullSymbol}),
                jEl = await OH.createRollsResultIFrame(rolls)
              jEl.css({top: jParent.offset().top, left: jParent.offset().left})
            })()
          }
        })

        OH.updateSavedPositions(fullSymbols)

      }
    }, 75)
  }

  if (/accounts\/activity/.test(location.href)) {
    let findRangeSelectorInterval = setInterval(function () {
      let jRangeSelector = $('form:has(.select-menu)')
      if (jRangeSelector.length) {
        clearInterval(findRangeSelectorInterval)
        let link = $(`
          <a href="https://live.invest.ally.com/#" 
            style="font-size: 1rem; position: relative; top: 2rem;">⤵️</a>
        `).appendTo(jRangeSelector)
        link.on('click', function (ev) {
          ev.preventDefault()
          downloadAllyActivity()
        })
      }
    }, 75)
  }
}
