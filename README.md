# PPS
Product Project Summariser

NB: This project is at local development stage, setup is described below.

## Setup
Note: other parts of this setup are detailed in the project doc.

1. Clone the repo, `npm install`, make sure you have the environment variables set up.
2. `npm start`
3. For local development, `ngrok` is required. Run ngrok in a separate Terminal tab
4. In the Slack app replace the URL for `Slash Commands` and `Interactive Components` with your current https ngrok URL
5. Test with `/pps-add` in Slack

Some notes: 
- PPS is already added to Slack, and works in any channel. 
- At this stage of development, the messages are only visible to users who triggered them, and not the whole channel; it is however recommended to use a private channel for testing purposes.
- You can stop the app after changes and run `npm start` again without stopping ngrok, which will make testing easier.

## TODO
Todos are listed in the project doc.