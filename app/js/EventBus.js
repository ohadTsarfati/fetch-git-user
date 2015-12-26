var EventBus = (function(){
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
	function fire(eventName, funcName, args){
        var specific = funcName || 'ALL',
        	callbacks = events[eventName];

        if(!events[eventName]){    
            return;
        }
 
        for (func in callbacks) {
            if(callbacks.hasOwnProperty(func) && typeof callbacks[func] === "function" && (specific === "ALL" || specific === func)){
	            callbacks[func].apply(undefined, args);                
            }
        }
    }
	

	return {
		registerEvent: register,
		removeEvent: remove,
		fireEvent: fire
	}
}());