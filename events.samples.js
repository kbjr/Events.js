// ----------------------------------------------------------------------------
//  Samples :)

	Events.bind(elem, 'click.myNamespace', function(e) {
		doSomething();
	});

	Events.unbind(elem, 'click.myNamespace');

	Events.invoke(elem, 'click');
	
	Events.specialEvents.add({
	
	});
	
	Events.buildEventObject(elem, 'click', { });
