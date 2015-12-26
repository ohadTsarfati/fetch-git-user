var snabbdom = require('snabbdom'),
	patch = snabbdom.init([ // Init patch function with choosen modules
	  require('snabbdom/modules/class'), // makes it easy to toggle classes
	  require('snabbdom/modules/props'), // for setting properties on DOM elements
	  require('snabbdom/modules/style'), // handles styling on elements with support for animations
	  require('snabbdom/modules/eventlisteners'), // attaches event listeners
	]),
	h = require('snabbdom/h'),
	viewNode = document.querySelector('#view'),
	data = [],
	errorID = 0;


/*************************/
/***View Rendering module*/
/*************************/
var viewModule = (function(view, fetchesList){
	
	//function that updates the app's view
	function updateView(user){
		var queryNode, 
			listNode,
			newVnode
			queryName = user || '',
		//breaking the view into two sections
		queryNode = queryNodeBuilder(queryName);
		listNode = fetchesListBuilder();
		var newVnode = h('div.container',[queryNode,listNode]);
		view = patch(view,newVnode);
	}	

	function queryNodeBuilder(name){ 
	  	return h('div.query', [
	  			h('form.form-inline',[
	    			h('input.form-control', {props: {type: 'text', placeholder: 'Enter a github user name'}, 
	    				on: { input: updateQuery }}),
	    			h('div.btn.btn-info',{on:{click:[fetchUser,name]}},'Fetch!')
	    		]),
	    		h('div',[
	    			h('h1','Hold Tight!'),
	    			h('p','We`re about to fetch: "' + name + '"')
	    		])
	  		]);
		
		// rendering the view when the user name is typed
		function updateQuery(e){
			updateView(e.target.value);
		};

		//fires an event for fatching a user information according to
		//the name entered in the input field
		function fetchUser(name){
			EventBus.fireEvent('fetch','user',[name]);
		}
	}

	//results a list view
	function fetchesListBuilder(){
		return h('ul.fetched',listCreator());

		// creating the new node as a list from the existing data array
		function listCreator(){
			return fetchesList.filter(function(element){
				return element.type;
			})
			.map(function(element){
				if (element.type == 'error'){
					return h('li.bg-danger.clearfix',viewError(element));
				}
				else if (element.type == 'user'){
					return h('li.bg-success.clearfix',viewUser(element));
				}
			});	

		}
		/*creating a user li*/
		function viewUser(element){
			return [
					h('img',{props: {src : element.avatarURL}}),
					h('div',[
							h('p','User name: ' + element.userName)
							,h('p','Public repositories: ' + element.numberOfRepos)
					]),
					h('i.glyphicon.glyphicon-thumbs-up',{on: {click: changeIcon}},'')
			];

			// on click function for the user li item to change the thumb icon
			function changeIcon(e){
				var element = e.currentTarget;
				var baseClasses = 'glyphicon glyphicon-thumbs-';
				
				if (element.className.indexOf('up') !== -1){
					element.className = baseClasses + 'down';
				} else if(element.className.indexOf('down') !== -1){
					element.className = baseClasses + 'up';
				}
			}	
		}
		
		/*creating an error li*/
		function viewError(element){
			return [
					h('i.glyphicon.glyphicon-info-sign'),
					h('p','error loading from github'),
					h('i.glyphicon.glyphicon-remove',{on: {click: [removeErrorMessage,element.errorNumber]}},'')
			];

			// fires event for removing the error from the data list
			function removeErrorMessage(removedErrorNumber){
				EventBus.fireEvent('removeError','removeError',[removedErrorNumber]);
			}	
		}		
	}

	//registering the view rendering event
	EventBus.registerEvent('renderView','updateView',updateView);

}(viewNode, data));

/************************************/
/** list of git fetch events module */
/***********************************/
var githubFetchesModule = (function(fetchesList){
	
	//updating the data array with an error element or user element
	//according to the fetch result
	function newData(){
		var dataObj = {},
			name = arguments[0] || '';
		
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
			//parsing the response to Json object
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
			fetchesList.push(dataObj);
			EventBus.fireEvent('renderView');
		}
		//creating error element
		function addErrorMessage(){
			errorID++;
			dataObj = {
				type: 'error',
				errorNumber: errorID
			}
			fetchesList.push(dataObj);
			EventBus.fireEvent('renderView');			
		}
	}
	
	//removing the error message from the data array
	function removeError(errorNumber){
		// the filter return true for users typed elements
		// and error messages with different id number than the error message
		// we would like to remove
		fetchesList.forEach(function(element){
			if (element.type === 'error' && element.errorNumber === errorNumber){
				element.type = undefined; 
			}
		});
		//firing the event for changing the list view
		EventBus.fireEvent('renderView');
	}


	EventBus.registerEvent('removeError','removeError',removeError);
	EventBus.registerEvent('fetch','user',newData);

}(data));



	
/* Runing the app */
EventBus.fireEvent('renderView');