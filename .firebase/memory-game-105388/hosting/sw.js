if(!self.define){let s,e={};const i=(i,n)=>(i=new URL(i+".js",n).href,e[i]||new Promise((e=>{if("document"in self){const s=document.createElement("script");s.src=i,s.onload=e,document.head.appendChild(s)}else s=i,importScripts(i),e()})).then((()=>{let s=e[i];if(!s)throw new Error(`Module ${i} didn’t register its module`);return s})));self.define=(n,l)=>{const r=s||("document"in self?document.currentScript.src:"")||location.href;if(e[r])return;let t={};const u=s=>i(s,r),o={module:{uri:r},exports:t,require:u};e[r]=Promise.all(n.map((s=>o[s]||u(s)))).then((s=>(l(...s),t)))}}define(["./workbox-b994f779"],(function(s){"use strict";self.skipWaiting(),s.clientsClaim(),s.precacheAndRoute([{url:"assets/index-5HiE0TGr.css",revision:null},{url:"assets/index-BFS5l9_j.js",revision:null},{url:"assets/index-legacy-B7rG8YwY.js",revision:null},{url:"assets/index9-legacy-CY8IM479.js",revision:null},{url:"assets/index9-usOOKorz.js",revision:null},{url:"assets/input-shims-DuXrE1-h.js",revision:null},{url:"assets/input-shims-legacy-CIfzeCfE.js",revision:null},{url:"assets/ios.transition-C55pawaF.js",revision:null},{url:"assets/ios.transition-legacy-CDy6QV24.js",revision:null},{url:"assets/md.transition-CWP81qVo.js",revision:null},{url:"assets/md.transition-legacy-CadFHmjK.js",revision:null},{url:"assets/polyfills-legacy-p5hxArwn.js",revision:null},{url:"assets/status-tap-legacy-CszUFXOu.js",revision:null},{url:"assets/status-tap-YLcDGhtB.js",revision:null},{url:"assets/swipe-back-Cxld1rEa.js",revision:null},{url:"assets/swipe-back-legacy-CNitDDjO.js",revision:null},{url:"index.html",revision:"c559c1393b0bf264ce1664362d8711de"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"assets/img/icons/0.75x/memoryldpi.png",revision:"0c0474499806d42664b4dcbc87770a29"},{url:"assets/img/icons/1x/memory.png",revision:"96306714500656f6259e81d99801d640"},{url:"manifest.webmanifest",revision:"0f547f167b7a30051b4f0fa19846b306"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL("index.html"))),s.registerRoute(/\/assets\/img\/.*\.(?:png|jpg|jpeg|svg)$/,new s.CacheFirst({cacheName:"images-cache",plugins:[new s.ExpirationPlugin({maxEntries:50,maxAgeSeconds:2592e3})]}),"GET")}));
