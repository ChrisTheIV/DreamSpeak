# `server.js`

Owns the local static file server for the MVP.

It serves:
- `public/index.html`
- browser assets under `public/`

Does not own:
- app state
- audio logic
- UI behavior

Inputs:
- incoming HTTP requests
- `PORT` environment variable

Outputs:
- static file responses for the local browser session
