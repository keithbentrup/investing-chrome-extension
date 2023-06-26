import jq363 from 'jquery'
import { DateTime } from "luxon"
import { createNavIFrame } from '../lib/util.mjs'
import * as OH from '../lib/options.mjs'
import { downloadXHR } from '../lib/xhr.js'

import '../../styles/vanguard.scss'

window.jq363 = jq363 // not required but make it available to the console for debugging
downloadXHR([
  {
    url: 'https://personal1.vanguard.com/xos-order-status-api/orders',
    filename: `${DateTime.now().toFormat('yy-MM-dd')}-vg-orders.json`
  }
])
//vanguardStyles.use()
jq363(createNavIFrame)
console.log('On vanguard.com!')

/* want link to
6. show %time and %profit per contract
7. highlight unused cash
8 - can find transactions here: https://personal1.vanguard.com/rxt-transactions-api/trh-transaction-history/?days=31
9. can you check the orders page to see if a limit order has been placed?

so need margin just for net credit?
when does margin come into play? only overnight

*/

// if we just logged on, go to the portfolio page (not the balances page)
if ((
    location.href === 'https://balances.web.vanguard.com/' ||
    location.href === 'https://dashboard.web.vanguard.com/'
  ) && (
    document.referrer === 'https://personal.vanguard.com/' ||
    document.referrer === 'https://logon.vanguard.com/logon' ||
    document.referrer === 'https://challenges.web.vanguard.com/'
  )) {
  location.href = 'https://personal.vanguard.com/us/myaccounts/balancesholdings'
}


// wait for DOM ready event
jq363(function () {
  // add a body class for better css selection using THEIR selectors
  jq363(document.body).addClass('oh-vanguard')


  // this is a hack to get the password autofill to work
  if (location.href.indexOf('https://logon.vanguard.com/logon') !== -1) {
    jq363(document.body).on('mouseenter', '#username-password-submit-btn', function () {
      console.log('mouseenter')
      if (jq363('.c11n-hint-error__content__error').length) {
        jq363('#USER').focus()
      }
    })
  }

  if (location.href === 'https://personal.vanguard.com/us/OfxWelcome') {
    // jq363('#OfxDownloadForm\\:ofxDateFilterSelectOneMenu').val('ONE_YEAR')
    // jq363('#OfxDownloadForm\\:ofxDateFilterSelectOneMenu').val('ONE_YEAR')
    document.getElementById('OfxDownloadForm:selectOrDeselect').click()
  }

  if (/holdings.web.vanguard.com|order-status.web.vanguard.com/.test(location.href)) {

    // wait for data containing tables to load
    var dataTableObserver = window.setInterval(function () {
      var jAccordions = jq363('c11n-accordion')
      if (jAccordions.length) {
        clearInterval(dataTableObserver)

        // collapse IRA & 401k tables (2nd and 4th accordions)
        // the orders page fires a 2nd expand so brute force it
        let collapseCount = 10
        let collapseInterval = setInterval(function () {
          if (collapseCount--) {
            jq363('c11n-accordion:eq(1), c11n-accordion:eq(3)').removeClass('c11n-accordion--expanded')
          } else {
            clearInterval(collapseInterval)
          }
        }, 250)

        // look for open orders that did not close before the bell
        jq363('date-link').each(function () {
          let el = jq363(this),
            dateParts = el.text().trim().split('/'),
            closeTime = DateTime.fromObject({month: dateParts[0], day: dateParts[1], year: dateParts[2], hour: 16}, {zone: 'America/New_York'})
          if (closeTime < DateTime.now()) {
            el.parents('tr').addClass('oh-after-bell-open-order')
          }
        })

        // scroll to 1st data table
        window.scrollTo(0, jAccordions.offset().top)

        // label the 0 quantity rows for css - srsly VG! why keep the 0s?
        jq363('.c11n-table th, .c11n-table td').filter(function() {
          return jq363(this).text().trim() === "0.000"
        }).parents('tr').addClass('oh-vanguard-zero-quantity')

        // label the expired quantity rows for css - srsly VG! why keep the expired?
        jq363('.c11n-table th, .c11n-table td').filter(function() {
          let txt = jq363(this).text().trim(),
            matches = txt.match(/EXP ([\d\/]{8})/)
          if (matches && matches.length) {
            let now = DateTime.now(),
              d1 = DateTime.fromFormat(matches[1], 'MM/dd/yy')
            if (d1.startOf('day').ts < now.startOf('day').ts) {
              return true
            }
          }
        }).parents('tr').addClass('oh-vanguard-expired')

        // label the call rows for css
        jq363('.c11n-table .holding_name').filter(function() {
          return /^CALL /.test(jq363(this).text().trim())
        }).parents('tr').addClass('oh-vanguard-call oh-vanguard-opt')

        // label the put rows for css
        jq363('.c11n-table .holding_name').filter(function() {
          return /^PUT /.test(jq363(this).text().trim())
        }).parents('tr').addClass('oh-vanguard-put oh-vanguard-opt')

        // label the stock rows for css
        jq363('.c11n-table .holding_name').filter(function() {
          return !/EXP ([\d\/]{8})/.test(jq363(this).text().trim())
        }).parents('tr').addClass('oh-vanguard-stock')

        // on the orders page, have to watch for new rows loaded after the page loads
        let observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.target.tagName === 'TR') {
              if (jq363(mutation.target).find('td:contains(Canceled)').length) {
                jq363(mutation.target).addClass('oh-vanguard-canceled-order')
              } else if (jq363(mutation.target).find('td:contains(Executed)').length) {
                jq363(mutation.target).addClass('oh-vanguard-executed-order')
              } else if (jq363(mutation.target).find('td:contains(Open)').length) {
                jq363(mutation.target).addClass('oh-vanguard-open-order')
              }
            }
          })
        })
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });


        let fullSymbols = '' // to concat open options

        jq363('.oh-vanguard-opt:not(.oh-vanguard-expired):not(.oh-vanguard-zero-quantity) .holding_ticker:visible').each(function () {
          let fullSymbol = this.textContent.replace(/\s/g, '')
          fullSymbols += `${fullSymbol}\n`
            
          // add roll tables to UI
          // invoke async parts in own function, so main loop can avoid tracking promises
          let that = this
          ;(async function () {
            let rolls = await OH.findRollsForCredit({fullSymbol: fullSymbol}),
              jEl = await OH.createRollResult(rolls)
            //console.log('jEl', jEl, 'that', that)
            let thatTop = jq363(that).offset().top,
              thatLeft = jq363(that).offset().left
            //console.log('thatTop', thatTop, 'thatLeft', thatLeft)
            jEl.css({top: thatTop + 20, left: thatLeft})
          })()
        })

        OH.updateSavedPositions(fullSymbols)

      }
    }, 250)
  }

})
