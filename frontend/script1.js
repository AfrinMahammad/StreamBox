const video = document.getElementById('videoPlayer');



function skipBackward() {
    video.currentTime -= 10; // Skip backward by 10 seconds
}

function skipForward() {
    video.currentTime += 10; // Skip forward by 10 seconds
}


function togglePause() {
    if (video.paused) {
        video.play(); // If video is paused, play it
        pauseIcon.className = 'fa fa-pause'; // Change icon to pause
    } else {
        video.pause(); // If video is playing, pause it
        pauseIcon.className = 'fa fa-play'; // Change icon to play
    }
}
