var current_background = 0;
var background_array = new Array();

function transition_background() {
    var next_background = current_background + 1;
    next_background = next_background == background_array.length ? 0 : next_background;

    var $next_background = background_array[next_background];
    $next_background.css({ zIndex: 3, opacity: 0, top: -40, bottom: -40, left: -40, right: -40 }).animate({ opacity: 1, top: 0, bottom: 0, left: 0, right: 0 }, function () {
        background_array[current_background].css({ zIndex: 1 });
        current_background = next_background;
        $(this).css({ zIndex: 2 });
    });
}
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}
$(document).ready(function () {
    var $backgrounds = $('div.background');
    $backgrounds.css({ opacity: 0 });
    for (var background = 0; background < $backgrounds.length; background++) {
        background_array.push($backgrounds.eq(background));
    }
    shuffle(background_array);
    background_array[0].css({ zIndex: 2, opacity: 1 });
    setInterval('transition_background();', 3000);
});