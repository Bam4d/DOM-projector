// Copyright 2012 Google Inc.
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

var WebSocket = require('faye-websocket');
var http      = require('http');
var fs        = require('fs');

var server = http.createServer();

fs.readFile('mirror.html', function(err, mirrorHTML) {
  fs.readFile('mirror.js', function(err, mirrorJS) {
    fs.readFile('tree_mirror.js', function(err, treeMirrorJS) {

      server.addListener('request', function(request, response) {
        if (request.url == '/mirror.html' || request.url == '/' || request.url == '/index.html') {
          response.writeHead(200, {'Content-Type': 'text/html'});
          response.end(mirrorHTML);
          return;
        }

        if (request.url == '/mirror.js') {
          response.writeHead(200, {'Content-Type': 'text/javascript'});
          response.end(mirrorJS);
          return;
        }

        if (request.url == '/tree_mirror.js') {
          response.writeHead(200, {'Content-Type': 'text/javascript'});
          response.end(treeMirrorJS);
          return;
        }

        console.error('unknown resource: ' + request.url);
      });
    });
  });
});

var messages = {};
var receivers = {};
var projectors = {};

server.addListener('upgrade', function(request, rawsocket, head) {
  var socket = new WebSocket(request, rawsocket, head);

  // Projector.
  var channelRegex = new RegExp("/(projector|receiver)/(.*)");

  var channelMatcher = request.url.match(channelRegex);

  if(channelMatcher == null || channelMatcher.length <= 1) {
    console.log("cannot retreive channel from url.", request.url);
    return;
  } 

  var clientType = channelMatcher[1];
  var channel = channelMatcher[2];

  if (clientType == 'projector') {

    if (projectors[channel]) {
      console.log('closing existing projector. setting messages to 0');
      projectors[channel].close();
      messages[channel].length = 0;
    } else {
      projectors[channel] = [];
      receivers[channel] = [];
      messages[channel] = []
    }

    console.log('projector connection initiating. channel:' + channel);

    projectors[channel] = socket;

    messages[channel].push(JSON.stringify({ clear: true }));

    receivers[channel].forEach(function(socket) {
      socket.send(messages[channel][0]);
    });


    socket.onmessage = function(event) {
      console.log('message received. now at ' + messages[channel].length + ' . sending to ' + receivers[channel].length);
      receivers[channel].forEach(function(receiver) {
        receiver.send(event.data);
      });

      messages[channel].push(event.data);
    };

    socket.onclose = function() {
      console.log('projector closing, clearing messages');
      messages[channel].length = 0;
      receivers[channel].forEach(function(socket) {
        socket.send(JSON.stringify({ clear: true }));
      });

      projectors[channel] = undefined;
    }

    console.log('projector open completed.')
    return;
  }

  // Receivers.
  if (clientType == 'receiver') {

    if(!projectors[channel]) {
      console.log("Channel " + channel + " does not exist.");
      socket.close();
      return;
    }

    console.log('reciever connection initiating. channel:' + channel);

    receivers[channel].push(socket);

    console.log('receiver opened. now at ' + receivers[channel].length + ' sending ' + messages[channel].length + ' messages');
    socket.send(JSON.stringify(messages[channel]));


    socket.onclose = function() {
      var index = receivers[channel].indexOf(socket);
      receivers[channel].splice(index, 1);
      console.log('receiver closed. now at ' + receivers[channel].length);
    }
  }
});

server.listen(8765);