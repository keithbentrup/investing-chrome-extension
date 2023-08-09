# investing-chrome-extension


[MDI class name lookup](https://pictogrammers.com/library/mdi/)



jQuery, CSPs, and TrustHTML
jQuery doesn't work with certain CSPs because it will attempt to run compatability checks for shimming immediately (when it loads) before trusted type policies can be established, so it breaks.

https://github.com/jquery/jquery/issues/5094
https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/require-trusted-types-for

https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/

V2 method: https://www.namogoo.com/privacy-security/how-browser-extensions-routinely-bypass-a-content-security-policy/#:~:text=Chrome%20extensions%20can%20decide%20which,'default%2Dsrc'%20directive.