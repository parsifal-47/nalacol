(function () {
	var defaultConfig = { status: 3, enabled : 1, charsets : ["rus"] };
	var keys = Object.keys(defaultConfig);

	/* set up default config */
	chrome.storage.sync.get(keys, function(data) {
		var allSet = true;
		for (var i in keys) if (typeof data[keys[i]] == "undefined") allSet = false;
		
		if (!allSet) chrome.storage.sync.set(defaultConfig);
	});
})();