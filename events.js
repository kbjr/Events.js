/*
|------------------------------------------------
| Events.js
|------------------------------------------------
|
| A super-awesome JavaScript event handler library.
|
| @author     James Brumond
| @version    0.1.1-beta
| @copyright  Copyright 2011 James Brumond
| @license    Dual licensed under MIT and GPL
|
*/

window.Events = (new (function() {
	
	var
	self = this,
	handlers = [ ],
	
	// Special events
	specialEvents = {
		mouseenter: {
			attachesTo: 'mouseover',
			eventTest: function(evt) {
				return (withinElement(evt, evt.originalTarget(), 'fromElement'));
			}
		},
		mouseleave: {
			attachesTo: 'mouseout',
			eventTest: function(evt) {
				return (withinElement(evt, evt.originalTarget(), 'toElement'));
			}
		},
		hashchange: {
			bind: function(target, func) {
				HashChangeFix.addEventListener(func);
			},
			unbind: function(target, func) {
				HashChangeFix.removeEventListener(func);
			},
			invoke: function(target) {
				HashChangeFix.despatchEvent();
			}
		}
	},

// ----------------------------------------------------------------------------
//  Build the onhashchange fix

	HashChangeFix = (new (function() {

		var
		self2       = this,
		pollerRate  = 25,
		callStack   = [ ],
		
		/**
		 * Fetch the current hash value
		 *
		 * @access  private
		 * @return  string
		 */
		fetch = function() {
			var matches = (location + '').match(/^[^#]*(#.+)$/);
			return matches ? matches[1] : '';
		},
	
		/**
		 * Sets a new hash value
		 *
		 * @access  private
		 * @param   string    the new value
		 * @return  void
		 */
		assign = function(value) {
			if (value[0] !== '#') { value = '#' + value; }
			location.hash = value;
		},
	
		/**
		 * Checks if the client supports the onhashchange event
		 *
		 * @access  private
		 * @param   boolean   override the current value
		 * @return  boolean
		 */
		supportsOnhashchange = (function() {
			var nativeSupport = false;
			return function(support) {
				if (typeof support === 'boolean') {
					nativeSupport = support;
				}
				return nativeSupport;
			};
		}()),
		
		/**
		 * Builds the event objects
		 *
		 * @access  private
		 * @param   string    the oldURL value
		 * @param   object    extra info to pass in
		 * @return  object
		 */
		buildEventObject = function(old, info) {
			return self.buildEventObject('hashchange', { }, merge({
				oldURL: old,
				newURL: location + ''
			}, (info || { })));
		},
	
		/**
		 * Call the functions in the stack
		 *
		 * @access  private
		 * @param   string    the old URL
		 * @return  mixed
		 */
		run = function(evt) {
			var ret;
			for (var i = 0, c = callStack.length; i < c; i++) {
				ret = callStack[i].call(window, evt);
			}
			if (evt.returnValue != null) {
				ret = evt.returnValue;
			}
			return ret;
		},
	
		/**
		 * Sets up the onhashchange emulator for non-support clients
		 *
		 * @access  private
		 * @return  void
		 */
		poller = (function() {
			var
			lastValue       = fetch(),
			lastLocation    = location + '',
			pollerStarted   = false,
			pollerInterval  = null;
			return {
				start: function() {
					if (! pollerStarted) {
						pollerStarted = true;
						pollerInterval = window.setInterval(function() {
							var current = fetch();
							if (current !== lastValue) {
								lastValue = current;
								if (! supportsOnhashchange()) {
									self2.dispatchEvent(lastLocation);
								}
								lastLocation = location + '';
							}
						}, pollerRate);
					}
				},
				stop: function() {
					if (pollerStarted) {
						pollerStarted = false;
						window.clearInterval(pollerInterval);
					}
				}
			};
		}()),
		
		/**
		 * The event function
		 */
		eventFunction = function(e) {
			var e = e || window.event,
			isEmulated = e._isEmulated || false;
			// If support is marked as false, but we get a native event, stop the poller
			if (! supportsOnhashchange() && ! isEmulated) {
				supportsOnhashchange(true);
				poller.stop();
			}
			return run(e);
		};
	
		/**
		 * Initialize the hashchange fix engine
		 *
		 * @access  public
		 * @return  void
		 */
		self2.init = function() {
			// Attach the listener
			attachListener(window, 'hashchange', eventFunction);
			// If onhashchange is not native, add it
			if (! supportsOnhashchange()) {
				poller.start();
			}
		};
	
		/**
		 * Add an event function
		 */
		self2.addEventListener = function(func) {
			callStack.push(func);
		};
		
		/**
		 * Remove an event function
		 */
		self2.removeEventListener = function(func) {
			var newStack = [ ];
			for (var i = 0, c = callStack.length; i < c; i++) {
				if (callStack[i] !== func) {
					newStack.push(callStack[i]);
				}
			}
			callStack = newStack;
		};
		
		/**
		 * Invoke the event
		 */
		self2.dispatchEvent = function(info) {
			return run(buildEventObject(location + '', info));
		};

	})()),
	
	
	
// ----------------------------------------------------------------------------

	/**
	 * EventController Class
	 * 
	 * @access  private
	 * @return  void
	 */
	EventController = function(event, target) {

		var
		self2       = this,
		isCanceled  = false,
		event       = event,
		target      = target,
		namespace   = null;
	
		/**
		 * Event properties
		 */
		self2.target = self2.srcElement = target;
		for (var i in event) {
			if (event.hasOwnProperty(i) && typeof event[i] !== 'function') {
				self2[i] = event[i];
			}
		}
	
		/**
		 * Get the mouse position of the event
		 *
		 * Reliable in "modern" browsers, but not so much in some
		 * legacy browsers due to a decision to avoid browser sniffing
		 *
		 * @access  public
		 * @return  object {
		 *           x: number,
		 *           y: number
		 *          }
		 */
		self2.mousePosition = function() {
			var posx = 0;
			var posy = 0;
			if (event.pageX || event.pageY) {
				posx = event.pageX;
				posy = event.pageY;
			} else if (event.clientX || event.clientY) {
				posx = event.clientX + document.body.scrollLeft
					+ document.documentElement.scrollLeft;
				posy = event.clientY + document.body.scrollTop
					+ document.documentElement.scrollTop;
			}
			return { x: posx, y: posy };
		};
	
		/**
		 * Get the event object
		 *
		 * @access  public
		 * @return  object
		 */
		self2.eventObject = function() {
			return event;
		};
	
		/**
		 * Get the original target element (the one that "bind" was
		 * called on)
		 *
		 * @access  public
		 * @return  Element
		 */
		self2.originalTarget = function() {
			return target;
		};
	
		/**
		 * Stops event bubbling/propagation
		 *
		 * @access  public
		 * @return  void
		 */
		self2.stopPropagation = function() {
			if (typeof event.stopPropagation == 'function') {
				event.stopPropagation();
			}
			event.cancelBubble = true;
		};
	
		/**
		 * Cancel the default event response
		 *
		 * @access  public
		 * @return  void
		 */
		self2.cancelDefault = function() {
			if (! isCanceled) {
				isCanceled = true;
				if (typeof event.preventDefault == 'function') {
					event.preventDefault();
				}
				event.returnValue = false;
			}
		};
	
		/**
		 * Checks if the cancelDefault() method has called
		 *
		 * @access  public
		 * @return  boolean
		 */
		self2.isDefaultCanceled = function() {
			return isCanceled;
		};

	},

// ----------------------------------------------------------------------------

	/**
	 * EventFunction Class
	 *
	 * @access  private
	 * @param   function  the callback on the event
	 * @return  void
	 */
	EventFunction = function(func, parent) {

		var
		self   = this,
		parent = parent;
		func   = func || undefined;
	
		// test for valid parameters
		if (typeof func !== 'function') {
			return undefined;
		}
	
		/**
		 * Call the event function
		 *
		 * @access  public
		 * @param   mixed     call scope (this)
		 * @param   object    the event object
		 * @return  mixed
		 */
		self.call = function(scope, event) {
			return func.call(scope, event);
		};

	},

// ----------------------------------------------------------------------------

	/**
	 * Event Class
	 *
	 * @access  private
	 * @param   Element   the target element
	 * @param   string    the event to handle
	 * @return  void
	 */
	EventWrapper = function(target, event) {

		var
		self2   = this,
		target  = target || null,
		event   = event  || null,
		funcs   = { },
		stop    = false,
		isBound = false,
		
		/**
		 * Get the storage object for a given namespace path
		 *
		 * @access  private
		 * @param   array     the namespace path
		 * @return  object
		 */
		getNamespace = function(namespaces) {
			var current = funcs;
			for (var i = 0, c = namespaces.length; i < c; i++) {
				var ns = namespaces[i];
				if (typeof current[ns] !== 'object') {
					current[ns] = { };
				}
				current = current[ns];
			}
			if (typeof current['.'] !== 'object') {
				current['.'] = [ ];
			}
			return current;
		};
		
		/**
		 * Register a new function for this event
		 *
		 * @access  public
		 * @param   function  the event function
		 * @param   array     the namespace to store the event under
		 * @return  void
		 */
		self2.registerFunction = function(func, namespaces) {
			var namespace = getNamespace(namespaces);
			namespace['.'].push(new EventFunction(func, self2));
		};
	
		/**
		 * Removes a namespace from the call stack
		 *
		 * @access  public
		 * @param   array     the namespace path to remove
		 * @return  void
		 */
		self2.removeNamespace = function(namespaces) {
			if (namespaces && namespaces.length) {
				var ns = namespaces.pop(),
				namespace = getNamespace(namespaces);
				namespace[ns] = { };
			} else {
				funcs = { };
			}
		};
	
		/**
		 * Run the event stack for this event
		 *
		 * @access  public
		 * @param   object    the event object
		 * @return  boolean
		 */
		self2.run = function(evt, controller) {
			var controller = controller || new EventController(evt, target),
			runFuncs = function(lvl) {
				var result = null;
				for (var i in lvl) {
					if (lvl.hasOwnProperty(i)) {
						if (i === '.') {
							for (var j = 0, c = lvl[i].length; j < c; j++) {
								result = lvl[i][j].call(target, controller);
								if (result === false) {
									controller.cancelDefault();
								}
							}
						} else {
							result = runFuncs(lvl[i]);
						}
					}
				}
				return result;
			};
			var result = runFuncs(funcs);
			return (controller.isDefaultCanceled() ? false : result);
		};
		
	// ----------------------------------------------------------------------------
	//  Handle special events
	
		if (event in specialEvents) {
			var spec = specialEvents[event],
			hasBinds =!! (spec.bind && spec.unbind),
	
			/**
			 * Runs the event's functions
			 *
			 * @access  public
			 * @param   object    the event object
			 * @return  boolean
			 */
			runEvent = function(evt) {
				var
				run = true,
				evt = evt || window.event,
				cont = false;
				if (! hasBinds) {
					cont = new EventController(evt, target);
					run =! spec.eventTest(cont);
				}
				if (run) {
					return self2.run(evt);
				}
			};
			
			/**
			 * Do the actual event binding
			 *
			 * @access  public
			 * @return  void
			 */
			self2.bindEvent = function() {
				if (! isBound) {
					isBound = true;
					if (hasBinds) {
						spec.bind(target, runEvent);
					} else {
						attachListener(target, spec.attachesTo, runEvent);
					}
				}
			};
	
			/**
			 * Do the actual event unbinding
			 *
			 * @access  public
			 * @return  void
			 */
			self2.unbindEvent = function() {
				if (isBound) {
					isBound = false;
					if (hasBinds) {
						spec.unbind(target, runEvent);
					} else {
						detachListener(target, spec.attachesTo, runEvent);
					}
				}
			};
			
		}
		
	// ----------------------------------------------------------------------------
	//  Handle regular events
	
		else {
			
			var runEvent = function(evt) {
				return self2.run(evt || window.event);
			};
			
			/**
			 * Do the actual event binding
			 *
			 * @access  public
			 * @return  void
			 */
			self2.bindEvent = function() {
				if (! isBound) {
					isBound = true;
					attachListener(target, event, runEvent);
				}
			};
	
			/**
			 * Do the actual event unbinding
			 *
			 * @access  public
			 * @return  void
			 */
			self2.unbindEvent = function() {
				if (isBound) {
					isBound = false;
					detachListener(target, event, runEvent);
				}
			};
			
		}
	
	// ----------------------------------------------------------------------------
	//  Initialize the listener
		
		self2.bindEvent();

	},

// ----------------------------------------------------------------------------

	/**
	 * EventHandler Class
	 *
	 * @access  private
	 * @param   Element   the target element
	 * @return  void
	 */
	EventHandler = function(target) {

		var
		self2   = this,
		target  = target || null,
		events  = { };
	
		// Add this object to the event handlers stack
		handlers.push(self2);
		
		/**
		 * Gets the target of these events
		 *
		 * @access  public
		 * @return  object
		 */
		self2.getTarget = function() {
			return target;
		};
	
		/**
		 * Registers an event in this handler
		 *
		 * @access  public
		 * @param   string    the event
		 * @param   function  the event callback
		 * @return  void
		 */
		self2.registerEvent = function(event, func) {
			// Check for valid parameters
			if (typeof event !== 'string' || typeof func !== 'function') { return false; }
		
			// Seperate the event from the namespace
			var eventStr = event.split('.'), namespaces;
			event = eventStr.shift();
			namespaces = eventStr;
		
			// Remove the 'on...' if there is one
			if (startsWithOn.test(event)) {
				event = event.substring(2);
			}
		
			// Check if there is already a handler for this event
			if (events[event] === undefined) {
				events[event] = new EventWrapper(target, event);
			}
		
			// Register the new function
			events[event].registerFunction(func, namespaces);
		};
	
		/**
		 * Unbinds an event namespace
		 *
		 * @access  public
		 * @param   string    the event/namespace
		 * @return  void
		 */
		self2.removeEvent = function(event) {
			var event = event || false, segments;
			
			// Check for parameter validtiy
			if (typeof event !== 'string') { return false; }
			
			// Remove all events bound to the target
			if (event === '*') {
				for (var i in events) {
					if (events.hasOwnProperty(i)) {
						events[i].removeNamespace(false);
					}
				}
				return true;
			}
			
			// Seperate the event from the namespace string
			segments = event.split('.');
			event = segments.shift();
			
			// Remove the namespace
			events[event].removeNamespace(segments);
		};
	
	},

	
	
// ----------------------------------------------------------------------------
//  Helper functions
	
	startsWithOn = /^on/,
	startsWithDOM = /^DOM/,
	
	/**
	 * Attaches an event listener
	 *
	 * @access  private
	 * @param   object    the event target
	 * @param   string    the event
	 * @param   function  the callback
	 * @return  void
	 */
	attachListener = function(target, event, func) {
		if (target.addEventListener) {
			if (startsWithOn.test(event)) {
				event = event.substring(2);
			}
			target.addEventListener(event, func, false);
		} else if (target.attachEvent) {
			if (! startsWithDOM.test(event) && ! startsWithOn.test(event)) {
				event = 'on' + event;
			}
			target.attachEvent(event, func);
		} else {
			throw new YourBrowserFailsError('Could not attach event listener');
		}
	},
	
	/**
	 * Detaches an event listener
	 *
	 * @access  private
	 * @param   object    the event target
	 * @param   string    the event
	 * @param   function  the callback
	 * @return  void
	 */
	detachListener = function(target, event, func) {
		if (target.removeEventListener) {
			if (startsWithOn.test(event)) {
				event = event.substring(2);
			}
			target.removeEventListener(event, func, false);
		} else if (target.detachEvent) {
			if (! startsWithDOM.test(event) && ! startsWithOn.test(event)) {
				event = 'on' + event;
			}
			target.detachEvent(event, func);
		} else {
			throw new YourBrowserFailsError('Could not detach event listener');
		}
	},
	
	/**
	 * Invoke an event listener
	 *
	 * @access  private
	 * @param   object    the event target
	 * @param   string    the event
	 * @return  mixed
	 */
	invokeListener = function(target, event, info) {
		var evt;
		if (target.despatchEvent) {
			if (startsWithOn.test(event)) {
				event = event.substring(2);
			}
			evt = self.buildEventObject(target, event, info);
			target.despatchEvent(evt);
		} else if (target.fireEvent) {
			if (! startsWithDOM.test(event) && ! startsWithOn.test(event)) {
				event = 'on' + event;
			}
			evt = self.buildEventObject(target, event, info);
			target.fireEvent(event, evt);
		} else {
			throw new YourBrowserFailsError('Could not invoke event listener');
		}
	},
	
	/**
	 * Gets the current event target
	 *
	 * @access  private
	 * @param   object    the event object
	 * @param   object    a default used in the case of
	 *                    the bug documented below
	 * @return  object
	 */
	getEventTarget = function(e, def) {
		var targ = false;
		if (e.target) { targ = e.target; }
		else if (e.srcElement) { targ = e.srcElement; }
		
		// FIXME: This could also be document, but it is a fringe case
		// and I can't think of any other way of testing, so this will
		// have to do for now. This is an IE-only bug.
		if (! targ && e.srcElement === null) { targ = def || window; }
		
		// Defeat Safari bug
		if (targ.nodeType == 3) {
			targ = targ.parentNode;
		}
		return targ;
	},
	
	/**
	 * Check if an event came from inside of a given element
	 *
	 * @access  private
	 * @param   object    the event object
	 * @param   Element   the element in question
	 * @param   string    the fallback property if relatedTarget is not defined
	 * @return  boolean
	 */
	withinElement = function(evt, elem, fallback) {
		var targ = evt.relatedTarget, ret;
		if (targ == null) {
			targ = evt[fallback] || null;
		}
		try {
			while (targ && targ !== elem) {
				targ = targ.parentNode;
			}
			ret = (targ === elem);
		} catch(e) { ret = false; }
		return ret;
	},
	
	/**
	 * Gets an event handler by element
	 *
	 * @access  private
	 * @param   object    the target
	 * @return  EventHandler
	 */
	getHandlerByTarget = function(target) {
		for (var i = 0; i < handlers.length; i++) {
			if (handlers[i].getTarget() === target) {
				return handlers[i];
			}
		}
		return false;
	},

	/**
	 * Fetch an event handler for a given target
	 *
	 * @access  private
	 * @param   object    the target
	 * @return  EventHandler
	 */
	getEventHandler = function(target) {
		var handler = getHandlerByTarget(target);
		if (handler) {
			return handler;
		} else {
			return new EventHandler(target);
		}
	},
	
	/**
	 * Merges the contents of objects together
	 *
	 * @access  private
	 * @param   ...       the objects to merge
	 * @return  object
	 */
	merge = function() {
		var objects = Array.prototype.slice.call(arguments, 0), ret = { };
		for (var i = 0, c = objects.length; i < c; i++) {
			for (var j in objects[i]) {
				if (objects[i].hasOwnProperty(j)) {
					ret[j] = objects[i][j];
				}
			}
		}
		return ret;
	},
	
	/**
	 * Checks if an array contains a value
	 *
	 * @access  private
	 * @param   mixed     the value to look for
	 * @param   array     the array to look in
	 * @return  boolean
	 */
	
	contains = function(value, arr) {
		for (var i = 0, c = arr.length; i < c; i++) {
			if (arr[i] === value) { return true; }
		}
		return false;
	};
	
// ----------------------------------------------------------------------------
//  External functions
	
	self.log = (function() {
		var logger = null,
		getLogger = function() {
			if (logger == null) {
				if (typeof window.console !== 'undefined') {
					if (typeof window.console.log.apply === 'function') {
						logger = function() {
							window.console.log.apply(window.console, arguments);
						};
					} else {
						logger = function() {
							window.console.log(arguments);
						};
					}
				} else if (typeof console !== 'undefined') {
					logger = function() {
						console.log.apply(console, arguments);
					};
				} else {
					logger = function() { };
				}
			}
			return logger;
		};
		return function() {
			// Get the arguments
			var args = Array.prototype.slice.call(arguments, 0);
			if (typeof args[0] === 'string') {
				args[0] = '[' + Date() + '] - ' + args[0];
			}
			// Do the logging
			getLogger().apply(this, args);
		};
    }());
	
	self.bind = function(target, event, func) {
		var handler = getEventHandler(target);
		return handler.registerEvent(event, func);
	};
	
	
	self.unbind = function(target, event) {
		var handler = getEventHandler(target);
		return handler.removeEvent(event);
	};
	
	self.specialEvents = {
		exists: function(name) {
			return (specialEvents[name] != null);
		},
		add: function(name, info) {
			if (specialEvents[name] == null) {
				specialEvents[name] = info;
			}
		},
		edit: function(name, info) {
			if (specialEvents[name] != null) {
				for (var i in info) {
					if (info.hasOwnProperty(i)) {
						specialEvents[name][i] = info[i];
					}
				}
			}
		},
		del: function(name) {
			if (specialEvents[name] != null) {
				specialEvents[name] = null;
			}
		}
	};
	
	self.invoke = function(target, event, info) {
		return invokeListener(target, event, info);
	};
	
	self.buildEventObject = (function() {
	
		// DOM2 event modules
		var eventTypes = {
			HTMLEvents: ['abort', 'blur', 'change', 'error', 'focus', 'load', 'reset',
				'resize', 'scroll', 'select', 'submit', 'unload', 'hashchange' ],
			UIEvents: ['DOMActivate', 'DOMFocusIn', 'DOMFocusOut' ],
			KeyEvents: ['keydown', 'keypress', 'keyup' ],
			MouseEvents: ['click', 'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup' ],
			MutationEvents: ['DOMAttrModified', 'DOMNodeInserted', 'DOMNodeRemoved', 'DOMCharacterDataModified',
				'DOMNodeInsertedIntoDocument', 'DOMNodeRemovedFromDocument', 'DOMSubtreeModified']
		},
		
		// Get the correct DOM2 event module for an event
		getEventModule = function(type) {
			var result = 'Events';
			for (var i in eventTypes) {
				if (eventTypes.hasOwnProperty(i)) {
					if (contains(type, eventTypes[i])) {
						// Test for browser support of the module
						if (i === 'KeyEvents' && ! window.KeyEvent) { i = 'UIEvents'; }
						if (document.implementation.hasFeature(i, '2.0') || window[i.substring(0, i.length - 1)]) { i = 'Events'; }
						// We found our module, stop looping
						result = i;
						return false;
					}
				}
			}
			return result;
		},
		
		defaultInfo = {
			useDefaults: false,
			bubbles: true,
			cancelable: false
		},
		
		defaultUI = {
			winObj: window,
			detail: 1
		},
		
		defaultKey = {
			winObj: window,
			ctrlKey: false,
			altKey: false,
			shiftKey: false,
			metaKey: false,
			keyCode: 0,
			charCode: 0
		},
		
		defaultMouse = {
			winObj: window,
			ctrlKey: false,
			altKey: false,
			shiftKey: false,
			metaKey: false,
			button: 0,
			relatedTarget: null
		},
		
		defaultMutation = {
			relatedNode: null,
			prevValue: null,
			newValue: null,
			attrName: null,
			attrChange: null
		};
		
		// DOM2 module based initializing
		if (document.createEvent) {
			return function(type, info, extra) {
				var
				module    = getEventModule(event),
				obj       = document.createEvent(module),
				origInfo  = info,
				info      = info || { };
				// Initialize the object correctly for the event
				if (typeof origInfo !== 'object' || info.useDefaults) { module = 'Events'; }
				switch (module) {
					case 'Events':
					case 'HTMLEvents':
						info = merge(defaultInfo, info);
						obj.initEvent(type, info.bubbles, info.cancelable);
					break;
					case 'UIEvents':
						info = merge(defaultInfo, defaultUI, info);
						obj.initUIEvent(type, info.bubbles, info.cancelable, info.winObj, info.detail);
					break;
					case 'KeyEvents':
						info = merge(defaultInfo, defaultKey, info);
						obj.initKeyEvent(type, info.bubbles, info.cancelable, info.winObj, info.ctrlKey,
							info.altKey, info.shiftKey, info.metaKey, info.keyCode, info.charCode);
					break;
					case 'MouseEvents':
						info = merge(defaultInfo, defaultMouse, info);
						obj.initMouseEvent(type, info.bubbles, info.cancelable, info.winObj, info.screenX,
							info.screenY, info.clientX, info.clientY, info.ctrlKey, info.altKey, info.shiftKey,
							info.metaKey, info.button, info.relatedTarget);
					break;
					case 'MutationEvents':
						info = merge(defaultInfo, defaultMutation, info);
						obj.initMutationEvent(type, info.bubbles, info.cancelable, info.relatedNode, info.prevValue,
							info.newValue, info.attrName, info.attrChange);
					break;
				}
				Jsk.utils.forIn(extra, function(i) {
					obj[i] = extra[i];
				});
				return obj;
			};
		}
		
		// Internet explorer DOM2-ish initializing
		else if (document.createEventObject) {
			return function(type, info, extra) {
				var
				obj   = document.createEventObject(),
				info  = merge(defaultInfo, (info || { }), extra);
				for (var i in info) {
					if (info.hasOwnProperty(i)) {
						obj[i] = info[i];
					}
				}
				return obj;
			};
		}
		
		// DOM1 fallback initializing
		else {
			return function(type, info, extra) {
				return merge({
					type: type,
					timeStamp: (new Date()).getTime(),
					target: target,
					srcElement: target,
					currentTarget: target,
					defaultPrevented: false
				}, defaultInfo, (info || { }), (extra || { }), {
					bubbles: false
				});
			};
		}
	}());
	
	// Initialize the hashchange fix
	HashChangeFix.init();
	
})());

// ----------------------------------------------------------------------------
//  Add my own personal error constructor :D

if (typeof window.YourBrowserFailsError === 'undefined') {
	window.YourBrowserFailsError = function(msg) {
		// Make sure it is called with "new"
		if (! this instanceof YourBrowserFailsError) {
			return new YourBrowserFailsError(msg);
		}
		// Get an actual error object for the stack
		var err = (function() {
			var err;
			try { (0)(); } catch (e) { err = e; }
			return err;
		}());
		// Set the error message
		this.name    = 'YourBrowserFailsError';
		this.message = msg;
		this.stack   = err.stack || 'Could not get a stack. MORE FAILS!!';
	};
}

/* End of file events.js */
