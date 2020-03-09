# PPS

Product Project Summariser
To reduce the pain/hassle/faff of a weekly “what is everyone doing?”
A Google worksheet and Slack bot integration

## Introduction

Using a Google worksheet as the data store it's possible for Slack users to:

- Push project updates to the worksheet
- Request summaries/reports of the current state of projects

The worksheet is protected (admin access only), where admins can view all records but, more importantly, create project reports and/or summaries to expose to the Slack users without needing to up-date the Slack bot code or push a code release.

**NB:** This project is at local development stage, setup is described below.

## Overview

A simplified explaination of the process.

- **User** enters a slash command into **Slack**
- **Slack** has a record of the App being queried and passes the request onto the endpoint code
- **Code** (Express) endpoint receives the request
- **Code** sends back the JSON to show the user the Project Status Update form
- **User** receives and fills out form
- **Slack** sends the form data to the on-file endpoint
- **Code** starts processing the submission
  - Sends back a confirmation to the **User**
  - **User** receives a _request in progress_ message
- **Code** sends the data to the **Google spreadsheet** via Google **API**
- **API** confirms insert success
- **Code** sends a response to the **User** confirming the insert
- **User** receives confirmation message
- **User** happy
- ...
- Profit

## Usage

Once the Google worksheet and Slack bot are setup - users can, from any channel, use one of two endpoints **add** and **summary**.

---

### Add

Add a Project Status Update

#### Slack slash commands

- `pps-test-add` (test)
- `pps-add` (live)

Displays a modal window for users to fill in a Project Status Update. Options to add a **Mission**, **Release type**, **Product Name**, **Product phase** and **Release date** are available.

Drop down lists for **Mission** and **Release type** are prefilled with rows populated from their matching spreadsheet data.

Once the user has submitted their data they will recieve a confirmation message once the row has been added, or an error message if there was an issue.

---

### Summary

Request a project report/summary.

#### Slack slash commands

- `pps-test-summary` (test)
- `pps-summary` (live)

Using this command without passing the name of the report will send the requesting user a list of the avaialble reports, populated from it's matching spreadsheet, as a drop down list. Selecting a report for the list sends a request for that report which on being sent to the user replaces the dropdown message.

Any spreadsheets named in the _Reports_ spreadsheet will be avaible in the drop down list.

Passing a parameter will directly request that report.

---

## Setup

You will need:

- A server (local or live)
- Google Sheets API access
- Access to create a Slack bot

### Local

- Clone the repo [https://github.com/ftlabs/PPS](https://github.com/ftlabs/PPS)
- Create a new .env file
  - Run `cp .env_example .env` to do this via command line
- Setup Google Worksheet
  - Create a new sheet copying from the template, or duplicating it into your own work space [https://docs.google.com/spreadsheets/d/1BTNl5c8tj89jTEhEDw-JuKcaVD7N5tsqa2qFtVaZnTs/edit#gid=1526353598](https://docs.google.com/spreadsheets/d/1BTNl5c8tj89jTEhEDw-JuKcaVD7N5tsqa2qFtVaZnTs/edit#gid=1526353598)
  - Get ID of your new sheet
    - ID is located in the URL of the new sheet you just created - `docs.google.com/spreadsheets/d/*ID WILL BE HERE*/edit#gid=123456789`
  - Copy the sheet ID into the **SHEET_ID** varaible in `.env`
- Setup Google keyfile.json
  - In the Google Cloud Console, go to the Create service account key page. [https://console.cloud.google.com/apis/](https://console.cloud.google.com/apis/)
  - From the Service account list, select New service account.
  - In the Service account name field, enter a name.
  - From the Role list, select Project > Editor.
  - Click Create. A JSON file that contains your key downloads to your computer.
  - Add the JSON file to the root of the project as `keyfile.json`
- Setup the Slack app/bot
  - Go to your Slack apps [https://api.slack.com/apps](https://api.slack.com/apps)
  - Click **Create New App**
    - Add a name for your new app
    - Choose **Financial Times** as the Development Slack Workspace
    - Go to _Slash commands_ and add 2 new commands
      - **/pps-<project_name>-add**
        - Short Description: adds project to spreadsheet
        - Request URL: <project_url>/add
      - **/pps-<project_name>-summary**
        - Short Description: gets summary of projects in spreadsheet
        - Request URL: <project_url>/summary
    - Go to _Interactive components_
      - Turn the toggle switch to **on**
      - Update the Request URL
        - <project_url>/submit
    - Go to _Install App_
      - Click **Install App to Workspace**
      - Authorise it to work in FT workspace
      - Copy the _Bot User OAuth Access Token_ and put it in the .env file for **SLACK_TOKEN**
- Now, as long as your server is running, you will be able to receive Slack commends and access the Google Worksheet of your choosing/creation

### Live

Copy the same steps as Local but use Live URLs for each of the endpoints, interactive components etc

**N.B.** It'd be a good idea to make sure the names of your test and live apps are distinct enough taht you (or any collaborators) don't make changes to the wrong one by accident.

## Screenshots

**Project Status Update Form - Empty**
![Project Status Update Form Empty](/docs/img/status_update_form_empty.png?raw=true 'Project Status Update Form Empty')

---

**Project Status Update Form - Filled in**
![Project Status Update Form Filled in](/docs/img/status_update_form_full.png?raw=true 'Project Status Update Form Filled in')

---

**Project Status Update Form - response confirmation message**
![Project Status Update confirmation](/docs/img/status_update_confirmation.png?raw=true 'Project Status Update confirmation')

---

**Project summary - selection list**
![Project summary selection](/docs/img/summary_selection.png?raw=true 'Project summary selection')

---

**Project summary - returned report**
![Project summary returned report](/docs/img/summary_response.png?raw=true 'Project summary returned report')

---

## Create new reports

How to add new reports to the spreadsheet to make them available in Slack.

- Open your Google Spreadsheet
- Create a new tab
- Give it a name (without spaces), e.g. _new_report_
- Update the new sheet with the info you would like in the report
- Add the name of your new report, _new_report_, to the list in the _Report_ sheet
- The report will now be available though the _/summary_ slash command

A few things to bear in mind:

- Slack will wrap the report ASCII tables if they are too wide, there's an approx row width of 70-80 characters

## Todo (future iterations)

- Tie google sheet to channel to make the app flexible for multiple teams
- Load existing project names for autocomplete
- Overview of project evolution
- Record a project against a PO other than yourself.

## Notes

- RE: _Record a project against a PO other than yourself_ - this has been tested in early development stage using Slack’s `users_select` and requires extra API calls to extract the username from the slack user id.
- PPS is already added to Slack, and works in any channel.
- At this stage of development, the messages are only visible to users who triggered them, and not the whole channel; it is however recommended to use a private channel for testing purposes.
- You can stop the app after changes and run `npm start` again without stopping ngrok, which will make testing easier.
- Slack has a response timeout of 3 seconds, which is why the Slack provided _request_url_ is utilised to send responses to longer requests outside of that timeout window
