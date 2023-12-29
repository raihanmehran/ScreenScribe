let isRecording = false;
let recorder = null;
let recordedChunks = [];

chrome.runtime.onInstalled.addListener(function () {
  // Perform some task when the extension is installed or updated
  console.log("Extension installed/updated");
});

// This function starts the recording process
function startRecording(tab) {
  chrome.tabCapture.capture({ audio: true, video: true }, function (stream) {
    if (stream) {
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => recordedChunks.push(event.data);
      recorder.onstop = saveRecording;
      recorder.start();
      isRecording = true;
      updatePopupButton("Stop Recording"); // Update the button text in the popup
    } else {
      console.error("Error: Cannot capture tab. May lack permissions.");
    }
  });
}

// This function stops the recording process
function stopRecording() {
  if (recorder) {
    recorder.stop(); // This will trigger the 'onstop' event and call saveRecording()
    isRecording = false;
    updatePopupButton("Start Capture"); // Update the button text in the popup
  }
}

// This function saves the recording to a file
function saveRecording() {
  const blob = new Blob(recordedChunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download(
    {
      url: url,
      filename: `recording-${Date.now()}.webm`,
    },
    function (downloadId) {
      URL.revokeObjectURL(url);
    }
  );

  // Reset the recorded chunks array for the next recording
  recordedChunks = [];
}

// This function updates the popup button's text
function updatePopupButton(text) {
  // Send a message to the popup script to update the button text
  chrome.runtime.sendMessage({ action: "updateButton", text: text });
}

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "toggleRecording") {
    if (isRecording) {
      stopRecording();
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        startRecording(tabs[0]);
      });
    }
  }
});
