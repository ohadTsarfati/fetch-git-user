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
	//data holds all the responses we've got from trying to fetch users
	// holds both errors and users elements
	data = [],
	errorID = 0;

/* Runing the app */
queryNode = patch(queryNode, queryView(''));

/*******************/
/**Views functions */
/*******************/

//query view rendering
function queryView(name){ 
  return h('div.query', [
    h('form.form-inline',[h('input.form-control', {
      props: { type: 'text', placeholder: 'Enter a github user name' },
      on: { input: updateQuery }
    }),h('div.btn.btn-info',{on:{click:[newData,name]}},'Fetch!')]),
    h('div',[h('h1','Hold Tight!'),h('p','We`re about to fetch: "' + name + '"')])
  ]);
}


//results list view rendering
function renderData(){
	return h('ul.fetched',listCreator());

	// creating the new node as a kist fron the existing data
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

	function changeIcon(e){
		element = e.currentTarget;
		if (element.className.indexOf('up') !== -1){
			element.className = 'glyphicon glyphicon-thumbs-down';
		}
		else if(element.className.indexOf('down') !== -1){
			element.className = 'glyphicon glyphicon-thumbs-up';
		}
	}

	function viewUser(element){
		return [h('img',{props: {src : element.avatarURL}}),
				h('div',[h('p','User name: ' + element.userName)
						,h('p','Public repositories: ' + element.numberOfRepos)]),
				h('i.glyphicon.glyphicon-thumbs-up',{on: {click: changeIcon}},'')];
	}

	function viewError(element){
		return [h('i.glyphicon.glyphicon-info-sign'),
			h('p','error loading from github'),
			h('i.glyphicon.glyphicon-remove',{on: {click: [removeErrorMessage,element.errorNumber]}},'')];
	}	
}


/***************/
/* Controllers */
/***************/

//updating the query when typing
function updateQuery(event) {
  var newVnode = queryView(event.target.value);
  queryNode = patch(queryNode, newVnode);
}


//updating the data array with an error element or user element
//according to the fetch result
function newData(name){
	
	var dataObj = {};
	
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
		listNode = patch(listNode, renderData());
	}
	//creating error element
	function addErrorMessage(){
		errorID++;
		dataObj = {
			type: 'error',
			errorNumber: errorID
		}
		data.push(dataObj);
		listNode = patch(listNode, renderData());
	}
}
//removing the error message from the data array 
// calls the view rendering function
function removeErrorMessage(removedErrorNumber){
	data = data.filter(function(element){
		return element.type === 'user' || element.errorNumber !== removedErrorNumber;
	});
	listNode = patch(listNode, renderData());
}
