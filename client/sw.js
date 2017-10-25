/*
adapted from https://gist.github.com/matthiasg/56b5915c61cbc6a384d9

from https://gist.github.com/adactio/fbaa3a5952774553f5e7

https://googlechrome.github.io/samples/service-worker/custom-offline-page/
https://github.com/phamann/embrace-the-network/blob/master/src/stale-while-revalidate/sw.js
https://github.com/GoogleChrome/sw-toolbox#defining-routes
https://github.com/mozilla/serviceworker-cookbook/tree/master/virtual-server

OTHER:
https://googlechrome.github.io/samples/service-worker/post-message/index.html


https://serviceworke.rs/

*/

// Update 'version' if you need to refresh the cache
var staticCacheName = 'static';
var version = 'v1.0.7::';
var CACHE = version + staticCacheName;

self.addEventListener('activate', function (event) {
  event.waitUntil(clearStaleCaches());
});

self.addEventListener('install', function (event) {
  event.waitUntil(updateStaticCache());
});

self.addEventListener('fetch', fetchHandler);
//self.addEventListener('fetch', serveCacheAndUpdate); //alternate


// --- FUNCTION DEFS -----------------------------------------------------------
// (will be hoisted because using function keyword)

// Store core files in a cache (including a page to display when offline)
function updateStaticCache() {
  return caches.open(version + staticCacheName)
    .then(function (cache) {
      return cache.addAll([
        './images/launcher-icon-3x.png',
        './css/raleway.css',
        './css/flickity.css',
        './css/bootstrap.3.3.4.min.css',
        './css/skeleton.css',
        './css/cents.css',
        './css/font-awesome.min.css',
        './fonts/fontawesome-webfont.woff?v=4.4.0',
        './fonts/-_Ctzj9b56b8RgXW8FAriQzyDMXhdD8sAj6OAJTFsBI.woff2 ',
        './js/jquery.2.1.3.min.js',
        './js/flickity.pkgd.js',
        './js/highcharts.4.2.2.js',
        './js/moment.2.18.1.min.js',
        './js/accountData.js',
        './js/popup.js',
        './js/app.js',
        './offline.html'
      ]);
    });
}

function clearStaleCaches(){
  return caches.keys()
    .then(function (keys) {
      // Remove caches whose name is no longer valid
      return Promise.all(keys
        .filter(function (key) {
          return key.indexOf(version) !== 0;
        })
        .map(function (key) {
          return caches.delete(key);
        })
      );
    });
}

function offlineResponse(request){
  // If the request is for an image, show an offline placeholder
  // if (!!~request.headers.get('Accept').indexOf('image')) {
  //   return new Response('<svg width="400" height="300" role="img" aria-labelledby="offline-title" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><title id="offline-title">Offline</title><g fill="none" fill-rule="evenodd"><path fill="#D8D8D8" d="M0 0h400v300H0z"/><text fill="#9B9B9B" font-family="Helvetica Neue,Arial,Helvetica,sans-serif" font-size="72" font-weight="bold"><tspan x="93" y="172">offline</tspan></text></g></svg>', { headers: { 'Content-Type': 'image/svg+xml' } });
  // }

  if(!!~request.headers.get('Accept').indexOf('application/json')){ 
    const fallbackResponse = {
      error: "offline"
    };
    const jsonResponse = new Response(JSON.stringify(fallbackResponse), {
      headers: {'Content-Type': 'application/json'}
    });
    return jsonResponse;
  }
  const htmlResponse = caches.match('./offline.html');
  return htmlResponse;
}

function fetchHandler(event){
  var request = event.request;
  const isGetRequest = request.method !== 'GET';
  const isHTMLRequest = !!~request.headers.get('Accept').indexOf('text/html');
  const isJSONRequest = !!~request.headers.get('Accept').indexOf('application/json');

  // non-GET requests, -> NETWORK -> OFFLINE
  if (isGetRequest) {
    netOffline(event);
    return;
  }

  // HTML requests, -> NETWORK -> CACHE -> OFFLINE
  if (isHTMLRequest || isJSONRequest) {
    cacheNetUpdateNotify(event);
    //netCacheOfflineUpdate(event);
    return;
  }

  // non-HTML requests, CACHE -> NETWORK -> OFFLINE
  cacheNetOfflineUpdate(event);
}

function netOffline(event){
  var request = event.request;
  event.respondWith(
    fetch(request)
      .catch(function () {
        return offlineResponse(request);
      })
  );
}

function cacheNetOfflineUpdate(event){
  var request = event.request;
  event.respondWith(
    caches.match(request)
      .then(function (response) {
        // CACHE -> NET
        return response || fetch(request)
          .then((response) => {
            return update(request);
            // UPDATE
            // if(response){
            //   caches.open(version + staticCacheName)
            //   .then(function (cache) {
            //     cache.put(request, response.clone());
            //   });
            //   return response;
            // }
          })
          .catch(function () {
            // OFFLINE
            return offlineResponse(request);
          });
      })
  );
}

function netCacheOfflineUpdate(event){
  var request = event.request;
  event.respondWith(
    fetch(request)
      .then(function (response) {
        // Stash a copy of this page in the cache
        // tag as cached if json
        var clone = response.clone();

        if(isJSONRequest){
          clone.json().then(json => {
            json.cached = true;
            var jsonRes = new Response(JSON.stringify(json), { 
              headers: {
                'content-type': 'application/json'
              }
            });
            caches.open(version + staticCacheName)
            .then(function (cache) {
              cache.put(request, jsonRes);
            });
          });
          return response;
        }

        caches.open(version + staticCacheName)
          .then(function (cache) {
            cache.put(request, clone);
          });
        return response;
      })
      .catch(function () {
        return caches.match(request)
          .then(function (response) {
            return response || offlineResponse(request);
          });
      })
  );
}


// https://serviceworke.rs/strategy-cache-update-and-refresh_demo.html
function cacheNetUpdateNotify(event){
  var request = event.request;

  event.respondWith(fromCacheOrOffline(request));
  event.waitUntil(
    update(request)
    .then(refresh)
  );
}

// Open the cache where the assets were stored and search for the requested
// resource. Notice that in case of no matching, the promise still resolves
// but it does with `undefined` as value.
function fromCacheOrOffline(request) {
  return caches.open(CACHE)
    .then(function (cache) {
      return cache.match(request) || offlineResponse(request);
  });
}


// Update consists in opening the cache, performing a network request and
// storing the new response data.
function update(request) {
  return caches.open(CACHE).then(function (cache) {
    return fetch(request).then(function (response) {
      return cache.put(request, response.clone()).then(function () {
        return response;
      });
    });
  });
}

// Sends a message to the clients.
function refresh(response) {
  return self.clients.matchAll().then(function (clients) {
    clients.forEach(function (client) {
      // Encode which resource has been updated. By including the
      // [ETag](https://en.wikipedia.org/wiki/HTTP_ETag) the client can
      // check if the content has changed.
      var message = {
        type: 'refresh',
        url: response.url,
        // Notice not all servers return the ETag header. If this is not
        // provided you should use other cache headers or rely on your own
        // means to check if the content has changed.
        eTag: response.headers.get('ETag')
      };
      // Tell the client about the update.
      client.postMessage(JSON.stringify(message));
    });
  });
}

