(function () {
	var allCharsets = ["rus", "eng"];
	var allowedHosts = [];
	var disallowedHosts = [];
	var currentHost;
	
	function hostStatusRefresh() {
		if (!currentHost) return;
		
		if ((document.getElementById('def').selectedIndex && allowedHosts.indexOf(currentHost) === -1) ||
			(!document.getElementById('def').selectedIndex && disallowedHosts.indexOf(currentHost) !== -1)) {
				document.getElementById('switch').innerText = "enable for this site";
			} else
				document.getElementById('switch').innerText = "disable for this site";
	}

	function init() {
		chrome.storage.sync.get(['status', 'enabled', 'charsets', 'allowed', 'disallowed'], function(response) { 
			document.getElementById('rad' + response.status).checked = true;
			if (!response.enabled) document.getElementById('def').selectedIndex = 1;
			
			if (response.charsets)
				for (var i in allCharsets) {
					var key = allCharsets[i];
					if (response.charsets.indexOf(key)!== -1) document.getElementById(key).checked = true;
				}
			if (response.allowed) allowedHosts = response.allowed;
			if (response.disallowed) disallowedHosts = response.disallowed;
		});
		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, { action: "getHost" }, function(response) {
				if (response && response.host) {
					currentHost = response.host;
					hostStatusRefresh();
					document.getElementById('refresh').style.display = "block";
					document.getElementById('switch').style.display = "block";
				}
			});
		});	
	}
	function clickEvent(event) {
		if (event.target.nodeName=="INPUT" && event.target.type=="radio") {
			if (event.target.value) {
				chrome.storage.sync.set({status:event.target.value});
			}
		}
		if (event.target.nodeName=="INPUT" && event.target.type=="checkbox") {
			var langset = [];
			for (var i in allCharsets) if (document.getElementById(allCharsets[i]).checked) langset.push(allCharsets[i]);
			chrome.storage.sync.set({charsets:langset});
		}
		if (event.target.nodeName=="IMG") {
			chrome.tabs.query({
		        active: true,
		        currentWindow: true
		    }, function(tabs) {
		        chrome.tabs.sendMessage(tabs[0].id, { action: "refresh" });
		    });
		}
		if (event.target.nodeName=="BUTTON" && currentHost) {
			var idx;
			if (document.getElementById('def').selectedIndex) {
				idx = allowedHosts.indexOf(currentHost);
				if (idx === -1) {
					allowedHosts.push(currentHost);
				} else {
					allowedHosts.splice(idx, 1);
				}
				chrome.storage.sync.set({allowed:allowedHosts});
			} else {
				idx = disallowedHosts.indexOf(currentHost);
				if (idx === -1) {
					disallowedHosts.push(currentHost);
				} else {
					disallowedHosts.splice(idx, 1);
				}
				chrome.storage.sync.set({disallowed:disallowedHosts});
			}
			hostStatusRefresh();
		}
	}
	function changeEvent(event) {
		if (event.target.id == "def") {
			chrome.storage.sync.set({enabled:!(event.target.selectedIndex)});
			hostStatusRefresh();			
		}
	}
	document.addEventListener('DOMContentLoaded', init);
	document.addEventListener('click', clickEvent);
	document.addEventListener('change', changeEvent);
})();