# fetch-git-user

This app fetches github user information according to his github user name.

Built this app using:
1. snabbdom
2. fetch API
3. github search API
4. vanilla JavaScript,

The app is managed by an eventbus.

The app is constructed of two different modules:

* View module - resposible for rendering the whole view 
  Registered events:
  * 'renderView'-'updateView' - updating the app's view


* List of fetches module - responsible for updating the fetches model(a list of attempts to fetch information from github), any fetch can end with retriving and presenting the user's information or an error message. 
  Registered events:
  * 'fetch'-'user' - fetching a user and adding it to the data list, if fails adds an error message.
  * 'removeError' - 'removeError' - removing an error from the fetches list

