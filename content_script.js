// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function sha256(str) {
  // We transform the string into an arraybuffer.
  var buffer = new TextEncoder("utf-8").encode(str);
  return crypto.subtle.digest("SHA-256", buffer).then(function (hash) {
    return hex(hash);
  });
}

function hex(buffer) {
  var hexCodes = [];
  var view = new DataView(buffer);
  for (var i = 0; i < view.byteLength; i += 4) {
    // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
    var value = view.getUint32(i)
    // toString(16) will give the hex representation of the number without padding
    var stringValue = value.toString(16)
    // We use concatenation and slice for padding
    var padding = '00000000'
    var paddedValue = (padding + stringValue).slice(-padding.length)
    hexCodes.push(paddedValue);
  }

  // Join all the hex strings into one
  return hexCodes.join("");
}

var socket;

var socketSend = function(msg) {
  socket.send(JSON.stringify(msg));
}

var startMirroring = function() {
  if (socket)
    return;

  sha256(window.location.href)
    .then(function(hashString) {

      const serverURL = 'ws://localhost:8765/projector/'+ hashString;

      socket = new WebSocket(serverURL);
      var mirrorClient;

      socket.onopen = function() {
        socketSend({ base: location.href.match(/^(.*\/)[^\/]*$/)[1] });
        mirrorClient = new TreeMirrorClient(document, {
          initialize: function(rootId, children) {
            socketSend({
              f: 'initialize',
              args: [rootId, children]
            });
          },

          applyChanged: function(removed, addedOrMoved, attributes, text) {
            socketSend({
              f: 'applyChanged',
              args: [removed, addedOrMoved, attributes, text]
            });
          }
        });
      }

      socket.onclose = function() {
        mirrorClient.disconnect();
        socket = undefined;
      }

    });
  }



var stopMirroring = function() {
  if (socket)
    socket.close();
  socket = undefined;
}

window.addEventListener('load', function() {
  chrome.extension.sendMessage({ mirror : true}, function(response) {
    if (response.mirror) {
      startMirroring();
    } else {
      stopMirroring();
    }
  });
});


