(function (w) {	
	var MIN_LENGTH = 4;

    if (w.self != w.top) {
        return;
    }
	function colorize(config) {
		if ((config.enabled && config.disallowed && config.disallowed.indexOf(w.location.hostname)!== -1) || 
			(!config.enabled && (!config.allowed || config.allowed.indexOf(w.location.hostname)=== -1))) return;
			
		var freqRus = {}, freqEng = {};
		var rus = config.charsets.indexOf("rus")!==-1;
		var eng = config.charsets.indexOf("eng")!==-1;
		var maxFreq = (config.status == 3 ? 1:2);
		var patternRus = /[^а-яё]/g
		var patternEng = /[^a-z]/g
		var patternBoth = /[^a-zа-яё]/g

		if (!rus && !eng) return;
		
		if (rus && !eng) patternCurrent = patternRus;
		else if (!rus && eng) patternCurrent = patternEng;
		else patternCurrent = patternBoth;
		
		function collect(text, frequences, pattern) {
		   var words = text.split(/\s+/);
		   for (var j = 0; j < words.length; j++) {
			 var current = words[j].toLowerCase().replace(pattern,'');
			 if (!current || current.length < MIN_LENGTH) continue;
			 if (!frequences[current]) frequences[current] = 1;
			 else frequences[current] += 1;
		   }
		   return frequences;
		}
		
		function remove(o, max) {
			var n = {};
			for (var key in o) if (o[key] <= max) n[key] = o[key];
			return n;
		}
		
		function removeUseless() {
			freqRus = remove(freqRus, maxFreq);
			freqEng = remove(freqEng, maxFreq);
		}
		
		function stat(element) {
			if (/(script|style)/i.test(element.tagName)) return;
			if (element.nodeType === Node.ELEMENT_NODE && element.childNodes.length > 0)
				for (var i = 0; i < element.childNodes.length; i++)
					stat(element.childNodes[i]);
					
			if (element.nodeType === Node.TEXT_NODE && (/\S/.test(element.nodeValue))) {
			   if (rus) collect(element.nodeValue, freqRus, patternRus);
			   if (eng) collect(element.nodeValue, freqEng, patternEng);
		   }
		}
		function newNode(code) { // code here is total count of the word, only 1 and 2 are used for Russian alphabet and 1+10 and 2+10 for English
			var node = w.document.createElement(config.status == 3 ? 'strong' : 'span');
			node.className = 'nlc47';
			if (config.status == 2 && code !== 1 && code !== 11) node.style.color = '#999';
			if (config.status == 2 || (config.status == 1 && (code === 1 || code === 11))) node.style.fontWeight = '700';
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
					var efreq = [];
					var total = 0;
					for (var key in freq) {
						 if (freqRus[key]) efreq.push([key, freqRus[key]]);
						 if (freqEng[key]) efreq.push([key, freqEng[key] + 10]);
					}
					efreq.sort(function(a, b) {return a[0].length - b[0].length});
					var max = element.childNodes.length*efreq.length*2;
					for (var i = 0; i < element.childNodes.length; i++) {
						if (total++ > max) break;
						if (element.childNodes[i].nodeType === Node.TEXT_NODE) {
							var minPos = -1, minJ = -1;
							
							for (var j in efreq) {
								key = efreq[j][0];
								var pos = element.childNodes[i].nodeValue.toLowerCase().indexOf(key);
								if (pos >= 0 && (minJ === -1 || minPos>pos)) { minPos = pos; minJ = j; }
							}
							if (minPos !== -1) {
								key = efreq[minJ][0]; val = efreq[minJ][1];
								var spannode = newNode(val);
								var middlebit = element.childNodes[i].splitText(minPos);
								var endbit = middlebit.splitText(key.length);
								var middleclone = middlebit.cloneNode(true);
								spannode.appendChild(middleclone);
								element.replaceChild(spannode, middlebit);
							}
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
		removeUseless();
		markup(w.document.getElementsByTagName('html')[0], {}, patternCurrent);
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