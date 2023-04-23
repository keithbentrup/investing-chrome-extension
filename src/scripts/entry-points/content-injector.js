import { getTLD, getWARPrefix } from "../lib/util.mjs"

let TLD = getTLD()
console.log('Hi from the injector script!', TLD)

let s = document.createElement('script')
s.id = 'oh-wp-entry-point'
s.src = `${getWARPrefix()}/scripts/${TLD ? TLD : 'localhost'}.webpack.js`
document.documentElement.appendChild(s)
