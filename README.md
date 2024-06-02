# investing-chrome-extension


[MDI class name lookup](https://pictogrammers.com/library/mdi/)



jQuery, CSPs, and TrustHTML
jQuery doesn't work with certain CSPs because it will attempt to run compatability checks for shimming immediately (when it loads) before trusted type policies can be established, so it breaks.

https://github.com/jquery/jquery/issues/5094
https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/require-trusted-types-for

https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/

V2 method: https://www.namogoo.com/privacy-security/how-browser-extensions-routinely-bypass-a-content-security-policy/#:~:text=Chrome%20extensions%20can%20decide%20which,'default%2Dsrc'%20directive.


# webpack conversion
- transitioning to webpack by slowing moving assets from app to src
- for now: gulp is still being used to build assets; webpack to bundle
- manifest.json has localhost match for testing during transition
- `python3 -m http.server -d src` is being used to host `http://localhost:8000/portfolio.html`
- python webserver to WP dev server may be possible in the future to provide hot reloading, but currently WP dev server has default behavior that i don't yet understand
- most pressing current issue is getting CSS to load from `link` tags instead of `style` tags in a deterministic way 
  - BECAUSE need to load that css in dynamic iframes
  - HOWEVER there may be option to load the js that loads the css via new webpack.config.js entry point
    - may actually be better so don't have to import CSS into content pages when only destined for iframes (don't currently know how to prevent that)

# Chrome extension notes

important v3 restrictions:
remote assets not allowed unless injected indirectly this applies to css and remote
- indirect method involves content script that writes script/content to include remote assets including WAR assets
- also significant limitation in dev tools for local unpacked chrome extension
  - can't modify an injected style in the chrome extension (why?! obviously this should be fine for devs)
  - can't auto reload the css (again should be allowable for devs)
  - fixed by not using `css` key of manifest and just using javascript to inject the styles
also no permissioned capability of an extension allows inspection of a http response
- to inspect the http response body of an XHR, you can override the XHR methods

why wrap in iframes? need to protect from other css