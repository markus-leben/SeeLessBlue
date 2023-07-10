function determineBlue(verified, tweet) {
  var tweetTextDiv = tweet.querySelector('[data-testid="tweetText"]')
  var tweetText = tweetTextDiv === null ? "" : tweetTextDiv.textContent
  // overall quantity of the phrase 'Quote Tweet'
  var qtQuantity = (tweet.textContent.match(/Quote Tweet/g) || []).length;
  var qtInTweetQuantity = (tweetText.match(/Quote Tweet/g) || []).length

  // quotes are annoying cause they make a lotta blue identification trickier
  var isQuote = qtQuantity - qtInTweetQuantity > 0;

  var userDiv = tweet.querySelectorAll("[href]")[1]
  var username = userDiv.getAttribute("href").replace('/','')
  var hasCheck = userDiv.querySelector('[aria-label="Verified account"]') !== null
  var isBlue = (hasCheck && !(verified.includes(username)))
  if (isBlue) {
    console.log(username, "is blue")
  }
  return isBlue
}

function hideBlue(settings, homeOrStatus, arraysOfJunkTweets) {
  for (let tweetArray of arraysOfJunkTweets) {
    for (let [index, tweet] of tweetArray.entries()) {
      var hide = true;
      if (settings.hideInFeed === false && homeOrStatus === 'home') {
        hide = false
      }
      if (settings.hideInReplies === false && homeOrStatus === 'status') {
        hide = false
      }
      if (hide) {
        tweet.style.display = 'none'
      }
      else {
        tweet.style.display = ''
      }

      // if there is one, hide the thread stripe of the previous sibling in the dom, i.e. this things parent in the comment chain
      if (tweet.previousElementSibling === null) {
        continue
      }
      var avatarBox = tweet.previousElementSibling.querySelector('[data-testid="Tweet-User-Avatar"]')
      if (avatarBox === null) {
        continue
      }
      var hasStripe = avatarBox.parentNode.childElementCount === 2
      if (hasStripe) {
        var stripe = avatarBox.parentNode.lastElementChild
        if (hide) {
          stripe.style.display = 'none'
        }
        else {
          stripe.style.display = ''
        }
      }
    }
  }
}

function homeLogic(verified, settings, convo) {
  // a function for hiding tweets and replies in your main feed
  // had to be broken apart for silly reasons related to random divs that are different in the dom between home and status pages

  // // storage variables
  // // because the comment nesting is relatively simple, we can use a 2d array instead of a tree
  var arraysOfJunkTweets = []
  // var previousItemWasTweetOrButton = false
  var parentWasBlue = false
  var currentTweetArray = []

  // loop through everything
  for (let tweetLikeObject of Array.from(convo)) {
    // contains a tweet
    var isTweet = tweetLikeObject.querySelector('[data-testid="tweet"]') !== null;
    if (isTweet) {
      var isBlue = determineBlue(verified, tweetLikeObject)
      // this one sucks really bad
      var isReply = tweetLikeObject.querySelector('[data-testid="tweet"]').firstChild.firstChild.firstChild.firstChild.firstChild.firstChild !== null

      if (! isReply && currentTweetArray !== []){
        arraysOfJunkTweets.push(currentTweetArray)
        parentWasBlue = false
      }

      if (isBlue || parentWasBlue) {
        currentTweetArray.push(tweetLikeObject)
        parentWasBlue = true
      }
    }
  }

  hideBlue(settings, "home", arraysOfJunkTweets)
}

function statusLogic(verified, settings, convo) {
  // a function for hiding tweets and replies in an individual thread, as opposed to your main feed

  // storage variables
  // because the comment nesting is relatively simple, we can use a 2d array instead of a tree
  var arraysOfJunkTweets = []
  var previousItemWasTweetOrButton = false
  var parentWasBlueOrButton = false
  var currentTweetArray = []


  var convoArray = Array.from(convo)
  var startIndex = 0

  // find the index of the tweet whose url you're at
  for (let index in convoArray) {
    if (convoArray[index].querySelector(`a[href*='${window.location.href.replace('https://twitter.com/', '')}']`) !== null) {
      startIndex = index
    }
  }

  // loop through everything after the OP and it's weird blank div that everything has
  for (let tweetLikeObject of Array.from(convo).slice(startIndex+2, Array.from(convo).length-2)) {

    // contains a tweet
    var isTweet = tweetLikeObject.querySelector('[data-testid="tweet"]') !== null

    // isn't a tweet and contains a button
    var isButton = !isTweet && (tweetLikeObject.querySelector('[role="button"]') !== null)

    if (isTweet) {
      var isBlue = determineBlue(verified, tweetLikeObject)

      // if blue and the first thing
      if (isBlue) {
        currentTweetArray.push(tweetLikeObject)
        parentWasBlueOrButton = true
      }
      // if first thing was blue
      if (parentWasBlueOrButton) {
        currentTweetArray.push(tweetLikeObject)
      }


      previousItemWasTweetOrButton = true

    } else if (isButton) { //don't love the look of this logic, how to clean?
      if (previousItemWasTweetOrButton === false) {
        currentTweetArray.push(tweetLikeObject)
        parentWasBlueOrButton = true
      } else if (parentWasBlueOrButton) {
        currentTweetArray.push(tweetLikeObject)
      }
      previousItemWasTweetOrButton = true
    } else {
      if (parentWasBlueOrButton) {
        currentTweetArray.push(tweetLikeObject)
      }
      if (currentTweetArray !== []){
        arraysOfJunkTweets.push(currentTweetArray)
      }
      currentTweetArray = []
      previousItemWasTweetOrButton = false
      parentWasBlueOrButton = false
    }
  }
  hideBlue(settings, "status", arraysOfJunkTweets)
}

function getConversation() {
  var isHome = false
  if (!window.location.href.includes('/status/')) {
    isHome = true
  }

  var convo = null //I'm just here so the linter shuts up
  if (isHome) {
    convo = document.querySelector(`[aria-label="Timeline: Your Home Timeline"]`)
  } else {
    convo = document.querySelector(`[aria-label="Timeline: Conversation"]`)
  }

  if (convo !== null) {
    convo = convo.querySelectorAll("[data-testid=cellInnerDiv]")
    // this is an array of twitters ugly divspam stuff, that eventually contains actual tweets buried somewhere in each of those divs
  }

  if (convo !== null) {
    if (isHome) {
      convo.isHome = true

    } else {
      convo.isHome = false
    }
  }

  return convo

}

async function getVerified() {
  const txtUrl = chrome.runtime.getURL('verified.txt');
  var result = await fetch(txtUrl);
  var rawText = await result.text();
  return rawText.split("\n");
}

async function getSettings() {
  var rawSettings = await chrome.storage.local.get(["settings"])
  if (rawSettings.settings === undefined) {
    console.log('result settings is undefined')
    return ({showToggle:false,hideInReplies:true,hideInFeed:true})
  } else {
    return (rawSettings.settings)
  }

}

async function main() {
  // verified is real verified, non-blue users
  const verified = await getVerified()

  var settings = await getSettings()


  // listen for messages
  chrome.runtime.onMessage.addListener(
    async function(request, sender, sendResponse) {
      if (["setting button toggled", "active tab changed since setting update"].includes(request.greeting)) {
        console.log('hey, a settings button was pressed')
        settings = await getSettings()
      }
      sendResponse({farewell: "message recieved by handleTweets"});
    }
  );




  const observer = new MutationObserver(function (mutations, observer) {
    try {
      observer.disconnect()
      var convo = getConversation()
      if (convo !== null) {
        if (convo.isHome === true) {
          homeLogic(verified, settings, convo)
        }
        else {
          statusLogic(verified, settings, convo)
        }
      }

      observe()
    } catch (error) {
      console.log("uncaught mutation error in SeeLessBlue", error);
      observe()
    }
  });

  const observe = () => {
    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
    })
  }
  observe()
}



main();