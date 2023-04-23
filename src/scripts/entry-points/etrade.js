import jq363 from 'jquery'
import { DateTime, Interval } from "luxon";
import { createNavIFrame } from '../lib/util.mjs'
import * as OH from '../lib/options.mjs'

import etradeStyles from '../../styles/etrade.lazy.scss'

window.jq363 = jq363 // not required but make it available to the console for debugging
window.OH = OH
console.log('OH', OH)

etradeStyles.use()
jq363(createNavIFrame)
console.log('On etrade.com!')

jq363(function () {

  if (/portfolios\/positions/.test(location.href)) {
    // wait for data containing tables to load
    var waitForTableRows = setInterval(function (){
      var combined=''
      var tableRows = jq363('[id^=r0_]')
      if (tableRows.length) {
        clearInterval(waitForTableRows)
        tableRows.each(function (el) {
          var el = jq363(this)
          combined += el.text() + '\t'
        })
      }

      // remove some empty divs that interfere with the desired layout
      jq363('div').filter(function () {  return this.textContent.trim() == '' }).remove()
      // remove all the fixed dimensions in the style attributes
      jq363('.col-xs-12 div').attr('style', '').filter(':not([role="columnheader"])').filter(':not([role="gridcell"])').css({overflow: 'visible', display: 'inherit'})
      // hide some uninteresting divs that cover the rows when expanded
      jq363('etrade-footer, [class*="Footer"], [class*="PortfoliosLegend"], [class*="PortfoliosNews"]').hide()
      // float the columnheader / cell divs so the behave like cells again
      jq363('[role="columnheader"],[role="gridcell"]').css({float: 'left'})
      jq363('[role="group"]').css({display: 'inline-block'})
      // ensure the summary is on a new line and will not be obscured when adding the iframes
      jq363('.oh-etrade-pos-summary').addClass('clearfix')

      let fullSymbols = '', // to concat open options
        acquiredCol = parseInt(jq363('[role=columnheader]:contains(Acquired)').attr('col')),
        paidPriceCol = parseInt(jq363('[role=columnheader]:contains(Price Paid)').attr('col')),
        askPriceCol = parseInt(jq363('[role=columnheader]:contains(Ask)').attr('col')),
        jOptRows = jq363('[role=row]:has([title$=Put]), [role=row]:has([title$=Call])')

      jOptRows.each(function () {
        let jEl = jq363(this),
          symbolTitle = jq363('[id^=symbolLink]', jEl).attr('title').trim(),
          symbolParts = symbolTitle.match(/^(\w+)\s+(.*)\s+\$([\d.]+)\s+(Put|Call)$/),
          [fullMatch, tckr, expStr, strike, optType] = symbolParts,
          transDt = DateTime.fromFormat(jq363(`[col=${acquiredCol}]`, jEl).text().trim(), 'MM/dd/yyyy').plus({hours: 12}), // assume tx @ noon
          expDt = DateTime.fromFormat(expStr.replace(/'/,''), 'MMM dd yy').plus({hours: 16}), // add hrs til 4pm
          curDt = DateTime.now(),
          isBeforeMarketClose = curDt.hour < 16,
          timeToExpiration = Interval.fromDateTimes(curDt, expDt),
          DTE = parseInt(timeToExpiration.length('days') + (isBeforeMarketClose ? 1 : 0)),
          origOptLen = Interval.fromDateTimes(transDt, expDt),
          paidPrice = parseFloat(jq363(`[col=${paidPriceCol}]`, jEl).text().trim()),
          lastPrice = parseFloat(jq363(`[col=${askPriceCol}]`, jEl).text().trim()),
          paidPct = parseInt(100 * lastPrice / paidPrice),
          optTimePct = parseInt(100 * DTE / Math.ceil(origOptLen.length('days')))

        let fullSymbol = tckr + expDt.toFormat('yyMMdd') + optType[0] + strike
        fullSymbols += `${fullSymbol}\n`

        // add some summary information to last cell
        jq363('[role=gridcell]:last', jEl).after(`
          <div class="oh-etrade-pos-summary clearfix">
            <span>DTE: ${DTE}</span>,
            <span>Opt Time: ${optTimePct}%</span>,
            <span>Paid: ${paidPct}%</span>
          </div>
        `)

        // add roll tables to UI
        // invoke async parts in own function, so main loop can avoid tracking promises
        jq363('[role="group"]', jEl).addClass('oh-roll-results-iframe-container')
        ;(async function () {
          let rolls = await OH.findRollsForCredit({fullSymbol: fullSymbol}),
            jIFrame = await OH.createRollResult(rolls)
          jIFrame.css({top: jq363('[role="group"]', jEl).offset().top, left: jq363('[role="group"]', jEl).offset().left+400})
        })()
      })

      OH.updateSavedPositions(fullSymbols)

    }, 1000)
  }

})
