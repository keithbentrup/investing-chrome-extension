import $ from 'jquery'
import linksHTML from '../../html/links.html'

import '../../styles/popup.scss'

$(document.body).append(linksHTML)

console.log('hi from the popup script!')

$(document.body).append(`
  <input type="text" id="oh-input" placeholder="enter a ticker" />
  
`)