# XMTP Next.js GM agent

This agent replies `gm` to all messages.

## Getting started

### Requirements

- Node.js v20 or higher
- Next.js v14 or higher
- Yarn v4 or higher

### Environment variables

To run your XMTP agent, you must create a `.env` file with the following
variables:

```bash
WALLET_KEY= # the private key of the wallet
ENCRYPTION_KEY= # encryption key for the local database
XMTP_ENV=dev # local, dev, production
```

## Run the agent

```bash
# git clone repo
git clone https://github.com/xmtp/xmtp-nextjs-app.git
# go to the folder
cd xmtp-nextjs-app
# install packages
yarn
# run the agent
yarn dev
```
