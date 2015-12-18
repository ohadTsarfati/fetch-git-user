# fetch-git-user

This app fetches github user information according to his github user name.

Built this app using:
1. snabbdom
2. fetch API
3. github search API
4. vanilla JavaScript,

The app is managed by an eventbus.

The app is constructed of two different modules:

* Query module - resposible for creating and updating the top section of the app.
  Registered events:
  * 'renderView'-'queryView' - updating the query section view


* List of fetches module - responsible for creating and updating a section that presents a list of attempts to fetch information from github, any fetch can end with retriving and presenting the user's information or an error message. 
  Registered events:
  * 'fetch'-'user' - fetching a user and adding it to the data list.
  * 'renderView' - 'listView' - updating the list of attempts for fetching data from github

