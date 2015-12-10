/*------------------------------------------*/
/*                                          */
/*      Local Storage and Saved Items       */
/*                                          */
/*------------------------------------------*/

var has_local_storage = false;
function supports_html5_storage() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }
}
function remove_from_stored_property_list(mls) {
    var stored_properties = localStorage["stored_props"];
    if (stored_properties != null) {
        var stored_array = stored_properties.split(',');
        var index = stored_array.indexOf(mls);
        if (index >= 0)
            stored_array.splice(index, 1);

        if (stored_array.length > 0)
            localStorage["stored_props"] = stored_array.join(',');
        else
            localStorage.removeItem("stored_props");
    }
}
$(document).ready(function () {
    has_local_storage = supports_html5_storage();
});



/*------------------------------------------*/
/*                                          */
/*      Open House List                     */
/*                                          */
/*------------------------------------------*/


var $xml = null;
function retrieve_open_houses_xml() {
    var ajaxUrl = "http://www.porterproperties.com/app/ajax/?Type=OpenHouses";
    $.ajax({
        url: ajaxUrl,
        beforeSend: function (xhr) {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
        }, cache: false
    }).done(function (data) {
        $xml = $($.parseXML(data));
        parse_open_houses_xml();
    }).fail(function () {
        alert('page failed to load');
    });
}
function parse_open_houses_xml() {
    var $properties = $xml.find("property");
    for (var property = 0; property < $properties.length; property++) {
        var $property = $properties.eq(property);

        var mls = $property.find("mls").text();
        var image_count = parseInt($property.find("image_count").text());
        var price = $property.find("price").text();
        var bedrooms = parseInt($property.find("bedrooms").text());
        var full_baths = parseInt($property.find("full_baths").text());
        var half_baths = parseInt($property.find("half_baths").text());
        var sqft = parseInt($property.find("sqft").text());
        var acres = parseFloat($property.find("acres").text());
        var location_street_number = $property.find("location_street_number").text();
        var location_direction = $property.find("location_direction").text();
        var location_address = $property.find("location_address").text();
        var location_building_number = $property.find("location_building_number").text();
        var location_city = $property.find("location_city").text();
        var location_state = $property.find("location_state").text();
        var location_postal = $property.find("location_postal").text();
        var address = location_street_number + ' ' + location_direction + ' ' + location_address + ' ' + location_building_number + '<br />' + location_city + ', ' + location_state + ' ' + location_postal;

        var $open_house_info = $property.find("open_house_dates");
        var start_time = $open_house_info.find("start_time").text();
        var end_time = $open_house_info.find("end_time").text();
        var $dates = $open_house_info.find("date");
        var date_array = new Array();
        for (var date = 0; date < $dates.length; date++) {
            var $date = $dates.eq(date);
            date_array.push($date.text());
        }

        var date_table = '<div class="open-house-table"><table>';
        for (var date = 0; date < date_array.length; date++) {
            date_table += '<tr><td>' + date_array[date] + '</td><td>' + start_time + ' - ' + end_time + '</td></tr>';
        }
        date_table += '</table></div>';

        var list_content = '<div class="item" onclick="load_property(' + mls + ');">' +
           '<div class="item-image">' +
               '<div style="background-image: url(' + $property.find("image").text() + ');" ></div>' +
               '<p>' + image_count + ' Image' + (image_count != 1 ? 's' : '') + '</p></div>' +
           '<div class="item-content">' +
               '<p class="mls"><span>MLS#:</span>' + mls + '</p>' +
               '<p class="price">$' + price + '</p>' +
               '<table>' +
                   '<tr>' +
                       (bedrooms > 0 ? '<td>' + bedrooms + ' Bd</td>' : '<td> </td>') +
                       (sqft > 0 ? '<td>' + sqft+ ' Sq Ft</td>' : '<td> </td>') +
                   '</tr>' +
                   '<tr>' +
                       (full_baths > 0 ? '<td>' + full_baths + (half_baths > 0 ? '+' : '') + ' Ba</td>' : '<td> </td>') +
                       (acres > 0 ? '<td>' + acres + ' Acres</td>' : '<td> </td>') +
                   '</tr>' +
               '</table>' +
               '<span class="address">' + address + '</span>' +
               //(property_object.distance != null ? '<span class="address">' + property_object.distance + ' (' + property_object.latitude + ', ' + property_object.longitude + ')</span>' : '') +
               //('<span class="address"> (' + property_object.latitude + ', ' + property_object.longitude + ')</span>') +
       '</div>' + date_table +
       '</div>';


        $('#List').append($(list_content));
    }
    $('#Loading').hide();
}
$(document).ready(function () {
    retrieve_open_houses_xml();
});

/*------------------------------------------*/
/*                                          */
/*      Property  Display                   */
/*                                          */
/*------------------------------------------*/
var current_image = 0;
var $prop_tds = null;
function size_property_photos() {
    var $prop_photos = $('#Property-Photos');
    if ($prop_photos.length > 0) {
        var max_width = $prop_photos.innerWidth();
        $prop_tds = $('#Property-Photos td');
        $prop_tds.css({ width: max_width });
        var margin = -max_width * current_image;
        $('#Property-Photos table').css({ width: ($prop_tds.length * max_width), marginLeft: margin });
        update_image_counter();
    }
}
function progress_image_left() {
    progress_image(true);
}
function progress_image_right() {
    progress_image(false);
}
function progress_image(progress) {
    current_image += (progress ? 1 : -1);
    current_image = current_image < 0 ? current_image = $prop_tds.length - 1 : current_image;
    current_image = current_image >= $prop_tds.length ? 0 : current_image;

    var $display_image = $prop_tds.eq(current_image);
    var margin = -$display_image.outerWidth() * current_image;
    $('#Property-Photos table').stop().animate({ marginLeft: margin }, 200);
    update_image_counter();
    hide_swipe_message();
}
function update_image_counter() {
    $('#Property-Photos span').html((current_image + 1) + ' of ' + $prop_tds.length);
}


var nat_width = 0;
var display_current_image = 0;
var $images = null;
function open_property_display_images() {
    $('#Property-Images-Navigation').show();
    $('#Property-Images-Display').show();
    $('#Property-Images-Tiles').hide();
    $('#Property-Details').hide();
    $('#Property-Navigation').hide();

    display_current_image = current_image;
    load_property_display_images();

    $('#Zoom_Message').fadeIn();
    display_zoom_message();
    setTimeout('hide_zoom_message();', 2000);

    goto_property_display_image(display_current_image);
}
function close_property_display_images() {
    var $images = $("#Property-Images-Display img");
    $images.eq(display_current_image).hide();
    
    $('#Property-Images-Navigation').hide();
    $('#Property-Images-Display').hide();
    $('#Property-Images-Tiles').hide();

    $('#Property-Details').show();
    $('#Property-Navigation').show();
}
function load_property_display_images() {
    var images_content = '<div id="Zoom_Message"></div>';
    var tile_content = "";
    if ($images.length > 0) {
        for (var image = 0; image < $images.length; image++) {
            var $image = $images.eq(image);
            images_content += '<img src=' + $image.text() + ' />';
            tile_content += '<div onclick="goto_property_display_image(' + image + ');"><div style="background-image: url(' + $image.text() + ');" ></div></div>';
        }
        var $images_content = $(images_content);
        $("#Property-Images-Display").append($images_content);
        var $tile_content = $(tile_content);
        $("#Property-Images-Tiles").append($tile_content);
    }    
}
function goto_property_display_image(image_index) {
    var $images = $("#Property-Images-Display img");
    $images.eq(display_current_image).hide();
    display_current_image = image_index;
    $image = $images.eq(display_current_image);
    $image.show();

    $image.css({ width: 'auto' });
    nat_width = $image.outerWidth();
    nat_width = nat_width > $('#Property-Images-Display').width() * 2 ? nat_width : $('#Property-Images-Display').width() * 2;
    $image.css({ width: '100%' });

    $("#Property-Images-Tiles").stop().hide();
    $("#Property-Images-Display").stop().show();
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
function display_property_display_list() {
    $("#Property-Images-Display").stop().hide();
    $("#Property-Images-Tiles").stop().show();
}
function progress_property_display_image(progress) {
    hide_zoom_message();
    var $images = $("#Property-Images-Display img");
    $image.css({ width: '100%' }).hide();

    display_current_image += (progress ? 1 : -1);
    display_current_image = display_current_image < 0 ? display_current_image = $images.length - 1 : display_current_image;
    display_current_image = display_current_image >= $images.length ? 0 : display_current_image;
    goto_property_display_image(display_current_image);
}
function set_up_property_display_pinchzoom() {
    $("#Property-Images-Display").swipe({
        pinchStatus: function (event, phase, direction, distance, duration, fingerCount, pinchZoom, fingerData) {
            if (fingerCount > 1) {
                var max_steps = 20;
                var container_width = $('#Property-Images-Display').width();
                var container_height = $('#Property-Images-Display').height();
                var display_width = $image.width();

                var log_min_zoom = Math.log(container_width);
                var log_max_zoom = Math.log(nat_width);
                var log_zoom = Math.log(display_width);
                var step = (log_zoom - log_min_zoom) * (max_steps - 1) / (log_max_zoom - log_min_zoom);
                step += (pinchZoom > 1 ? 1 : -1);
                step = step < 0 ? 0 : step;
                step = step > 20 ? 20 : step;

                log_zoom = log_min_zoom + (log_max_zoom - log_min_zoom) * step / (max_steps - 1);
                zoom = Math.exp(log_zoom);

                $image.css({ width: zoom });

                $('#Property-Images-Display').scrollLeft((zoom - container_width) / 2);
                var top_scroll = ($image.height() - container_height) / 2;
                top_scroll = top_scroll < 0 ? 0 : top_scroll;

                $('#Property-Images-Display').scrollTop(top_scroll);
            }
        },
        fingers: 2,
        threshold: 30
    });
}


function load_property(mls) {
    $('#Loading').show();

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
    });
}
function parse_property_xml($property_xml) {
    current_image = 0;
    var $property = $property_xml.find("property");

    // first display the property pane
    $("#Property-Details").empty();
    $("#Property-Container").show();
    $("#Property-Images-Display").empty();
    $("#Property-Images-Tiles").empty();

    if ($property.length > 0) {

        var type = 1;
        if ($property.find("type").text().length > 0)
            type = parseInt($property.find("type").text());

        load_property_glance_details($property);
        load_property_images($property, $property.find("mls").text());
        load_property_agents($property);
        load_property_summary($property);
        load_property_open_house($property);
        load_property_details($property, type);
        load_property_neighborhood($property);
        load_property_map($property);
        load_property_disclaimer($property);

        set_property_directions_link($property);
        set_property_save_link($property.find("mls").text());
    } else {
        $('#Property-Navigation div.right-controls').hide();
        var $error = $('<p class="error">' + ($property_xml.find("error").text()) + '<p>');
        $("#Property-Details").append($error);
    }

    $('#Loading').hide();

    $('#Swipe_Message').fadeIn();
    display_swipe_message();
    setTimeout('hide_swipe_message();', 2000);
}
function set_property_directions_link($property) {
    $('#Property-Navigation div.right-controls').show();

    var address_number = $property.find("address_number").text();
    var address_direction = $property.find("address_direction").text();
    var address_street = $property.find("address_street").text();
    var address_unit_number = $property.find("address_unit_number").text();
    var address_city = $property.find("address_city").text();
    var address_state = $property.find("address_state").text();
    var address_zip = $property.find("address_zip").text();
    var address = address_number + ' ' + address_direction + ' ' + address_street + ' ' + address_unit_number + ' ' + address_city + ', ' + address_state + ', ' + address_zip;

    $('#Property-Navigation span.directions').unbind('click').click(function () {
        location.href = "http://maps.apple.com/?daddr=" + address;
    });
}
function set_property_save_link(mls) {
    if (has_local_storage) {
        $('#Property-Navigation span.save').show();
        $('#Property-Navigation span.save').attr('mls', mls);
        $('#Property-Navigation span.save').unbind('click')

        var saved = check_if_property_saved(mls);
        if (saved) {
            $('#Property-Navigation span.save').addClass('unsave');
            $('#Property-Navigation span.save').html('<i></i>Remove');
            $('#Property-Navigation span.save').click(function () {
                remove_from_stored_property_list($(this).attr('mls'));
                set_property_save_link($(this).attr('mls'));
            });
        } else {
            $('#Property-Navigation span.save').removeClass('unsave');
            $('#Property-Navigation span.save').html('<i></i>Save');
            $('#Property-Navigation span.save').click(function () {
                // retrieve saved
                if (!check_if_property_saved($(this).attr('mls'))) {
                    var stored_properties = localStorage["stored_props"];
                    if (stored_properties != null)
                        stored_properties += ',' + $(this).attr('mls');
                    else
                        stored_properties = $(this).attr('mls');
                    localStorage["stored_props"] = stored_properties;
                }
                set_property_save_link($(this).attr('mls'));
            });
        }
    } else {
        $('#Property-Navigation span.save').hide();
    }
}
function check_if_property_saved(mls) {
    var stored_properties = localStorage["stored_props"];
    if (stored_properties != null) {
        var property_array = stored_properties.split(',');
        return property_array.indexOf(mls) >= 0;
    } else
        return false;
}
function load_property_glance_details($property) {
    var glance_content = '<div class="glance">';
    glance_content += '\t<table cellpadding="0" cellspacing="0">';
    glance_content += '\t\t<tbody>';
    glance_content += '\t\t\t<tr>';

    var bedrooms = 0;
    if ($property.find("beds").text().length > 0)
        bedrooms = parseInt($property.find("beds").text());
    if (bedrooms > 0)
        glance_content += '\t\t\t\t<td>' + bedrooms + '<span>BEDROOMS</span></td>';

    var full_baths = 0;
    if ($property.find("baths").text().length > 0)
        full_baths = parseInt($property.find("baths").text());
    if (full_baths > 0)
        glance_content += '\t\t\t\t<td>' + full_baths + '<span>FULL BATHS</span></td>';

    var half_baths = 0;
    if ($property.find("halfbaths").text().length > 0)
        half_baths = parseInt($property.find("halfbaths").text());
    if (half_baths > 0)
        glance_content += '\t\t\t\t<td>' + half_baths + '<span>PARTIAL BATHS</span></td>';

    var sqft = '';
    if ($property.find("sqft").text().length > 0)
        sqft = $property.find("sqft").text();
    if (sqft.length > 0)
        glance_content += '\t\t\t\t<td>' + sqft + '<span>SQ.FEET</span></td>';

    var acres = '';
    if ($property.find("acres").text().length > 0)
        acres = $property.find("acres").text();
    if (acres.length > 0)
        glance_content += '\t\t\t\t<td>' + acres + '<span>ACRES</span></td>';

    glance_content += '\t\t\t</tr>';
    glance_content += '\t\t</tbody>';
    glance_content += '\t</table>';
    glance_content += '</div>';

    var $glance = $(glance_content);
    $("#Property-Details").append($glance);
}
function load_property_images($property, mls) {
    $images = $property.find("image");
    if ($images.length > 0) {
        var images_content = '<div id="Property-Photos" mls="' + mls + '"><table><tr>';
        for (var image = 0; image < $images.length; image++) {
            var $image = $images.eq(image);
            images_content += '<td><p ref="' + $image.text() + '" style="background-image: url(' + $image.text() + ');"></p></td>';
        }
        images_content += '</tr></table><span></span><div id="Swipe_Message"></div></div>';
        var $images_content = $(images_content);
        $("#Property-Details").append($images_content);
        $("#Property-Photos p").swipe({ fingers: 'all', swipeLeft: progress_image_left, swipeRight: progress_image_right, allowPageScroll: "vertical" });
        $("#Property-Photos").swipe({tap: open_property_display_images});
        size_property_photos();

        load_property_display_images();
    }
}
function display_swipe_message() {
    $('#Swipe_Message').animate({ marginLeft: 0 }, function () {
        $('#Swipe_Message').animate({ marginLeft: -30 }, function () {
            display_swipe_message();
        });
    });
}
function hide_swipe_message() {
    $('#Swipe_Message').stop().fadeOut(function () {
        $(this).remove();
    });
}
function load_property_agents($property) {
    var $agents = $property.find("agent");
    if ($agents.length > 0) {
        var content = "";
        for (var agent = 0; agent < $agents.length; agent++) {
            var $agent = $agents.eq(agent);

            content += '<div class="agent">';
            content += '<h3>Weichert, Realtors- Porter Properties</h3>';

            if ($agent.find("agent_image").text().length > 0)
                content += '<img src="' + $agent.find("agent_image").text() + '" />';

            content += '<div>';
            content += '<p class="agentName">' + $agent.find("agent_first_name").text() + ' ' + $agent.find("agent_last_name").text() + ' ' +
                ($agent.find("agent_title").text().length > 0 ? '(' + $agent.find("agent_title").text() + ')' : '') + '</p>';
            content += '<p><span>DRE #: </span>' + $agent.find("agent_dre").text() + '</p>';

            var $contacts = $agent.find('agent_contact');
            if ($contacts.length > 0) {
                content += '<p>';
                for (var contact = 0; contact < $contacts.length; contact++) {
                    var $contact = $contacts.eq(contact);
                    content += $contact.text();
                }
                content += '</p>';
            }

            content += '</div>';
            content += '</div>';
        }

        var $content = $(content);
        $("#Property-Details").append($content);
    }


}
function load_property_summary($property) {
    var address_number = $property.find("address_number").text();
    var address_direction = $property.find("address_direction").text();
    var address_street = $property.find("address_street").text();
    var address_unit_number = $property.find("address_unit_number").text();
    var address = address_number + ' ' + address_direction + ' ' + address_street + ' ' + address_unit_number;

    var summary = '<div class="property-summary">';
    summary += '<h3>About ' + address + '</h3>';
    summary += '<p>' + $property.find("remarks").text(); + '</p>';
    summary += '</div>';

    var $summary = $(summary);
    $("#Property-Details").append($summary);
}
function load_property_open_house($property) {
    var $open_houses = $property.find("open_house_date");
    if ($open_houses.length > 0) {

        var dates = '<div class="property-open-houses">';
        dates += '<h3>Upcoming Open Houses</h3>';
        dates += '<table>';

        for (var open_house = 0; open_house < $open_houses.length; open_house++) {
            $open_house_date = $open_houses.eq(open_house);
            dates += '<tr><td>' + $open_house_date.find('date').text() + '</td><td>' + $open_house_date.find('start_time').text() + ' - ' + $open_house_date.find('end_time').text() + '</td></tr>';
        }

        dates += '</table>';
        dates += '</div>';
        var $dates = $(dates);
        $("#Property-Details").append($dates);
    }
}
function load_property_details($property, type) {
    var $details = $('<div class="details-panels"></div>');
    $("#Property-Details").append($details);

    load_property_details_essential($property, $details);
    if (type == 1)
        load_property_details_interior($property, $details);
    if (type == 1)
        load_property_details_exterior($property, $details);
    if (type == 1)
        load_property_details_amenities($property, $details);
    load_property_details_community($property, $details);
}
function load_property_details_essential($property, $details) {
    var price = parseInt($property.find("price").text());
    price = price.toFixed(0).replace(/./g, function (c, i, a) {
        return i && c !== "." && ((a.length - i) % 3 === 0) ? ',' + c : c;
    });

    var content = '<div><h3>Essential Information</h3>';
    content += '\t<table cellpadding="0" cellspacing="0">';
    content += '\t\t<tbody>';
    content += '\t\t\t<tr><td>MLS® #:</td><td>' + $property.find("mls").text() + '</td></tr>';
    content += '\t\t\t<tr><td>Price:</td><td>$' + price + '</td></tr>';

    var bedrooms = 0;
    if ($property.find("beds").text().length > 0)
        bedrooms = parseInt($property.find("beds").text());
    if (bedrooms > 0)
        content += '\t\t\t<tr><td>Bedrooms:</td><td>' + bedrooms + '</td></tr>';

    var full_baths = 0;
    if ($property.find("baths").text().length > 0)
        full_baths = parseInt($property.find("baths").text());
    if (full_baths > 0)
        content += '\t\t\t<tr><td>Full Baths:</td><td>' + full_baths + '</td></tr>';

    var half_baths = 0;
    if ($property.find("halfbaths").text().length > 0)
        half_baths = parseInt($property.find("halfbaths").text());
    if (half_baths > 0)
        content += '\t\t\t<tr><td>Half Bath:</td><td>' + half_baths + '</td></tr>';

    var year = 0;
    if ($property.find("year").text().length > 0)
        year = parseInt($property.find("year").text());
    if (year > 0)
        content += '\t\t\t<tr><td>Year Built:</td><td>' + year + '</td></tr>';

    content += '\t\t\t<tr><td>Listing Type:</td><td>' + $property.find("listing_type").text() + '</td></tr>';
    content += '\t\t\t<tr><td>Status:</td><td>' + $property.find("status").text() + '</td></tr>';
    content += '\t\t\t<tr><td>Elementary:</td><td>' + $property.find("school").text() + '</td></tr>';
    content += '\t\t</tbody>';
    content += '\t</table>';
    content += '</div>';

    var $content = $(content);
    $details.append($content);
}
function load_property_details_interior($property, $details) {
    var content = '<div><h3>Interior Information</h3>';
    content += '\t<table cellpadding="0" cellspacing="0">';
    content += '\t\t<tbody>';
    if ($property.find("stories").text().length > 0)
        content += '\t\t\t<tr><td>Stories:</td><td>' + $property.find("stories").text() + '</td></tr>';
    if ($property.find("interior").text().length > 0)
        content += '\t\t\t<tr><td>Interior:</td><td>' + $property.find("interior").text() + '</td></tr>';
    if ($property.find("kitchen").text().length > 0)
        content += '\t\t\t<tr><td>Kitchen Dining:</td><td>' + $property.find("kitchen").text() + '</td></tr>';
    if ($property.find("garage").text().length > 0)
        content += '\t\t\t<tr><td>Garage Carport:</td><td>' + $property.find("garage").text() + '</td></tr>';
    if ($property.find("floor").text().length > 0)
        content += '\t\t\t<tr><td>Floor Covering:</td><td>' + $property.find("floor").text() + '</td></tr>';
    if ($property.find("basement").text().length > 0)
        content += '\t\t\t<tr><td>Foundation Basement:</td><td>' + $property.find("basement").text() + '</td></tr>';
    if ($property.find("fireplace").text().length > 0)
        content += '\t\t\t<tr><td>Fireplaces:</td><td>' + $property.find("fireplace").text() + '</td></tr>';
    if ($property.find("appliances").text().length > 0)
        content += '\t\t\t<tr><td>Appliances:</td><td>' + $property.find("appliances").text() + '</td></tr>';
    if ($property.find("heating").text().length > 0)
        content += '\t\t\t<tr><td>Heating System:</td><td>' + $property.find("heating").text() + '</td></tr>';
    if ($property.find("cooling").text().length > 0)
        content += '\t\t\t<tr><td>Cooling System:</td><td>' + $property.find("cooling").text() + '</td></tr>';
    if ($property.find("waterheater").text().length > 0)
        content += '\t\t\t<tr><td>Water Heater:</td><td>' + $property.find("waterheater").text() + '</td></tr>';
    content += '\t\t</tbody>';
    content += '\t</table>';
    content += '</div>';

    var $content = $(content);
    $details.append($content);
}
function load_property_details_exterior($property, $details) {
    var content = '<div><h3>Exterior Information</h3>';
    content += '\t<table cellpadding="0" cellspacing="0">';
    content += '\t\t<tbody>';
    if ($property.find("exterior_finish").text().length > 0)
        content += '\t\t\t<tr><td>Exterior Finish:</td><td>' + $property.find("exterior_finish").text() + '</td></tr>';
    if ($property.find("porch").text().length > 0)
        content += '\t\t\t<tr><td>Porch/Deck:</td><td>' + $property.find("porch").text() + '</td></tr>';
    if ($property.find("fencing").text().length > 0)
        content += '\t\t\t<tr><td>Fencing:</td><td>' + $property.find("fencing").text() + '</td></tr>';
    if ($property.find("pool").text().length > 0)
        content += '\t\t\t<tr><td>Pool:</td><td>' + $property.find("pool").text() + '</td></tr>';
    if ($property.find("lot_description").text().length > 0)
        content += '\t\t\t<tr><td>Lot Description:</td><td>' + $property.find("lot_description").text() + '</td></tr>';
    if ($property.find("view_type").text().length > 0)
        content += '\t\t\t<tr><td>View Type:</td><td>' + $property.find("view_type").text() + '</td></tr>';
    if ($property.find("storage").text().length > 0)
        content += '\t\t\t<tr><td>Storage:</td><td>' + $property.find("storage").text() + '</td></tr>';
    content += '\t\t</tbody>';
    content += '\t</table>';
    content += '</div>';

    var $content = $(content);
    $details.append($content);
}
function load_property_details_amenities($property, $details) {
    var content = '<div><h3>Amenities Information</h3>';
    content += '\t<table cellpadding="0" cellspacing="0">';
    content += '\t\t<tbody>';
    if ($property.find("utilities").text().length > 0)
        content += '\t\t\t<tr><td>Utilities:</td><td>' + $property.find("utilities").text() + '</td></tr>';
    if ($property.find("subdivision_amenities").text().length > 0)
        content += '\t\t\t<tr><td>Subdivision Amenities:</td><td>' + $property.find("subdivision_amenities").text() + '</td></tr>';
    if ($property.find("miscellaneous").text().length > 0)
        content += '\t\t\t<tr><td>Miscellaneous:</td><td>' + $property.find("miscellaneous").text() + '</td></tr>';
    content += '\t\t</tbody>';
    content += '\t</table>';
    content += '</div>';

    var $content = $(content);
    $details.append($content);
}
function load_property_details_community($property, $details) {
    var address_number = $property.find("address_number").text();
    var address_direction = $property.find("address_direction").text();
    var address_street = $property.find("address_street").text();
    var address_unit_number = $property.find("address_unit_number").text();
    var address = address_number + ' ' + address_direction + ' ' + address_street + ' ' + address_unit_number;

    var content = '<div><h3>Community Information</h3>';
    content += '\t<table cellpadding="0" cellspacing="0">';
    content += '\t\t<tbody>';
    content += '\t\t\t<tr><td>Address:</td><td>' + address + '</td></tr>';
    if ($property.find("address_unit_number").text().length > 0)
        content += '\t\t\t<tr><td>Unit Number:</td><td>' + $property.find("address_unit_number").text() + '</td></tr>';
    if ($property.find("address_city").text().length > 0)
        content += '\t\t\t<tr><td>City:</td><td>' + $property.find("address_city").text() + '</td></tr>';
    if ($property.find("address_county").text().length > 0)
        content += '\t\t\t<tr><td>County:</td><td>' + $property.find("address_county").text() + '</td></tr>';
    if ($property.find("address_state").text().length > 0)
        content += '\t\t\t<tr><td>State:</td><td>' + $property.find("address_state").text() + '</td></tr>';
    if ($property.find("address_zip").text().length > 0)
        content += '\t\t\t<tr><td>Zip Code:</td><td>' + $property.find("address_zip").text() + '</td></tr>';
    if ($property.find("subdivision").text().length > 0)
        content += '\t\t\t<tr><td>Subdivision:</td><td>' + $property.find("subdivision").text() + '</td></tr>';
    if ($property.find("listing_area").text().length > 0)
        content += '\t\t\t<tr><td>Listing Area:</td><td>' + $property.find("listing_area").text() + '</td></tr>';
    if ($property.find("listing_zoning").text().length > 0)
        content += '\t\t\t<tr><td>Zoning:</td><td>' + $property.find("listing_zoning").text() + '</td></tr>';
    content += '\t\t</tbody>';
    content += '\t</table>';
    content += '</div>';

    var $content = $(content);
    $details.append($content);
}
function load_property_neighborhood($property) {
    var $neighborhood = $property.find("neighborhood");
    if ($neighborhood.length > 0) {
        var content = '<div class="neighborhood">';
        content += '\t<h3>About ' + $neighborhood.find("neighborhood_name").text() + '</h3>';
        if ($neighborhood.find("neighborhood_image").text().length > 0)
            content += '\t<img src="' + $neighborhood.find("neighborhood_image").text() + '" />';
        content += '\t<div class="descr">';
        if ($neighborhood.find("neighborhood_summary").text().length > 0)
            content += '\t\t<p><b>About: </b>' + $neighborhood.find("neighborhood_summary").text() + '"</p>';
        if ($neighborhood.find("neighborhood_highlights").text().length > 0)
            content += '\t\t<p><b>Highlights: </b>' + $neighborhood.find("neighborhood_highlights").text() + '"</p>';
        if ($neighborhood.find("neighborhood_pricerange").text().length > 0)
            content += '\t\t<p><b>Price: </b>' + $neighborhood.find("neighborhood_pricerange").text() + '"</p>';
        if ($neighborhood.find("neighborhood_location").text().length > 0)
            content += '\t\t<p><b>Location: </b>' + $neighborhood.find("neighborhood_location").text() + '"</p>';
        content += '\t</div>';
        content += '</div>';

        var $content = $(content);
        $("#Property-Details").append($content);
    }

    var $condo = $property.find("condo");
    if ($condo.length > 0) {
        var content = '<div class="neighborhood">';
        content += '\t<h3>About ' + $condo.find("condo_name").text() + '</h3>';
        if ($condo.find("neighborhood_image").text().length > 0)
            content += '\t<img src="' + $condo.find("condo_image").text() + '" />';
        content += '\t<div class="descr">';
        if ($condo.find("neighborhood_summary").text().length > 0)
            content += '\t\t<p><b>About: </b>' + $condo.find("condo_summary").text() + '"</p>';
        if ($condo.find("neighborhood_highlights").text().length > 0)
            content += '\t\t<p><b>Highlights: </b>' + $condo.find("condo_highlights").text() + '"</p>';
        if ($condo.find("neighborhood_pricerange").text().length > 0)
            content += '\t\t<p><b>Price: </b>' + $condo.find("condo_pricerange").text() + '"</p>';
        if ($condo.find("neighborhood_location").text().length > 0)
            content += '\t\t<p><b>Location: </b>' + $condo.find("condo_location").text() + '"</p>';
        content += '\t</div>';
        content += '</div>';

        var $content = $(content);
        $("#Property-Details").append($content);
    }

    size_youtube_frames();
}
function size_youtube_frames() {
    var $youtubes = $("div.neighborhood iframe[src^='//www.youtube.com']");
    $youtubes.each(function (index) {
        var $youtube = $(this);
        var aspect_ratio = 56;

        if ($youtube.is('[width]') && $youtube.is('[height]')) {
            var height = parseInt($youtube.attr('height'));
            var width = parseInt($youtube.attr('width'));
            $youtube.removeAttr('height');
            $youtube.removeAttr('width');
            aspect_ratio = height / width * 100;
        }
        $youtube.css({ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' });

        $wrapper = $('<div class="youtube-wrapper"></div>');
        $wrapper.css({ position: 'relative', paddingBottom: aspect_ratio + '%', height: 0 });

        $youtube.wrap($wrapper);
    });
}
function load_property_map($property) {
    var content = '<div class="property-map">';
    content += '\t<h3>Location</h3>';
    content += '\t<div id="Property-Map">';
    content += '\t</div>';
    content += '</div>';
    var $content = $(content);
    $("#Property-Details").append($content);

    var property_location = new google.maps.LatLng($property.find('latitude').text(), $property.find('longitude').text());
    var property_map_options = { zoom: 14, center: property_location, mapTypeId: google.maps.MapTypeId.ROADMAP, draggable: false, scrollwheel: false };
    var property_map = new google.maps.Map(document.getElementById('Property-Map'), property_map_options);
    var icon_image = {
        url: '../res/images/icons/home_marker.png',
        size: new google.maps.Size(60, 80),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(15, 40),
        scaledSize: new google.maps.Size(30, 40)
    };
    var property_marker = new google.maps.Marker({ position: property_location, map: property_map, draggable: false, icon: icon_image });
    
}
function load_property_disclaimer($property) {
    var $disclaimer = $('<div class="disclaimer">Courtesy of: ' + $property.find("disclaimer").text() + '</div>');
    $("#Property-Details").append($disclaimer);
}

function unload_property() {
    $("#Property-Container").slideUp();
}

$(document).ready(function () {
    set_up_property_display_pinchzoom();
    $(window).resize(function () {
        size_property_photos();
    });
});