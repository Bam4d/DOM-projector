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

var mirroring = false;
var activeTab;
var windowId;

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

chrome.browserAction.onClicked.addListener(function(tab) {
  if (mirroring) {
    //chrome.tabs.executeScript(activeTab, { code: 'stopMirroring();' });
    mirroring = false;
    activeTab = undefined;
    windowId = undefined;
  } else {
    mirroring = true;
    windowId = tab.windowId;
    mirrorTab(tab.id);
  }
});

function mirrorTab(tabId) {
  if (tabId == activeTab)
    return;
    

  // if (activeTab)
  //   chrome.tabs.executeScript(activeTab, { code: 'stopMirroring();' });

  activeTab = tabId;

  chrome.tabs.executeScript(activeTab, { code: 'startMirroring();' });
}

// chrome.tabs.onActiveChanged.addListener(function(tabId, selectInfo) {
//   if (!mirroring)
//     return;

//   if (selectInfo.windowId != windowId)
//     return;

//   mirrorTab(tabId);
// });

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  if (!mirroring || sender.tab.id !== activeTab)
    sendResponse({ mirror: false });
  else
    sendResponse({ mirror: true });
});