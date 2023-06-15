import jq363 from 'jquery'
// import { createNavIFrame } from '../lib/util.mjs'

import '../../styles/nav-parent.scss'

console.log('On seekingalpha.com!')

//jq363(createNavIFrame)

// never want /finance to be home, so redirect to /finance/portfolio/watchlist
function redirectFromUselessSeekingAlphaIndex () {
  if (location.href === 'https://seekingalpha.com/index') {
    location.href = 'https://seekingalpha.com/home'
  }
}
redirectFromUselessSeekingAlphaIndex()

jq363(function () {
  let previousUrl = '',
    observer = new MutationObserver(function(mutations) {
    if (location.href !== previousUrl) {
      previousUrl = location.href
      redirectFromUselessSeekingAlphaIndex()
    }
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})