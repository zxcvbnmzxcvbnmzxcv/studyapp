document.addEventListener("DOMContentLoaded", () => {
  const flashcards = [
    { q: "What is the powerhouse of the cell?", a: "mitochondria" },
    { q: "What is the chemical symbol for Gold?", a: "au" },
    { q: "What planet is known as the Red Planet?", a: "mars" },
    { q: "What force pulls objects toward the center of the Earth?", a: "gravity" },
    { q: "What is the largest organ in the human body?", a: "skin" }
  ];

  const speechStatusEl = document.getElementById("speech-status");
  const questionDisplayEl = document.getElementById("question-display");
  const answerDisplayEl = document.getElementById("answer-display");
  const listenBtnEl = document.getElementById("listen-btn");
  const repCounterEl = document.getElementById("rep-counter");
  const armStageEl = document.getElementById("arm-stage");
  const startStudyBtnEl = document.getElementById("start-study-btn");
  const nextQuestionBtnEl = document.getElementById("next-question-btn");

  let currentCardIndex = 0;
  let recognition;

  const showQuestion = () => {
    const card = flashcards[currentCardIndex];
    questionDisplayEl.textContent = card.q;
    answerDisplayEl.textContent = "";
    listenBtnEl.disabled = false;
  };

  const startStudying = () => {
    currentCardIndex = 0;
    showQuestion();
    speechStatusEl.textContent = "Ready";
  };

  const listenForAnswer = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    speechStatusEl.textContent = "Listening...";
    recognition.start();
  };

  const nextQuestion = () => {
    currentCardIndex = (currentCardIndex + 1) % flashcards.length;
    showQuestion();
  };

  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript.toLowerCase();
      const correctAnswer = flashcards[currentCardIndex].a.toLowerCase();

      answerDisplayEl.textContent = `You said: "${spokenText}"`;

      if (spokenText.includes(correctAnswer)) {
        speechStatusEl.textContent = "Correct";
      } else {
        speechStatusEl.textContent = "Try again";
      }
    };

    recognition.onerror = () => {
      speechStatusEl.textContent = "Error";
    };
  }

  startStudyBtnEl.addEventListener("click", startStudying);
  listenBtnEl.addEventListener("click", listenForAnswer);
  nextQuestionBtnEl.addEventListener("click", nextQuestion);

  const videoElement = document.getElementById("webcam");
  const canvasElement = document.getElementById("output_canvas");
  const canvasCtx = canvasElement.getContext("2d");

  let curlCount = 0;
  let stage = "down";

  function calculateAngle(a, b, c) {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  }

  function onResults(results) {
    canvasElement.width = videoElement.videoWidth || 640;
    canvasElement.height = videoElement.videoHeight || 480;

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.poseLandmarks) {
      const shoulder = results.poseLandmarks[12];
      const elbow = results.poseLandmarks[14];
      const wrist = results.poseLandmarks[16];

      if (shoulder && elbow && wrist) {
        const angle = calculateAngle(shoulder, elbow, wrist);

        if (angle > 160) {
          stage = "down";
          armStageEl.textContent = "Arm: Down";
        }

        if (angle < 45 && stage === "down") {
          stage = "up";
          curlCount += 1;
          repCounterEl.textContent = curlCount;
          armStageEl.textContent = "Arm: Up";
        }
      }
    }
  }

  const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  pose.onResults(onResults);

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await pose.send({ image: videoElement });
    },
    width: 640,
    height: 480
  });

  camera.start();
});
