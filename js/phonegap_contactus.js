function submit() {
    validate_form();
    var query = "";
    query += "?FirstName=" + $('#tbFirstName').val();
    query += "&LastName=" + $('#tbLastName').val();
    query += "&Email=" + $('#tbEmail').val();
    query += "&Phone=" + $('#tbPhone').val();
    query += "&Ext=" + $('#tbExt').val();
    query += "&Street=" + $('#tbStreet').val();
    query += "&City=" + $('#tbCity').val();
    query += "&State=" + $('#tbState').val();
    query += "&Zip=" + $('#tbZip').val();
    query += "&Comments=" + $('#tbComments').val();
}
function validate_form() {
    $('#ContactForm-Entry div.error-message').remove();
    var errors = new Array();

    var $first_name = $("#FName input");
    $first_name.removeClass('alert');
    $first_name.val($first_name.val().replace(/=/g, ' ').replace(/&/g, ' ').trim());
    if ($first_name.val().length == 0) {
        $first_name.addClass('alert');
        errors.push('first name');
    }

    var $last_name = $("#LName input");
    $last_name.removeClass('alert');
    $last_name.val($last_name.val().replace(/=/g, ' ').replace(/&/g, ' ').trim());
    if ($last_name.val().length == 0) {
        $last_name.addClass('alert');
        errors.push('last name');
    }

    var $email = $("#Email input");
    $email.removeClass('alert');
    $email.val($email.val().trim());
    if (!validate_email($email.val())) {
        $email.addClass('alert');
        errors.push('email address');
    }

    var $phone = $("#Phone input");
    $phone.removeClass('alert');
    $phone.val($phone.val().replace(/\D/g, ''));
    if ($phone.val().length < 10) {
        $phone.addClass('alert');
        errors.push('phone number including area code');
    }

    var $street = $("#Street input");
    $street.removeClass('alert');
    $street.val($street.val().replace(/=/g, ' ').replace(/&/g, ' ').trim());
    if ($street.val().length == 0) {
        $street.addClass('alert');
        errors.push('street');
    }

    var $city = $("#City input");
    $city.removeClass('alert');
    $city.val($city.val().replace(/=/g, ' ').replace(/&/g, ' ').trim());
    if ($city.val().length == 0) {
        $city.addClass('alert');
        errors.push('city');
    }

    var $state = $("#State input");
    $state.removeClass('alert');
    $state.val($state.val().replace(/=/g, ' ').replace(/&/g, ' ').trim());
    if ($state.val().length == 0) {
        $state.addClass('alert');
        errors.push('state');
    }

    var $zipcode = $("#Zip input");
    $zipcode.removeClass('alert');
    $zipcode.val($zipcode.val().replace(/=/g, ' ').replace(/&/g, ' ').trim());
    if ($zipcode.val().length == 0) {
        $zipcode.addClass('alert');
        errors.push('zip code');
    }

    var $comments = $("#Comments textarea");
    $comments.removeClass('alert');
    $comments.val($zipcode.val().replace(/=/g, ' ').replace(/&/g, ' ').replace(/(?:\r\n|\r|\n)/g, ' ').trim());
    if ($comments.val().length == 0) {
        $comments.addClass('alert');
        errors.push('comments or questions');
    }

    if ($("#ContactForm input[type=hidden]").val().length > 0) {
        alert('has relocation');
        validate_relocation_form();
    }


    if (errors.length > 0) {
        var message = "Please enter ";
        for (var error = 0; error < errors.length; error++) {
            message += (error > 0 ? (error < errors.length - 1 ? ", " : " and ") : "");
            message += errors[error];
        }
        message += ".";
        var $message = $('<div class="error-message">' + message + '</div>');
        $message.insertBefore('#MainForm');

        $('html, body').animate({ scrollTop: $('#MainForm').offset().top - 40 }, 300, function () { $message.slideDown(); });
    }
}
function validate_relocation_form() {
    var errors = new Array();

    var $has_agent = $('input[type=radio][name="agent"]:checked');
    if ($has_agent.length == 0) {
        errors.push('indicate if you are currently working with an agent');
    }

    var $interests = $('input[type=radio][name="interests"]:checked');
    if ($interests.length == 0) {
        errors.push('indicate what kind of information you are interested in');
    }

    var $moving = $('input[type=radio][name="moving"]:checked');
    if ($moving.length == 0) {
        errors.push('indicate if you are planning on moving to this area');
    }

    var $neighborhoods = $("#RelocationNeighborhoods textarea");
    $neighborhoods.removeClass('alert');
    $neighborhoods.val($first_name.val().replace(/=/g, ' ').replace(/&/g, ' ').replace(/(?:\r\n|\r|\n)/g, ' ').trim());
    if ($neighborhoods.val().length == 0) {
        $neighborhoods.addClass('alert');
        errors.push('indicate what cities or neighborhoods you are interested in');
    }

    if (errors.length > 0) {
        var message = "Please enter ";
        for (var error = 0; error < errors.length; error++) {
            message += (error > 0 ? (error < errors.length - 1 ? ", " : " and ") : "");
            message += errors[error];
        }
        message += ".";
        var $message = $('<div class="error-message">' + message + '</div>');
        $message.insertBefore('#RelocationForm');

        $('html, body').animate({ scrollTop: $('#MainForm').offset().top - 40 }, 300, function () { $message.slideDown(); });
    }
}
function validate_email(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
}

function updateRelocationForm() {
    if ($("#RelocationForm").is(':visible')) {
        $("#LookingToMove").text("Planning to move to the area? Click here!");

        $("#ContactForm input[type=hidden]").val("");
    }
    else {
        $("#LookingToMove").text("Changed your mind? Click here!");

        $("#ContactForm input[type=hidden]").val("Yes");
    }
    $("#RelocationForm").slideToggle();
    $("#SubmitForm").fadeToggle();
}

function openDirections() {
    $('#ContactOverlay').stop().show().css({ opacity: 0 }).animate({ opacity: 1 });
}
function closeDirections() {
    $('#ContactOverlay').stop().hide();
}
function getDirections() {
    var streetaddress = encodeURIComponent($('#dirAddress').val());
    var city = encodeURIComponent($('#dirCity').val());
    var state = encodeURIComponent($('#dirState').val());
    var zip = encodeURIComponent($('#dirZip').val());
    var url = "http://maps.google.com/maps?saddr=" + streetaddress + "," + city + "," + state + "&daddr=Porter+Properties,427+North+Dean+Road+Suite+200,+Auburn,+AL+36830&hl=en";
    window.open(url, 'Directions');
    closeDirections();
}

function initializeMap() {
    var location = new google.maps.LatLng(32.61350783410655, -85.46389448518067);
    var myOptions = { zoom: 14, center: location, mapTypeId: google.maps.MapTypeId.ROADMAP, draggable: false, scrollwheel: false };
    var map = new google.maps.Map(document.getElementById('Map'), myOptions);
    var marker = new google.maps.Marker({ position: location, map: map, draggable: false, icon: '/images/map/weichertIcon.png' });
}
$(document).ready(function () {
    initializeMap();
    $('#ContactOverlay').stop().hide();
    $("#LookingToMove").click(function () { updateRelocationForm() });
    if ($("#ContactForm input:hidden").val().length > 0) {
        updateRelocationForm();
    }
});