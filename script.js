// Wait until the whole page (and jQuery at the end of <body>) has loaded
window.addEventListener('load', function () {
  // Capture the starting main image so we can revert to it later
  DEFAULT_MAIN_PHOTO = $('.pet-image').attr('src');
  // Make the default image (Miso.jpg) visually larger
  $('.pet-image').addClass('is-default');

  // Initial render
  checkAndUpdatePetInfoInHtml();
  renderPetCollage();
  preloadActionPhotos(); // optional: avoids flicker on first swap

  // Main Buttons
  $('.treat-button').on('click', clickedTreatButton);
  $('.play-button').on('click', clickedPlayButton);
  $('.exercise-button').on('click', clickedExerciseButton);
  $('.sleep-button').on('click', clickedSleepButton);
});

// Sound setup 
var SOUND_PATHS = {
  meow: "sounds/meow.mp3",
  purr: "sounds/purr.mp3"
};

// Reusable audio objects
var meowAudio = new Audio(SOUND_PATHS.meow);
meowAudio.preload = "auto";
meowAudio.volume = 0.6;

var purrAudio = new Audio(SOUND_PATHS.purr);
purrAudio.preload = "auto";
purrAudio.loop = true;   // purring is looping
purrAudio.volume = 0.35; // lowering volume for meow

// Helpers
function playMeow() {
  // Rapid clicks can overlap without cutting off the sound
  var a = meowAudio.cloneNode(true);
  a.volume = meowAudio.volume;
  a.play().catch(() => {});
}

function startPurr() {
  stopPurr();                 // ensure one purr at a time
  purrAudio.currentTime = 0;
  purrAudio.play().catch(() => {});
}

function stopPurr() {
  try { purrAudio.pause(); purrAudio.currentTime = 0; } catch (e) {}
}

// Pet state
var pet_info = {
  name: "Miso",  // default name
  weight: 3,     // default weight
  happiness: 10,  // default happiness
  sleep: 5        // default sleep
};

// Main image revert config 
var DEFAULT_MAIN_PHOTO = "images/Miso.jpg"; // overwritten on load by actual <img> src
var REVERT_DELAY_MS = 2000;                 // show action photo for 2s
var revertTimer = null;                     // to avoid stacking timeouts

function scheduleRevertMainPhoto(delayMs) {
  if (revertTimer) clearTimeout(revertTimer);
  revertTimer = setTimeout(function () {
    stopPurr();
    $('.pet-image')
      .attr('src', DEFAULT_MAIN_PHOTO)
      .attr('alt', pet_info.name + ' - Default')
      .addClass('is-default'); // scale up only on default
  }, (typeof delayMs === 'number' ? delayMs : REVERT_DELAY_MS));
}

// Photo mapping 
var actionPhotos = {
  treat:    "images/Treat.jpg",
  play:     "images/Play.jpg",
  exercise: "images/Exercise.png",
  sleep:    "images/Sleep.jpg"
};

// Preload the four action images so first swap is instant
function preloadActionPhotos() {
  Object.keys(actionPhotos).forEach(function (key) {
    var img = new Image();
    img.src = actionPhotos[key];
  });
}

// Swap the MAIN image based on action
function changeMainPhoto(action) {
  var src = actionPhotos[action];
  if (!src) return;
  var nice = action.charAt(0).toUpperCase() + action.slice(1);
  $('.pet-image')
    .removeClass('is-default')             // action images = normal size
    .attr('src', src)
    .attr('alt', pet_info.name + ' - ' + nice);
  scheduleRevertMainPhoto();               // auto-revert to Miso.jpg
}

// Collage Setup
var petPhotos = [
  "images/Blanket.jpg",
  "images/Laptop.jpg",
  "images/Paws.jpg",
  "images/Pose.jpg",
  "images/Sassy.jpg",
  "images/Sit.jpg",
  "images/Stare.jpg"
];

// Populate the horizontal collage strip
function renderPetCollage() {
  var $collage = $('#pet-collage').empty();
  petPhotos.forEach(function (src, i) {
    $('<img/>', {
      src: src,
      alt: 'Pet photo ' + (i + 1),
      loading: 'lazy'
    }).appendTo($collage);
  });
}

// Button behaviors
function clickedTreatButton() {
  stopPurr();                 // stop any ongoing purr
  pet_info.happiness += 2;
  pet_info.weight += 1;
  playMeow();                 // meow
  speak("Yummy!");
  changeMainPhoto('treat');
  nudgeCollage(+60);
  checkAndUpdatePetInfoInHtml();
}

function clickedPlayButton() {
  stopPurr();
  pet_info.happiness += 3;
  pet_info.weight -= 1;
  playMeow();                 // meow
  speak("Play! Play! Play!");
  changeMainPhoto('play');
  nudgeCollage(+120);
  checkAndUpdatePetInfoInHtml();
}

function clickedExerciseButton() {
  stopPurr();
  pet_info.happiness -= 2;
  pet_info.weight -= 2;
  playMeow();                 // meow
  speak("So tiring...");
  changeMainPhoto('exercise');
  nudgeCollage(-80);
  checkAndUpdatePetInfoInHtml();
}

function clickedSleepButton() {
  pet_info.sleep += 2;
  pet_info.happiness += 1;
  startPurr();                // purr starts (loops)
  speak("Zzz...");
  changeMainPhoto('sleep');
  nudgeCollage(-40);
  checkAndUpdatePetInfoInHtml();
}

// UI sync & guards
function checkAndUpdatePetInfoInHtml() {
  checkWeightAndHappinessBeforeUpdating();
  updatePetInfoInHtml();
}

function checkWeightAndHappinessBeforeUpdating() {
  // Prevent going below zero (assignment requirement)
  if (pet_info.weight < 0) pet_info.weight = 0;
  if (pet_info.happiness < 0) pet_info.happiness = 0;
  if (pet_info.sleep < 0) pet_info.sleep = 0;

  // Keep neat integers
  pet_info.weight = Math.round(pet_info.weight);
  pet_info.happiness = Math.round(pet_info.happiness);
  pet_info.sleep = Math.round(pet_info.sleep);
}

// Push current values into the dashboard
function updatePetInfoInHtml() {
  $('.name').text(pet_info.name);
  $('.weight').text(pet_info.weight);
  $('.happiness').text(pet_info.happiness);
  $('.sleep').text(pet_info.sleep);
}

// Pet log

/**
 * speak(message)
 * Appends a new line to the scrollable "Pet Log" and snaps the view
 * to the bottom using jQuery's .scrollTop() so the newest message is visible.
 * (Unique method #1)
 */
function speak(message) {
  var $log = $('#pet-log');
  if ($log.length === 0) return; // safeguard
  var time = new Date().toLocaleTimeString();
  $log.append($('<div/>').text('[' + time + '] ' + message));
  $log.scrollTop($log[0].scrollHeight); // <- jQuery .scrollTop()
}

/**
 * nudgeCollage(delta)
 * Horizontally scrolls the photo collage by delta pixels using .scrollLeft().
 * Positive moves right, negative moves left.
 * (Unique method #2)
 */
function nudgeCollage(delta) {
  var $collage = $('#pet-collage');
  if ($collage.length === 0) return; // safeguard

  var current = $collage.scrollLeft();
  var target = current + delta;

  // Clamp to available scroll range
  var max = $collage[0].scrollWidth - $collage[0].clientWidth;
  if (target < 0) target = 0;
  if (target > max) target = max;

  // Set horizontal scroll position
  $collage.scrollLeft(target); //  jQuery .scrollLeft()
}
