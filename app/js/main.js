var snabbdom = require('snabbdom'),
	patch = snabbdom.init([ // Init patch function with choosen modules
	  require('snabbdom/modules/class'), // makes it easy to toggle classes
	  require('snabbdom/modules/props'), // for setting properties on DOM elements
	  require('snabbdom/modules/style'), // handles styling on elements with support for animations
	  require('snabbdom/modules/eventlisteners'), // attaches event listeners
	]),
	h = require('snabbdom/h'),
	queryNode = document.querySelector('#query-view'),
	listNode = document.querySelector('.list'),
	EventBus = (function(){
		// List of all the events
		// it would look like this {eventName:{funcName:callback}}
		var events = {};
		// Register event listener
		function register(eventName,funcName,callback){
		    if(!events[eventName]){
		        events[eventName] = {};
		    }
		    events[eventName][funcName] = callback;   
		}
		// removing an event listener
		function remove(eventName,funcName){
		    if(!evebts[eventName]){
		    	return;
		    }
		    if(!events[evName][fName]){
		    	return;
		    }
		    events[evName][fName] = null;
		}
		// firing the event
		function fire(eventName, funcName,args){
	        var specific = funcName || 'ALL',
	        	callbacks = events[eventName];

	        if(!events[eventName]){    
	            return;
	        }
	 
	        for (func in callbacks) {
	            if(callbacks.hasOwnProperty(func) && typeof callbacks[func] === "function" && (specific === "ALL" || specific === func)){
		            callbacks[func](args);                
	            }
	        }
	    }
		

		return {
			registerEvent: register,
			removeEvent: remove,
			fireEvent: fire
		}
	}());


/*******************/
/**Query Module ***/
/*******************/

var queryModule = (function(currentNode){
	function queryNodeBuilder(name){ 
	  return h('div.query', [
	    h('form.form-inline',[h('input.form-control', {
	      props: { type: 'text', placeholder: 'Enter a github user name' },
	      on: { input: updateQuery }
	    }),h('div.btn.btn-info',{on:{click:[fetchUser,name]}},'Fetch!')]),
	    h('div',[h('h1','Hold Tight!'),h('p','We`re about to fetch: "' + name + '"')])
	  ]);
	}
	function queryView(args){
		var testEvent = args[0].target ? args[0].target.value : '';
		var newVnode = queryNodeBuilder(testEvent);
	  	currentNode = patch(currentNode, newVnode);
	}
	//fires an event for fatching a user information according to
	//the name entered in the input field
	function fetchUser(name){
		EventBus.fireEvent('fetch','user',[name]);
	}

	function updateQuery(ev){
		EventBus.fireEvent('renderView','queryView',[ev]);
	}

	EventBus.registerEvent('renderView','queryView',queryView);
}(queryNode));

/************************************/
/** list of git fetch events module */
/***********************************/
var githubFetchesModule = (function(currentNode){
	//data holds all the responses we've got from trying to fetch users
	// holds both errors and users elements
	var data = [],
		errorID = 0;

	//results a list view
	function fetchesListBuilder(){
		return h('ul.fetched',listCreator());

		// creating the new node as a list from the existing data array
		function listCreator(){
			return data.map(function(element){
				if (element.type == 'error'){
					return h('li.bg-danger.clearfix',viewError(element));
				}
				else if (element.type == 'user'){
					return h('li.bg-success.clearfix',viewUser(element));
				}
			})
		}
		/*creating a user li*/
		function viewUser(element){
			return [h('img',{props: {src : element.avatarURL}}),
					h('div',[h('p','User name: ' + element.userName)
							,h('p','Public repositories: ' + element.numberOfRepos)]),
					h('i.glyphicon.glyphicon-thumbs-up',{on: {click: changeIcon}},'')];
		}
		// on click function for the user li item
		function changeIcon(e){
			var element = e.currentTarget;
			if (element.className.indexOf('up') !== -1){
				element.className = 'glyphicon glyphicon-thumbs-down';
			}
			else if(element.className.indexOf('down') !== -1){
				element.className = 'glyphicon glyphicon-thumbs-up';
			}
		}
		/*creating an error li*/
		function viewError(element){
			return [h('i.glyphicon.glyphicon-info-sign'),
				h('p','error loading from github'),
				h('i.glyphicon.glyphicon-remove',{on: {click: [removeErrorMessage,element.errorNumber]}},'')];
		}
		//removing the error message from the data array 
		// fires event for rendering the list
		function removeErrorMessage(removedErrorNumber){
			// the filter return true for users typed elements
			// and error messages with different id number than the error message
			// we would like to remove
			data = data.filter(function(element){
				return element.type === 'user' || element.errorNumber !== removedErrorNumber;
			});
			//firing the event for changing the list view
			EventBus.fireEvent('renderView','listView');
		}
	}

	//updating the data array with an error element or user element
	//according to the fetch result
	function newData(args){
		
		var dataObj = {},
			name = args[0] || '';
		
		fetchFromGitAPI('repositories','q=+user:' + name)
		.then(setReposData)
		.then(setUserData)
		.catch(addErrorMessage);

		function fetchFromGitAPI(table, query){
			//checking if the http request suceeded
			function checkHttpResponse(response){
				if (response.status >= 200 && response.status <= 304){
					return response;
				}
				else{
					var error = new Erorr(response.statusText);
					error.response = response;
					throw error;
				}
			}
			//parsing te response to Json object
			function parseJson(response){
				return response.json();
			}
			return fetch('https://api.github.com/search/' + table + '?' + query)
			.then(checkHttpResponse)
			.then(parseJson);
		}

		function setReposData(userRepos){
			dataObj.numberOfRepos = userRepos.total_count;
			return fetchFromGitAPI('users', 'q=' + name);
		}
		//pulling the users avatar url pushes to the main data array
		// and calls the view rendering function
		function setUserData(usersInfo){
			dataObj.avatarURL = usersInfo.items[0].avatar_url;
			dataObj.userName = name;
			dataObj.type = 'user';
			data.push(dataObj);
			EventBus.fireEvent('renderView', 'listView');
		}
		//creating error element
		function addErrorMessage(){
			errorID++;
			dataObj = {
				type: 'error',
				errorNumber: errorID
			}
			data.push(dataObj);
			EventBus.fireEvent('renderView', 'listView');			
		}
	}
	
	EventBus.registerEvent('fetch','user',newData);
	
	//function that creates a list view using the data builder
	function listView(){
		var newVnode = fetchesListBuilder();
		currentNode = patch(currentNode,newVnode);
	}
	EventBus.registerEvent('renderView','listView',listView);
}(listNode));



	
/* Runing the app */
EventBus.fireEvent('renderView', 'ALL',['']);