var settingsHaveChanged = false;
var visited = []

// listen for changes to settings
chrome.runtime.onMessage.addListener(
  async (request, sender, sendResponse) => {
    if (request.greeting === "settings updated") {
      settingsHaveChanged = true;
      visited = []
      console.log("background recieved message")
      sendResponse({farewell: "background recieved message"})
      // let the active tab know what's up
      var [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
      // only send the message to tabs the extension is permitted to run on
      try {
        if (tab.url.includes("twitter.com") && !visited.includes(tab.id)) {
          const response = await chrome.tabs.sendMessage(tab.id, {greeting: `setting button toggled`});
          visited.push(tab.id)
        }
      }
      catch {}
    };
  }
);

// message the active tab if and only if settings have changed, it's a twitter tab, and it hasn't been visited
chrome.tabs.onActivated.addListener(
  async () => {
    if (settingsHaveChanged) {
      const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
      // only send the message to tabs the extension is permitted to run on
      try {
        if (tab.url.includes("twitter.com") && !visited.includes(tab.id)) {
          var response = await chrome.tabs.sendMessage(tab.id, {greeting: `active tab changed since setting update`});
          visited.push(tab.id)
        }
      }
      catch {}

      // you can turn off SettingsHaveChanged if every instance of twitter has been visted
      // might need to update for multiple windows
      const allTabs = await chrome.tabs.query({})
      var twitterFound = false;
      for (let thisTab of allTabs) {
        if (thisTab.url.includes("twitter.com") && !visited.includes(tab.id)) {
          twitterFound = true;
        }
      }
      if (!twitterFound) {
        settingsHaveChanged = false;
      }

      // do something with response here, not outside the function
      // console.log(response);
    }
  }
)