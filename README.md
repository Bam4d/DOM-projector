# DOM-projector
based on https://github.com/rafaelw/mutation-summary, creates a multiple channel dom sharing service

The server by default runs on port 8080.

A new "Channel" for dom projections is created every time the chrome extension is started with a new url.

The "Channel" is an sha-256 hash of the url of the page that is being projected.

## Starting the server

`cd server`
`node server.js`

## Chrome extension

the chrome extension can be added by loading this directory as an (unpacked extension)[https://stackoverflow.com/questions/24577024/install-chrome-extension-not-in-the-store]


## TODO

* channels are leaked if they are destroyed, app can easily be restarted, but will need to configure the tabs again.
* UI has very little feedback in terms of displaying what is being projected