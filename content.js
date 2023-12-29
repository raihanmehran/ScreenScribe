// Example: Sending a message from a content script to the background script
chrome.runtime.sendMessage({ greeting: "hello" }, function (response) {
  console.log(response.farewell);
});
