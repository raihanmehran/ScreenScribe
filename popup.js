document.addEventListener(
  "DOMContentLoaded",
  function () {
    var captureButton = document.getElementById("start-capture-btn");
    var isRecording = false;
    var recorder;
    var stream;

    captureButton.addEventListener(
      "click",
      function () {
        if (!isRecording) {
          // Start recording
          chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
              chrome.tabCapture.capture(
                { audio: true, video: true },
                function (capturedStream) {
                  stream = capturedStream;
                  recorder = new MediaRecorder(stream);
                  const chunks = [];
                  recorder.ondataavailable = function (e) {
                    chunks.push(e.data);
                  };

                  recorder.onstop = function () {
                    const completeBlob = new Blob(chunks, {
                      type: "video/webm",
                    });
                    const url = URL.createObjectURL(completeBlob);

                    chrome.downloads.download(
                      {
                        url: url,
                        filename: `recording-${Date.now()}.webm`,
                      },
                      function (downloadId) {
                        // Cleanup the URL object
                        URL.revokeObjectURL(url);
                      }
                    );
                  };

                  recorder.start();
                  isRecording = true;
                  captureButton.textContent = "Stop Recording";
                }
              );
            }
          );
        } else {
          // Stop recording
          recorder.stop();
          stream.getTracks().forEach((track) => track.stop()); // Stop all tracks to release the camera and microphone
          isRecording = false;
          captureButton.textContent = "Start Capture";
        }
      },
      false
    );
  },
  false
);

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "updateButton") {
    const button = document.getElementById("start-capture-btn");
    if (button) {
      button.textContent = message.text;
    }
  }
});
