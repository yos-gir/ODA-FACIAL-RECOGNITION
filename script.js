const video = document.getElementById("video");
const namesContainer = document.getElementById("namesContainer");

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
]).then(startWebcam);

function startWebcam() {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error(error);
    });
}

function getLabeledFaceDescriptions() {
  const labels = ["Abadula", "Abiy", "Birhanu", "Dejene", "Shimelis", "Tola", "Unknown", "Yosen"];
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 4; i++) {
        const img = await faceapi.fetchImage(`./labels/${label}/${i}.jpg`);
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

const detectedNames = new Set(); // Create a Set to keep track of detected names

video.addEventListener("play", async () => {
  const labeledFaceDescriptors = await getLabeledFaceDescriptions();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    resizedDetections.forEach((detection) => {
      const box = detection.detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: faceMatcher.findBestMatch(detection.descriptor).toString(),
      });
      drawBox.draw(canvas);

      // Get the detected person's name
      const name = faceMatcher.findBestMatch(detection.descriptor).label;

      // Display the name only if it hasn't been detected before
      if (!detectedNames.has(name)) {
        detectedNames.add(name);

        // Update the attendance status of the detected person in the table
        const statusElement = document.getElementById(`${name.toLowerCase()}-status`);
        statusElement.textContent = "Present";
        statusElement.classList.remove("absent");
        statusElement.classList.add("present");

        // Add the detected person's name to the namesContainer
        constnameElement = document.createElement("div");
        nameElement.textContent = name;
        nameElement.classList.add("name");
        namesContainer.appendChild(nameElement);
      }
    });
  }, 100);
});


function updateDateTime() {
  const dateTime = new Date();
  const dateTimeStr = dateTime.toLocaleString();
  document.getElementById("datetime").innerHTML = dateTimeStr;
}

// Update the date and time every second
setInterval(updateDateTime, 1000);



const printButton = document.getElementById("print-button");

printButton.addEventListener("click", () => {
  window.print();
});