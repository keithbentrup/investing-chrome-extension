import jq363 from 'jquery'
import { DateTime, Interval } from 'luxon'
import { getTLD, getWARPrefix, downloadText } from './util.mjs'

let ETFs = ['QQQ','SPY']

function findCurOptInfo(TDAOptChain, expDt, formattedStrike) {
  for (let chainDate in TDAOptChain) {
    // chainDate format: 'YYYY-MM-DD:DTE'
    if (chainDate.includes(expDt.replace(/(\d\d)(\d\d)/g, '$1-$2-'))) {
      let curDTE = parseInt(chainDate.split(':')[1])
      for (let chainStrike in TDAOptChain[chainDate]) {
        if (parseFloat(chainStrike).toFixed(2) === formattedStrike) {
          return TDAOptChain[chainDate][chainStrike][0]
        }
      }
    }
  }
}

// compare open options to what's saved in local storage
// if different, auto-download and update local storage
function updateSavedPositions(fullSymbols) {
  let lsFullSymbols = localStorage.getItem('fullSymbols')
  if (lsFullSymbols !== fullSymbols) {
    localStorage.setItem('fullSymbols', fullSymbols)
    console.log('Updated positions detected! Downloading ...')
    downloadText(`current-positions-on-${getTLD()}.txt`, fullSymbols)
  } else {
    console.log('No change in positions.')
  }
}

function updateOrders(fullSymbols) {
  let jEl = jq363('<a>').attr('href', `data:text/plain;charset=utf-8,${encodeURIComponent(fullSymbols)}`)
    .attr('download', `current-positions-on-${getTLD()}.txt`)
    .css({display: 'none'})
    .appendTo(document.body)
  jEl[0].click()
  jEl.remove()
}

function normalizeFullSymbol(txt) {
  txt = txt.trim().toUpperCase()
  txt = txt.replace(/BRK.?B/, 'BRK.B')
  return txt
}

async function findRollsForCredit(argsObj) {
  let {fullSymbol, maxDelta=0.4, minDelta=0, minOI=10, minCredit=0} = argsObj,
    curDTE,
    BTCAskPrice = null,
    BTCOI = null
  fullSymbol = normalizeFullSymbol(fullSymbol)
  let [matched, tckr, expDt, optType, strike] = fullSymbol.match(/([^\d]+)(\d+)([CP])([\d.]+)/),
    optMapType = optType == 'C' ? 'callExpDateMap' : 'putExpDateMap'
  strike = parseFloat(strike)
  let formattedStrike = strike.toFixed(2),
    fullChain = await fetch(`${getWARPrefix()}/option-chains-latest/${tckr}/latest.json`).then((response) => response.json()),
    optTypeChain = fullChain[optMapType],
    optInfo = findCurOptInfo(optTypeChain, expDt, formattedStrike)
  BTCAskPrice = parseFloat(optInfo['ask'])
  BTCOI = optInfo['openInterest']
  if (!BTCAskPrice) {
    throw new Error(`${fullSymbol} not found in option chain`)
  }
  let result = {
      fullSymbol: fullSymbol,
      tckr: tckr,
      expDt: expDt,
      optType: optType,
      strike: strike,
      curDTE: curDTE,
      maxDelta: maxDelta,
      minDelta: minDelta,
      minOI: minOI,
      minCredit: minCredit,
      BTCAskPrice: BTCAskPrice, 
      BTCOI: BTCOI,
      mark: fullChain['underlying']['mark'],
      dateTime: DateTime.fromMillis(fullChain['underlying']['quoteTime']),
      chainsSearched: {},
      rollsFound: 0
  }
  for (let chainDate in optTypeChain) {
    // chainDate format: 'YYYY-MM-DD:DTE'
    let DTE = parseInt(chainDate.slice(11))
    result.chainsSearched[chainDate] = []
    for (let chainStrike in optTypeChain[chainDate]) {
      let optInfo = optTypeChain[chainDate][chainStrike][0],
        absDelta = Math.abs(optInfo['delta'])
      if (!optInfo['inTheMoney']) {
        if (!optInfo['delta'] !== 'Nan' && optInfo['openInterest'] > minOI && absDelta <= maxDelta && absDelta >= minDelta) {
          let credit = optInfo['bid'] - BTCAskPrice
          if (credit >= minCredit) {
            result.chainsSearched[chainDate].push(optInfo)
            result.rollsFound++
          }
        }
      }
    }
  }
  return result
}

async function createRollResult(resultObj) {
  let r = resultObj,
    numChainsSearched = Object.keys(r.chainsSearched).length,
    withinThreshold = 0.05,
    moneyness = 'seller-OTM' // good
  if ((r.mark >= r.strike && r.optType === 'C') || (r.mark <= r.strike && r.optType === 'P')) {
    moneyness = 'seller-ITM' // bad
  } else if ((r.mark >= r.strike - r.strike * withinThreshold) && (r.mark <= r.strike + r.strike * withinThreshold)) {
    moneyness = 'seller-NTM' // caution
  }

  let earningsNote = ''
  if (ETFs.includes(r.tckr)) {
      earningsNote = `<span class="oh-n-a">E-🗓️: N/A</span>`
  } else {
    try {
      let earningsCal = await fetch(`${getWARPrefix()}/earnings-cal/earnings-cal.json`).then((response) => response.json()),
        earningsDt = earningsCal[r.tckr],
        curDt = DateTime.now(),
        isBeforeMarketClose = curDt.hour < 16
      earningsDt = DateTime.fromFormat(earningsDt, 'yyyy-MM-dd HH:mm:ss')
      let timeToEarnings = Interval.fromDateTimes(curDt, earningsDt)
        daysToEarnings = parseInt(timeToEarnings.length('days') + (isBeforeMarketClose ? 1 : 0))
        earningsNote = `E-🗓️: ${earningsDt.toFormat('MMM d @ H:mm')} <span class="${daysToEarnings < 8 ? 'oh-highlight-warning' : ''}">(${daysToEarnings} days)</span>`
    } catch (error) {
        earningsNote = `E-🗓️: No information found.`
    }
  }

  let curDTEStatusClass = ''
  if (r.curDTE < 5) {
    curDTEStatusClass = 'oh-highlight-alarm'
  } else if (r.curDTE < 9) {
    curDTEStatusClass = 'oh-highlight-warning'
  }
  let resultHeader = `
    <div class="oh-roll-summary">
      <span class="mdi mdi-content-copy" onclick="window.parent.OH.copyToClipboard(this)">${r.fullSymbol}</span>
      <span class="${curDTEStatusClass}">${r.curDTE} DTE</span>
      <span class="oh-${moneyness}">$${r.mark.toFixed(2)}</span>
      Ask: <span class="oh-ask-price">$${r.BTCAskPrice.toFixed(2)}</span>
      ⏱️ <span class="${isObsoleteDateTime(r.dateTime) ? 'oh-highlight-warning' : ''}">
      ${r.dateTime.toFormat('MMM d@H:mm')}
      </span>
      ${earningsNote}
      Found ${r.rollsFound} OTM ${r.optType} rolls in ${numChainsSearched} chains.<br>
      <!-- Not used for now
      Criteria:<br>
      <input type="number" value="${r.minDelta.toFixed(2)}" min="0" max="1">
      &lt;= abs(delta) &lt;= 
      <input type="number" value="${r.maxDelta.toFixed(2)}" min="0" max="1"><br>
      credit &gt;= <input type="number" value="${r.minCredit.toFixed(2)}" min="0">;
      OI &gt;= <input type="number" value="${r.minOI}" min="0"> 
      -->
    </div>
  `
  let headerRow = `<tr class="oh-roll-header"><th>X</th><th colspan="2">-BTC ask + STO bid  = CR</th><th>delta</th><th>OI</th></tr>`,
    rollsTable = '',
    noneFound = 'No OTM credits!',
    lastRollsNotRoundRow = ''
  for (let chain in r.chainsSearched) {
    let [optExpDt, optDTE] = chain.split(':'),
      rollsFound = !!r.chainsSearched[chain].length
    if (!rollsFound) {
      lastRollsNotRoundRow = `
        <tr class="oh-roll-not-found">
          <td colspan=6>${optDTE} DTE (${optExpDt}): ${noneFound}</td>
        </tr>
      `
      continue
    } else {
      rollsTable += `
        <tr class="oh-roll-found">
          <td colspan=6>${optDTE} DTE (${optExpDt}):</td>
        </tr>
      `
    }
    let chainsSearchedChain = r.chainsSearched[chain]
    if (r.optType === 'P') {
      chainsSearchedChain = chainsSearchedChain.reverse()
    }
    chainsSearchedChain.forEach(function (opt, i) {
      rollsTable += `
        <tr class="oh-roll-row-${i % 2 ? 'even' : 'odd'}">
          <td class="oh-roll-strike">${opt.strikePrice}</td>
          <td class="oh-roll-STO-bid-BTC-ask">-$${r.BTCAskPrice.toFixed(2)} + $${opt.bid.toFixed(2)}=</td>
          <td class="oh-roll-credit">$${parseFloat(opt.bid - r.BTCAskPrice).toFixed(2)}</td>
          <td class="oh-roll-delta">${opt.delta.toFixed(2)}</td>
          <td class="oh-roll-oi">${r.BTCOI}&#8658;${opt.openInterest}</td>
        </tr>
      `
    })
  }

  let resultIFrame = createRollResultsIFrame(`
    <div class="oh-roll-results-container oh-${r.optType === 'C' ? 'call' : 'put'}-opt">
      ${resultHeader}
      <div class="oh-roll-results-table-container">
        <table class="oh-roll-results-table">${headerRow}${lastRollsNotRoundRow}${rollsTable}</table>
      </div>
    </div>
  `)
  return resultIFrame
}

function createRollResultsIFrame(html) {
  let jIframe = jq363('<iframe frameborder="0" class="oh-iframe oh-roll-results-iframe" allow="clipboard-write"></iframe>'),
     iframeBody = jIframe.appendTo(document.body).contents().find('body')[0],
    s = document.createElement('script')
  s.id = 'oh-wp-entry-point'
  s.src = `${getWARPrefix()}/scripts/injectedRollResultsIframe.webpack.js`
  iframeBody.appendChild(s)
  jq363(iframeBody).append(html)
  return jIframe
}

function isObsoleteDateTime(luxonDT) {
  // what's considered obsolete? 
  // anything older than 30 min from now during market hours
  // anything older than the previous close
  let now = DateTime.now(),
    diff = now - luxonDT
  if (diff < 0) {
    throw new Error('Time travelers not allowed!')
  }
  if (isDuringMarketHours()) {
    // less than 30 min
    return diff > 30 * 60 * 1000
  } else {
    // if supplied DT is before previous close - 30 min (i.e. 3:30pm), it's obsolete
    return luxonDT < (getPreviousCloseDateTime() - 30 * 60 * 1000)
  }
}

function isDuringMarketHours() {
  let now = DateTime.now()
  if (
    ((now.hour === 9 && now.minute >= 30) || (now.hour > 9 && now.hour < 16)) &&
    (now.weekday >= 1 && now.weekday <= 5)
  ) {
    return true
  } else {
    return false
  }
}

function getPreviousCloseDateTime() {
  let now = DateTime.now(),
    daysToSubtract = ['indexing starts at 1 for monday', 3, 1, 1, 1, 1, 1, 2]
  if (now.hour < 16 || now.weekday == 6 || now.weekday == 7) {
    return now.minus({days: daysToSubtract[now.weekday] }).set({hours: 16, minutes: 0, seconds: 0, milliseconds: 0})
  } else {
    // after 4pm and not Sat or Sun
    return now.set({hours: 16, minutes: 0, seconds: 0})
  }
}

export { updateSavedPositions, findCurOptInfo, findRollsForCredit, normalizeFullSymbol, createRollResult, isObsoleteDateTime }
