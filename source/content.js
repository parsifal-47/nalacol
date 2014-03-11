(function (w) {	
    if (w.self != w.top) {
        return;
    }
	function colorize(config) {
		if ((config.enabled && config.disallowed && config.disallowed.indexOf(w.location.hostname)!== -1) || 
			(!config.enabled && (!config.allowed || config.allowed.indexOf(w.location.hostname)=== -1))) return;
		var freqRus = {}, freqEng = {};
		var rus = config.charsets.indexOf("rus")!==-1;
		var eng = config.charsets.indexOf("eng")!==-1;

		if (!rus && !eng) return;
		
		function collect(text, frequences, pattern) {
		   var words = text.split(/\s+/);
		   for (var j = 0; j < words.length; j++) {
			 var current = words[j].toLowerCase().replace(pattern,'');
			 if (!current) continue;
			 if (!frequences[current]) frequences[current] = 1;
			 else frequences[current] += 1;
		   }
		   return frequences;
		}
		function stat(element) {
			if (/(script|style)/i.test(element.tagName)) return;
			if (element.nodeType === Node.ELEMENT_NODE && element.childNodes.length > 0)
				for (var i = 0; i < element.childNodes.length; i++)
					stat(element.childNodes[i]);
					
			if (element.nodeType === Node.TEXT_NODE && (/\S/.test(element.nodeValue))) {
			   if (rus) collect(element.nodeValue, freqRus, /[^а-яё]/g);
			   if (eng) collect(element.nodeValue, freqEng, /[^a-z]/g);
		   }
		}
		function newNode(code) {
			var node = w.document.createElement(config.status == 3 ? 'strong' : 'span');
			node.className = 'nlc47';
			if (config.status == 2 && code !== 1) node.style.color = '#999';
			if (config.status == 2 || (config.status == 1 && (code === 1 || code === 3))) node.style.fontWeight = '700';
			if (config.status == 1) node.style.color = code > 2 ? '#449' : '#494';
			
			return node;
		}
		function markup(element, initial, pattern) {
			if (/(script|style)/i.test(element.tagName)) return;
			if (element.nodeType === Node.ELEMENT_NODE && element.childNodes.length > 0) {
				var freq = {};
				for (var i = 0; i < element.childNodes.length; i++) {
					freq = markup(element.childNodes[i], freq, pattern);
				}
				if (freq && freq.length !== 0) {
					var efreq = {};
					var total = 0;
					for (var key in freq) {
						 if (freqRus[key]===1) efreq[key] = 1;
						 else if (config.status != 3 && freqRus[key]===2) efreq[key] = 2;
						 if (freqEng[key]===1) efreq[key] = 3;
						 else if (config.status != 3 && freqEng[key]===2) efreq[key] = 4;
					}
					var max = element.childNodes.length*Object.keys(efreq).length*2;
					for (var i = 0; i < element.childNodes.length; i++) {
						if (total++ > max) break;
						if (element.childNodes[i].nodeType === Node.TEXT_NODE) {
							var flag = false;
							for (var key in efreq) {
								var pos = element.childNodes[i].nodeValue.toLowerCase().indexOf(key);
								if (pos >= 0) {
									flag = true;
									var spannode = newNode(efreq[key]);
									var middlebit = element.childNodes[i].splitText(pos);
									var endbit = middlebit.splitText(key.length);
									var middleclone = middlebit.cloneNode(true);
									spannode.appendChild(middleclone);
									element.replaceChild(spannode, middlebit);
								}
							}
							if (flag) i = -1;
						}
					}
				}
			}

			if (element.nodeType === Node.TEXT_NODE && (/\S/.test(element.nodeValue))) {
			   return collect(element.nodeValue, initial, pattern);
		   }
		   return initial;
		}
		stat(w.document.getElementsByTagName('html')[0]);
		var pattern = null;
		if (rus && !eng) pattern = /[^а-яё]/g;
		else if (!rus && eng) pattern = /[^a-z]/g;
		else pattern = /[^a-zа-яё]/g;
		markup(w.document.getElementsByTagName('html')[0], {}, pattern);
	}
	
	function clean() {
		var affected = w.document.querySelectorAll(".nlc47");
		if (!affected.length) return;
		for (var i=0;i<affected.length;i++) {
			affected[i].outerHTML = affected[i].innerHTML;
		}
	}
	
	function loadAndColorize() {
		chrome.storage.sync.get(['status', 'enabled', 'charsets', 'allowed', 'disallowed'], colorize);
	}
	
	chrome.runtime.onMessage.addListener(function(msg, sender, response) {
		if (msg.action && msg.action == "refresh") {clean(); loadAndColorize(); }
		if (msg.action && msg.action == "getHost") response({host:w.location.hostname});
	});

	loadAndColorize();
})(window);