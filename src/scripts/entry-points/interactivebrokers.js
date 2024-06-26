import jq363 from 'jquery'
import * as OH from '../lib/options.mjs'
import { createNavIFrame } from '../lib/util.mjs'

import '../../styles/nav-parent.scss'
import '../../styles/interactivebrokers.scss'
import '../../styles/mdi.scss'

jq363(createNavIFrame)
console.log('On interactivebrokers.com!')

window.jq363 = jq363 // not required but make it available to the console for debugging

// if we just logged on, go to the portfolio page
if ((
  /portal.interactivebrokers.com/.test(location.href)
) && (
  document.referrer === 'https://ndcdyn.interactivebrokers.com/'
)) {
location.href = 'https://portal.interactivebrokers.com/portal/?action=ACCT_MGMT_MAIN&loginType=1&clt=0&locale=en_US&RL=1#/portfolio'
}

function viewHandler() {
  if (/portal.interactivebrokers.com.*#\/portfolio/.test(location.href)) {
    // on the portforlio page
    // wait for data containing tables to load
    var dataTableObserver = window.setInterval(function () {
      var jPositions = jq363('#cp-ptf-positions-table0 tr:has(.text-semibold)')
      console.log('found pos', jPositions.length, jq363('tr:has(.text-semibold)'))
      if (jPositions.length) {
        clearInterval(dataTableObserver)

        let fullSymbols = ''
        // get all rows
        let rowSelector = 'thead tr, tr:has(.text-semibold)'
        jq363(rowSelector).each(function () {
          let rowTxt = ''
          // get all cells
          jq363(this).children('th, td').each(function () {
            // get all text in each cell separating child elements with a space
            let cellTxt = ''
            jq363(this).children().each(function () {
              let elTxt = jq363.trim(jq363(this).text())
              if (elTxt) {
                cellTxt += elTxt + ' '
              }
            })
            cellTxt = jq363.trim(cellTxt)
            if (cellTxt) {
              // add comma and space
              rowTxt += jq363.trim(cellTxt) + ', '
            }
          })
          // remove last comma and space from last cell, add newline, and combine with other rows
          fullSymbols += rowTxt.slice(0, -2) + '\n'
        })
        // remove last newline
        fullSymbols = fullSymbols.slice(0, -1)
        console.log(fullSymbols)
        OH.updateSavedPositions(fullSymbols)
      }
    }, 250)
  } else if (/portal.interactivebrokers.com.*#\/orders/.test(location.href)) {
    // on the orders page
    // wait for data containing tables to load
    var dataTableObserver = window.setInterval(function () {
      var jCloseOrders = jq363('span:contains(Limit 0.01),span:contains(@ 0.01)')
      console.log('found close orders', jCloseOrders.length, jq363('span:contains(Limit 0.01),span:contains(@ 0.01)'))
      if (jCloseOrders.length) {
        clearInterval(dataTableObserver)
        var jElsToDecorate = jCloseOrders.parents('td').children('.ellipsis')
        // console.log('found close orders part 2', jElsToDecorate.length, jElsToDecorate)
        jElsToDecorate.addClass('mdi mdi-progress-close')
      }
    }, 250)
  }
}

viewHandler()
// url and view is updating but popstate and hashchange events aren't firing
// so resort to polling the url
var originalUrl = location.href
window.setInterval(function () {
  if (location.href !== originalUrl) {
    originalUrl = location.href
    console.log('url changed', originalUrl)
    viewHandler()
  }}
, 250)