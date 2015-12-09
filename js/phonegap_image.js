var $image = null;
var nat_width = 0;
var current_image = 0;
var mls = null;


function retrieve_data() {
    if (window.location.hash.length > 0) {
        var hash = window.location.hash.substr(1);
        var hash_parts = hash.split('|');
        mls = hash_parts[0];
        current_image = parseInt(hash_parts[1]);
    }
    retrieve_images();
}
function retrieve_images() {
    var ajaxUrl = "http://www.porterproperties.com/app/ajax/?Type=Property&mls=" + mls;
    $.ajax({
        url: ajaxUrl,
        beforeSend: function (xhr) {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
        },
        cache: false
    }).done(function (data) {
        parse_property_xml($($.parseXML(data)));
    }).fail(function () {
        alert('page failed to load');
    })
}
function parse_property_xml($property_xml) {
    var $property = $property_xml.find("property");
    if ($property.length > 0) {
        load_property_images($property);
    }
}
function load_property_images($property) {
    var $images = $property.find("image");
    var images_content = "";
    var tile_content = "";
    if ($images.length > 0) {
        for (var image = 0; image < $images.length; image++) {
            var $image = $images.eq(image);
            images_content += '<img src=' + $image.text() + ' />';
            tile_content += '<div style="background-image: url(' + $image.text() + ');" onclick="goto_image(' + image + ');"></div>'
        }
        var $images_content = $(images_content);
        $("#Property-Photos").append($images_content);
        var $tile_content = $(tile_content);
        $("#Property-Photos-Tiles").append($tile_content);
    }
    goto_image(current_image);

    set_up_pinchzoom();

    $('#Zoom_Message').fadeIn();
    display_zoom_message();
    setTimeout('hide_zoom_message();', 2000);

    $('#Close').fadeIn();
}
function set_up_pinchzoom() {
    $("#Property-Photos").swipe({
        pinchStatus: function (event, phase, direction, distance, duration, fingerCount, pinchZoom, fingerData) {
            if (fingerCount > 1) {
                var container_width = $('#Property-Photos').innerWidth();

                var dis_width = $image.outerWidth() + (pinchZoom > 1 ? 10 : -10);
                dis_width = dis_width < container_width ? container_width: dis_width;
                dis_width = dis_width > nat_width ? nat_width : dis_width;
                $image.css({ width: dis_width });
            }
        },
        fingers: 2,
        threshold: 30
    });
}

function progress_image(progress) {
    hide_zoom_message();
    var $images = $("#Property-Photos img");
    $image.css({ width: '100%' }).hide();

    current_image += (progress ? 1 : -1);
    current_image = current_image < 0 ? current_image = $images.length - 1 : current_image;
    current_image = current_image >= $images.length ? 0 : current_image;
    goto_image(current_image);
}
function display_zoom_message() {
    $('#Zoom_Message').animate({ height: 30, width: 30, marginTop: -15, marginLeft: -15 }, function () {
        $('#Zoom_Message').animate({ height: 50, width: 50, marginTop: -25, marginLeft: -25 }, function () {
            display_zoom_message();
        });
    });
}
function hide_zoom_message() {
    $('#Zoom_Message').stop().fadeOut(function () {
        $(this).remove();
    });
}

function display_list() {
    $("#Property-Photos").hide();
    $("#Property-Photos-Tiles").stop().fadeIn();
}
function goto_image(image_index) {
    var $images = $("#Property-Photos img");
    $images.eq(current_image).hide();
    current_image = image_index;
    $image = $images.eq(current_image);
    $image.show();

    $image.css({ width: 'auto' });
    nat_width = $image.outerWidth();
    nat_width = nat_width > $('#Property-Photos').innerWidth() * 2 ? nat_width : $('#Property-Photos').outerWidth() * 2;
    $image.css({ width: '100%' });

    $("#Property-Photos-Tiles").hide();
    $("#Property-Photos").stop().fadeIn();
}

$(document).ready(function () {
    retrieve_data();
});