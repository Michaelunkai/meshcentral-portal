# MeshCentral Global

This repository contains a public, secret-free deployment package for a
MeshCentral server. It is designed for a host that supports long-lived Node.js
processes and WebSockets, such as a Render Web Service. Vercel and Netlify
static hosting can serve the gateway page but cannot replace the MeshCentral
agent server.

## Deploy

Use the Render Blueprint button for this repository, or create a Render Web
Service from it and select the Free plan. `render.yaml` creates a generated
session key and a generated initial administrator password; read that password
from the private service environment after deployment. The default hostname is
`https://meshcentral-global.onrender.com/`.

The package stores MeshCentral state under `/data`. A free Render instance has
an ephemeral filesystem and sleeps after inactivity, so this is a test/hobby
deployment. For durable unattended management, attach persistent storage or an
external supported database and use a paid always-on service.

## Important limits

The public URL can remain reachable while the server is online, but a managed
PC cannot accept a terminal session while it is powered off, disconnected, or
asleep. No hosting provider can change that physical requirement. The agent
must be installed on the PC and must reconnect after network or host restarts.

Never commit `meshcentral-data`, certificates, passwords, session keys, agent
installers, or database files. The repository intentionally contains none of
those items.

