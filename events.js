/*
|------------------------------------------------
| Events.js
|------------------------------------------------
|
| A super-awesome JavaScript event handler library.
|
| @author     James Brumond
| @version    0.2.1-beta
| @copyright  Copyright 2011 James Brumond
| @license    Dual licensed under MIT and GPL
|
*/

var Events = (new (function() {
	
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
		},
		keystroke: {
			attachesTo: 'keydown',
			eventTest: function(evt) {
				return Keystroke.runTest(evt, evt.getNamespace().split('.')[0]);
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
	 * Keystroke handler object
	 *
	 * @access  private
	 *
	 * Based on the keyboard shortcuts library by Binny V A
	 * @link     http://www.openjs.com/scripts/events/keyboard_shortcuts/
	 * @license  BSD License
	 */
	Keystroke = (function() {

		var defaults = {
			type: 'keydown',
			propagate: false,
			disable_in_input: true,
			target: document,
			keycode: false
		},

		// Work around for stupid Shift key bug created by using lowercase -
		// as a result the shift+num combination was broken
		shift_nums = {
			'`': '~', '1': '!',
			'2': '@', '3': '#',
			'4': '$', '5': '%',
			'6': '^', '7': '&',
			'8': '*', '9': '(',
			'0': ')', '-': '_',
			'=': '+', ';': ':',
			'\'': '"', ',': '<',
			'.': '>', '/': '?',
			'\\': '|'
		},

		// Special Keys - and their codes
		special_keys = {
			'esc':       27,
			'escape':    27,
			'tab':       9,
			'space':     32,
			'return':    13,
			'enter':     13,
			'backspace': 8,

			'scrolllock':  145,
			'scroll_lock': 145,
			'scroll':      145,
			'capslock':    20,
			'caps_lock':   20,
			'caps':        20,
			'numlock':     144,
			'num_lock':    144,
			'num':         144,
	
			'pause': 19,
			'break': 19,
	
			'insert': 45,
			'home':   36,
			'delete': 46,
			'end':    35,
	
			'pageup':    33,
			'page_up':   33,
			'pu':        33,
			'pagedown':  34,
			'page_down': 34,
			'pd':        34,

			'left':  37,
			'up':    38,
			'right': 39,
			'down':  40,

			'f1':  112,
			'f2':  113,
			'f3':  114,
			'f4':  115,
			'f5':  116,
			'f6':  117,
			'f7':  118,
			'f8':  119,
			'f9':  120,
			'f10': 121,
			'f11': 122,
			'f12': 123
		},

		modifiers = function() {
			return { 
				shift: { wanted:false, pressed:false },
				ctrl:  { wanted:false, pressed:false },
				alt:   { wanted:false, pressed:false },
				meta:  { wanted:false, pressed:false }	// Meta is Mac specific
			};
		},

		runTest = function(e, combo, opt) {
			var keys, kp, element, character, code, mods;
			
			// Don't enable shortcut keys in Input, Textarea fields
			if(opt['disable_in_input']) {
				element = e.currentTarget;
				if (element && element.tagName && (element.tagName.toLowerCase() === 'input' ||
				element.tagName.toLowerCase() === 'textarea') && element !== opt.target) { return; }
			}

			// Find Which key is pressed
			if (e.keyCode) { code = e.keyCode; }
			else if (e.which) { code = e.which; }
			character = String.fromCharCode(code).toLowerCase();

			if (code === 188) { character = ','; } // If the user presses , when the type is onkeydown
			if (code === 190) { character = '.'; } // If the user presses . when the type is onkeydown

			keys = combo.split('+');
			// Key Pressed - counts the number of valid keypresses -
			// if it is same as the number of keys, the shortcut function is invoked
			kp = 0;

			// Build the modifiers list
			mods = modifiers();
			if (e.ctrlKey) { mods.ctrl.pressed = true; }
			if (e.shiftKey) { mods.shift.pressed = true; }
			if (e.altKey) { mods.alt.pressed = true; }
			if (e.metaKey) { mods.meta.pressed = true; }
				        
			for (var i = 0; i < keys.length; i++) {
				var k = keys[i];
				//Modifiers
				if(k === 'ctrl' || k === 'control') {
					kp++;
					mods.ctrl.wanted = true;
				} else if(k === 'shift') {
					kp++;
					mods.shift.wanted = true;
				} else if(k === 'alt') {
					kp++;
					mods.alt.wanted = true;
				} else if(k === 'meta') {
					kp++;
					mods.meta.wanted = true;
				} else if(k.length > 1) { // If it is a special key
					if(special_keys[k] === code) { kp++; }
				} else if(opt['keycode']) {
					if(opt['keycode'] === code) { kp++; }
				} else { // The special keys did not match
					if(character === k) { kp++; }
					else {
						// Stupid Shift key bug created by using lowercase
						if(shift_nums[character] && e.shiftKey) {
							character = shift_nums[character]; 
							if(character === k) { kp++; }
						}
					}
				}
			}
	
			// Test for success
			return (kp === keys.length && mods.ctrl.pressed === mods.ctrl.wanted &&
			mods.shift.pressed === mods.shift.wanted && mods.alt.pressed === mods.alt.wanted &&
			mods.meta.pressed === mods.meta.wanted);
		};
		
		// Expose
		return {
			runTest: function(evt, combo, options) {
				var options = options || { };
				for (var i in defaults) {
					if (defaults.hasOwnProperty(i)) {
						if (options[i] === undefined) { options[i] = defaults[i]; }
					}
				}
				return runTest(evt, combo.toLowerCase(), options);
			},
			defaults: defaults
		};
	}()),
	
	
	
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
		 * Get the current event's namespace
		 *
		 * @access  public
		 * @return  string
		 */
		self2.getNamespace = function() {
			return namespace;
		};
		
		/**
		 * Set the namespace
		 *
		 * @access  public
		 * @param   string    the namespace
		 * @return  void
		 */
		self2._setNamespace = function(ns) {
			namespace = ns;
		};
	
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
		
		/**
		 * Run the event function. This function deals with more then the .call() method
		 * and should be used as the "public" method.
		 *
		 * @access  public
		 * @param   mixed     call scope (this)
		 * @param   object    the event object
		 * @param   function  a test function if needed
		 * @return  mixed
		 */
		self.run = function(scope, event) {
			
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
			namespace = [ ],
			eventTest = (event in specialEvents && specialEvents[event].eventTest) ?
				specialEvents[event].eventTest : function() { return true; },
			runFuncs = function(lvl) {
				var result = null;
				for (var i in lvl) {
					if (lvl.hasOwnProperty(i)) {
						controller._setNamespace(namespace.join('.'));
						if (i === '.') {
							if (eventTest(controller)) {
								for (var j = 0, c = lvl[i].length; j < c; j++) {
									result = lvl[i][j].call(target, controller);
									if (result === false) {
										controller.cancelDefault();
									}
								}
							}
						} else {
							namespace.push(i);
							result = runFuncs(lvl[i]);
							namespace.pop();
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
