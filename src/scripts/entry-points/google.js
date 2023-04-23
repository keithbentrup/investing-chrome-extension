import jq363 from 'jquery'
import { createNavIFrame } from '../lib/util.mjs'

import '../../styles/nav-parent.scss'

console.log('On google.com!')

jq363(createNavIFrame)

// never want /finance to be home, so redirect to /finance/portfolio/watchlist
function redirectFromUselessGoogleFinanceHome () {
  if (location.href === 'https://www.google.com/finance/') {
    location.href = 'https://www.google.com/finance/portfolio/watchlist'
  }
}
redirectFromUselessGoogleFinanceHome()

jq363(function () {
  let previousUrl = '',
    observer = new MutationObserver(function(mutations) {
    if (location.href !== previousUrl) {
      previousUrl = location.href
      redirectFromUselessGoogleFinanceHome()
    }
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})