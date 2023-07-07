import $ from 'jquery'
import { getTLD } from '../lib/util.mjs'

import '../../styles/content.scss'
import '../../styles/nav-iframe.scss'

import linksHTML from '../../html/links.html'

console.log('Hi from nav iframe!')

$(document.body).append(linksHTML)

// highlight the links related to the current TLD
$('li').each(function () {
  let jLi = $(this)
  if (jLi.find('a').attr('href').indexOf(getTLD(parent)) !== -1) {
    jLi.addClass('oh-current-TLD')
  }
})

$('.mdi-toggle-switch').on('click', function (ev) {
  // let parent = this.contentWindow.document.body.ownerDocument
  // console.log('click', this, window.parent.document)
  // console.log('test wp', $('.oh-roll-results-iframe', window.parent.document))
  $('.oh-roll-results-iframe', window.parent.document).toggle()
  ev.preventDefault()
})

$('.mdi-arrow-left-circle-outline, .mdi-arrow-right-circle-outline').on('click', function (ev) {
  let open = {
      left: -110
    },
    close = {
      left: 0
    }
  $('.oh-nav-links', window.parent.document).css(
    /right/.test(ev.target.className) ? close : open
  )
  $('.mdi-arrow-left-circle-outline, .mdi-arrow-right-circle-outline').toggle()
  ev.preventDefault()
})