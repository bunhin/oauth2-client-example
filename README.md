oauth2-client-example
=====================

A Basic OAuth 2.0 Client Example Web Server App.

This is a simple Node.js OAuth 2.0 Client web server app that allows you to
connect to an OAuth 2.0 Server for authentication and see the returned
Access and Refresh Tokens. This app is only for development and testing
purposes. It should NOT be used in production. The app is modeled off of
Google's [OAuth 2.0 for Web Server Applications](https://developers.google.com/accounts/docs/OAuth2WebServer)
as an OAuth 2.0 Client.  It should work to connect to Google's or xTuple's
OAuth 2.0 Servers.

Install and Run the App
-----------------------
    git clone git@github.com:xtuple/oauth2-client-example.git
    cd oauth2-client-example
    npm install
    # Or run that as root if you have problems.
    # sudo npm install
    node app.js

Open your browser and go to:
> [http://localhost:3000](http://localhost:3000)

Using the Example
-----------------
In the browser you will first be presented with an "OAuth 2.0 Client Settings"
form. Fill out the form with the setting you received from the OAuth 2.0 Server
when you registered this OAuth 2.0 Client on the Server. Be sure to add this
Client's Redirect URL to the Server's settings. You can find the Redirect URI
in the "OAuth 2.0 Client Settings" form.

Next, click "Save Client Settings". You will then be prompted to
"Login using the OAuth 2.0 Server". Click that link and login to the OAuth 2.0
Server. Approve the access request and you will be redirected back to this
OAuth 2.0 Client where it will display your Access and Refresh Tokens. You can
also click on "Refresh Access Token" on that page to get a new Access Token.

The Access Token displayed can then be used to make REST requests to the OAuth
2.0 Server's REST API.

## Credits

  - [bendiy](http://github.com/bendiy)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2012-2013 xTuple [http://www.xtuple.com/](http://www.xtuple.com/)
