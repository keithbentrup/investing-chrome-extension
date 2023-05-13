import $ from 'jquery'
import linksHTML from '../../html/links.html'
import searchHTML from '../../html/search.html'

import '../../styles/popup.scss'

$(document.body).append(linksHTML)
$(document.body).append(searchHTML)

console.log('hi from the popup script!')

// on enter in the search box, search for the ticker
$('#oh-tckr-input').on(`keyup`, (e) => {
  if (e.key === 'Enter') {
    const tckr = $('#oh-tckr-input').val().toUpperCase(),
      urls = []
    $('.oh-tckr-link').each((i, el) => {
      urls.push($(el).data('url').replace('{{tckr}}', tckr))
    })
    chrome.windows.create({ url: urls })
  }
})

$('.oh-tckr-link').on('click', (e) => {
  console.log('clicked', e)
  const tckr = $('#oh-tckr-input').val().toUpperCase(),
    url = $(e.target).data('url').replace('{{tckr}}', tckr)
  chrome.tabs.create({ url: url })
})