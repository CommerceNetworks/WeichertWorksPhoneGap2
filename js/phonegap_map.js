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
function build_stored_property_list() {
    $('#Search div.mls-search div.stored_list').remove();
    $('#Search div.saved-search div.stored_list').remove();

    var stored_properties = localStorage["stored_props"];
    if (stored_properties != null) {
        // for mls search pane
        var $stored_list = $('<div class="stored_list"></div>');
		$stored_list.append($('<h3>Saved Listings</h3>'));
		$('#Search div.mls-search').append($stored_list);
		var stored_array = stored_properties.split(',');
		for (var property = 0; property < stored_array.length; property++) {
			var $property = $('<div></div>');
			var $label = $('<label>mls#: ' + stored_array[property] + '</label>');
			$label.attr('mls', stored_array[property]);
			$label.click(function () {
				load_property($(this).attr('mls'));
			});
			$property.append($label);
			var $remove = $('<span></span>');
			$remove.attr('mls', stored_array[property]);
			$remove.click(function () {
				if (confirm('Are you sure you would like to remove ' + $(this).attr('mls') + ' from your saved properties?'))
					remove_from_stored_property_list($(this).attr('mls'));
			});
			$property.append($remove);
			$stored_list.append($property);
		}

        // for saved and recent
		var $stored_mls_list = $('<div class="stored_list"></div>');
		$('#Search div.saved-search').append($stored_mls_list);
		for (var property = 0; property < stored_array.length; property++) {
		    var $property = $('<div></div>');
		    var $label = $('<label>mls#: ' + stored_array[property] + '</label>');
		    $label.attr('mls', stored_array[property]);
		    $label.click(function () {
		        load_property($(this).attr('mls'));
		    });
		    $property.append($label);
		    var $remove = $('<span></span>');
		    $remove.attr('mls', stored_array[property]);
		    $remove.click(function () {
		        if (confirm('Are you sure you would like to remove ' + $(this).attr('mls') + ' from your saved properties?'))
		            remove_from_stored_property_list($(this).attr('mls'));
		    });
		    $property.append($remove);
		    $stored_mls_list.append($property);
		}
    }

    var stored_searches = localStorage["stored_searches"];
    if (stored_searches != null) {
        var $stored_searches_list = $('#Search div.saved-search div.stored_list');
        if ($stored_searches_list.length == 0) {
            $stored_searches_list = $('<div class="stored_list"></div>');
            $('#Search div.saved-search').append($stored_mls_list);
        }
        var stored_array = stored_searches.split(';');
        for (var search = 0; search < stored_array.length; search++) {
            var search_array = stored_array[search].split(':');

            var $search = $('<div></div>');
            var $label = $('<label>search: ' + search_array[1] + '</label>');
            $label.attr('params', search_array[0]);
            $label.click(function () {
                load_recent_search($(this).attr('params'));
            });
            $search.append($label);
            var $remove = $('<span></span>');
            $remove.attr('params', search_array[0]);
            $remove.attr('index', search);
            $remove.click(function () {
                if (confirm('Are you sure you would like to remove this search?'))
                    remove_from_stored_search_list(parseInt($(this).attr('index')));
            });
            $search.append($remove);
            $stored_searches_list.append($search);
        }
    }
}
function remove_from_stored_property_list(mls) {
    var stored_properties = localStorage["stored_props"];
    if (stored_properties != null) {
        var stored_array = stored_properties.split(',');
        var index = stored_array.indexOf(mls);
        if (index >= 0)
            stored_array.splice(index, 1);

		if(stored_array.length > 0)
			localStorage["stored_props"] = stored_array.join(',');
		else
			localStorage.removeItem("stored_props");
    }
    build_stored_property_list();
}
function remove_from_stored_search_list(index) {
    var stored_searches = localStorage["stored_searches"];
    if (stored_searches != null) {
        var stored_array = stored_searches.split(';');
        stored_array.splice(index, 1);
        if (stored_array.length > 0)
            localStorage["stored_searches"] = stored_array.join(';');
        else
            localStorage.removeItem("stored_searches");
    }
    build_stored_property_list();
}

$(document).ready(function () {
    has_local_storage = supports_html5_storage();
    if (has_local_storage)
        build_stored_property_list();
});


/*------------------------------------------*/
/*                                          */
/*      User Current Position               */
/*                                          */
/*------------------------------------------*/
var geocoder = null;
var loc_latlng = null;
var current_marker = null;
var earth_radius = 6371;
function get_current_position() {
    try {
        navigator.geolocation.getCurrentPosition(current_position_success, current_position_error);
    } catch (err) {
        current_position_error(err);
    }
}
function current_position_success(position) {
    try {
        loc_latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        add_current_location_marker();
        update_property_objects_distance();
    } catch (err) {
        current_position_error(err);
    }    
}
function current_position_error(error) {
    alert('Current location could not be determined. Nearby will defined relative to Auburn and Opelika. ');
    loc_latlng = new google.maps.LatLng(32.627, -85.431);
    add_current_location_marker();
    update_property_objects_distance();    
}

function find_entered_location() {
    var street = $('#nearby-address').val();
    var city = $('#nearby-city').val();
    var state = $('#nearby-state').val();
    var zip = $('#nearby-zip').val();
    var address = street + ", " + city + ", " + state + ", " + zip;
    geocoder.geocode({ 'address': address },
        function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    loc_latlng = results[0].geometry.location;
                    add_current_location_marker();
                    update_property_objects_distance();
                }else
                    current_position_error();
            } else {
                current_position_error();
            }
        }
    );
}

function add_current_location_marker() {
    if (current_marker == null) {
        current_marker = new MarkerWithLabel({
            position: loc_latlng,
            draggable: false,
            raiseOnDrag: false,
            icon: "../res/images/icons/transparent.png",
            labelContent: '',
            labelAnchor: new google.maps.Point(10, 15),
            labelClass: "here-label",
            isClicked: false,
            map: map,
            title: 'You Are Here',
            zIndex: google.maps.Marker.MAX_ZINDEX,
            labelZIndex: 2000
        });
    } else {
        current_marker.setPosition(loc_latlng);
    }
}
function update_property_objects_distance() {
    for (var property = 0; property < filtered_property_objects_array.length; property++) {
        var property_object = filtered_property_objects_array[property];
        property_object.distance = calculate_property_distance(property_object.latlng);
    }
    sort_by_nearby();
}
// nearby functions (haversine formula)
function calculate_property_distance(prop_latlng) {
    if (prop_latlng != null) {
        var dist_lat = convert_degrees_to_radians(prop_latlng.lat() - loc_latlng.lat());
        var dist_lng = convert_degrees_to_radians(prop_latlng.lng() - loc_latlng.lng());

        var a = Math.sin(dist_lat / 2) * Math.sin(dist_lat / 2) +
            Math.cos(convert_degrees_to_radians(loc_latlng.lat())) * Math.cos(convert_degrees_to_radians(prop_latlng.lat())) *
            Math.sin(dist_lng / 2) * Math.sin(dist_lng / 2);

        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        var distance = earth_radius * c;
        return distance;
    }

}
function convert_degrees_to_radians(degrees) {
    return degrees * (Math.PI / 180);
}

$(document).ready(function () {
    geocoder = new google.maps.Geocoder();
    initiate_map();
});



/*------------------------------------------*/
/*                                          */
/*      Initialization and Defaults         */
/*                                          */
/*------------------------------------------*/
var active_panel = "Map";
var displayed_count = 20;
var listing_count = 20;
var filtered_key = null;
var filtered_asc = null;

var map;
var map_center;
var latlngbounds;
var markers = new Array();
var location_marker = null;
var tied_markers = new Array();

var infobox;
var awsbucket = "PORTERPROPERTIESCOM";
var $xml = null;
var property_objects_array = new Array();
var filtered_property_objects_array = new Array();

// initialization functions
function initiate_map() {

    latlngbounds = new google.maps.LatLngBounds();

    map_center = new google.maps.LatLng(32.627, -85.431); // centered between Auburn and Opelika
    var mapOptions = { zoom: 12, center: map_center, disableDefaultUI: true };
    map = new google.maps.Map(document.getElementById('Map_Container'), mapOptions);

    google.maps.event.addListener(map, 'bounds_changed', function () {
        map_center = map.getCenter(); // gets the new center when the user pans the map
    });
    google.maps.event.addListener(map, 'click', function () {
        if (infobox != null)
            infobox.close();
    });

    google.maps.event.addListenerOnce(map, 'idle', function () {
        retrieve_properties();
    });
}
function retrieve_properties() {
	$.support.cors=true;

    var ajaxUrl = "http://www.porterproperties.com/app/ajax/?Type=Search";
    $.ajax({
        url: ajaxUrl,
        beforeSend: function (xhr) {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
        },
        cache: false
    }).done(function (data) {
        $xml = $($.parseXML(data));
        parse_properties_xml();
    }).fail(function () {
        alert('page failed to load');
    });
}
function parse_properties_xml() {
    var $properties = $xml.find("Property");
    for (var property = 0; property < $properties.length; property++) {
        $('#Details').html('Loading ' + property + ' of ' + $properties.length);
        var $property = $properties.eq(property);
        var property_object = create_property_object($property);
        property_objects_array.push(property_object);
    }
    parse_selection_info();
    filtered_property_objects_array = property_objects_array.slice(0);
    set_defaults();
}
function set_defaults() {
    // #Active Panel
    if (window.location.hash.length > 0) {
        var hash = window.location.hash.substr(1);

        if (hash == 'search') {
            display_search();
        } else {
            display_sort();
            display_get_location(true);
        }
        add_initial_markers_to_map(displayed_count);
    } else
        add_markers_to_map(0);

    $('#' + active_panel).addClass('active_panel');
    $('#Loading').hide();
}
function set_default_sort(key, ascending) {
    var $sort_obj = $('#Sort ul li[filtered_key="' + key + '"][filtered_order="' + ascending + '"]');
    $('#Sort li').removeClass('selected');
    $sort_obj.addClass('selected');

    sort_filter_array_by_key(key, ascending);
}
function add_initial_markers_to_map(displayed_count) {
    displayed_count = displayed_count > filtered_property_objects_array.length ? filtered_property_objects_array.length : displayed_count;
    for (var property = 0; property < filtered_property_objects_array.length && property < displayed_count ; property++) {
        var property_object = filtered_property_objects_array[property];
        //console.log('add marker for ' + property);
        add_marker(property_object, property);

        var list_content = create_list_content(property_object);
        $('#List').append(list_content);
    }

    map.fitBounds(latlngbounds);
    zoom = map.getZoom();
    if (zoom > 14)
        map.setZoom(14);

    var more = $('#Map span.more-listings');
    more.unbind('click');
    if (filtered_property_objects_array.length > displayed_count) {
        more.html('displaying ' + displayed_count + ' listings | more +');
        more.click(function () {
            add_markers_to_map(displayed_count);
        });
    } else
        more.html('displaying ' + displayed_count);

    $('#List span.more-listings').remove();
    if (filtered_property_objects_array.length > displayed_count) {
        var $more = $('<span class="more-listings">Load More Listings</span>');
        $more.click(function () {
            add_markers_to_map(displayed_count);
        });
        $('#List').append($more);
    }
}


/*------------------------------------------*/
/*                                          */
/*      Map and List Updates                */
/*                                          */
/*------------------------------------------*/
function add_markers_to_map(start_position) {
    if (infobox != null)
        infobox.close();

    displayed_count = listing_count + start_position > filtered_property_objects_array.length ? filtered_property_objects_array.length : listing_count + start_position;
    for (var property = start_position; property < filtered_property_objects_array.length && property < displayed_count ; property++) {
        var property_object = filtered_property_objects_array[property];
        //console.log('add marker for ' + property);
        add_marker(property_object, property);

        var list_content = create_list_content(property_object);
        $('#List').append(list_content);
    }

    map.fitBounds(latlngbounds);
    zoom = map.getZoom();
    if (zoom > 14)
        map.setZoom(14);

    var more = $('#Map span.more-listings');
    more.unbind('click');
    if (filtered_property_objects_array.length > listing_count + start_position) {
        more.html('displaying ' + (listing_count + start_position) + ' of ' + filtered_property_objects_array.length + ' listings | more +');
        more.click(function () {
            add_markers_to_map(listing_count + start_position);
        });
    } else
        more.html('displaying ' + (filtered_property_objects_array.length));

    $('#List span.more-listings').remove();
    if (filtered_property_objects_array.length > listing_count + start_position) {
        var $more = $('<span class="more-listings">Load More Listings</span>');
        $more.click(function () {
            add_markers_to_map(listing_count + start_position);
        });
        $('#List').append($more);
    }
    $('#Loading').hide();
}
function add_marker(property_object, property) {
    if (property_object.latlng != null) {
        // loop through markers add see if a marker exists for the lat lng
        var existing_id = -1;
        for (var existing = 0; existing < property; existing++) {
            var existing_object = filtered_property_objects_array[existing];
            if (existing_object.latlng != null) {
                if (property_object.latlng.lat() == existing_object.latlng.lat() &&
                    property_object.latlng.lng() == existing_object.latlng.lng()) {
                    existing_id = existing;
                    if (tied_markers[existing_id] == null)
                        tied_markers[existing_id] = [property];
                    else
                        tied_markers[existing_id].push(property);
                    markers.push(null);
                    break;
                }
            }
        }

        if (existing_id < 0) {
            var marker = new MarkerWithLabel({
                position: property_object.latlng,
                draggable: false,
                raiseOnDrag: false,
                icon: "../res/images/icons/transparent.png",
                labelContent: '<div class="inner">$' + property_object.label_price + '</div><div class="arrow"></div>',
                labelAnchor: new google.maps.Point(26, 23),
                labelClass: "map-label",
                isClicked: false,
                map: map,
                title: '$' + property_object.label_price
            });

            markers.push(marker);
            latlngbounds.extend(property_object.latlng);

            var infobox_content = create_infobox_content(property_object);
            google.maps.event.addListener(marker, 'click', function () {
                if (infobox != null)
                    infobox.close();

                infobox = new InfoBox({
                    content: infobox_content,
                    disableAutoPan: false,
                    pixelOffset: new google.maps.Size(-140, -114),
                    maxWidth: 110,
                    closeBoxURL: "",
                    boxStyle: { width: "280px" }
                });

                infobox.open(map, this);
                map.panTo(marker.getPosition());
            });
        } else {
            // Retrieve the primary marker
            var marker = markers[existing_id];
            if (marker != null) {
                marker.labelContent = '<div class="inner">' + (tied_markers[existing_id].length + 1) + '+</div><div class="arrow"></div>';
                marker.labelClass = "map-label multiple";
                marker.title = (tied_markers[existing_id].length + 1) + ' listings';

                var infobox_content = create_infobox_content_multiple(existing_id);
                google.maps.event.addListener(marker, 'click', function () {
                    if (infobox != null)
                        infobox.close();

                    infobox = new InfoBox({
                        content: infobox_content,
                        disableAutoPan: false,
                        pixelOffset: new google.maps.Size(-140, -144),
                        maxWidth: 110,
                        closeBoxURL: "",
                        boxStyle: { width: "280px" }
                    });

                    infobox.open(map, this);
                    map.panTo(marker.getPosition());
                });
            }
        }
    }
}
function create_property_object($property) {
    var property_object = new Object();

    var mls = $property.find("MST_MLS_NUMBER").text();
    property_object.mls = mls;

    var image = $property.find("Image").text();
    var image_path = null;
    if (image.length > 0)
        image_path = 'http://s3.amazonaws.com/' + awsbucket + '/db/Properties/' + mls + '/lgdisplay/' + image;
    property_object.image = image_path;
    var image_count = parseInt($property.find("ImageCount").text());
    property_object.image_count = image_count;

    var price = parseInt($property.find("List_Price").text());
    property_object.price = price;
    var label_price = format_property_price_label(price);
    property_object.label_price = label_price;
    price = price.toFixed(0).replace(/./g, function (c, i, a) {
        return i && c !== "." && ((a.length - i) % 3 === 0) ? ',' + c : c;
    });
    property_object.display_price = price;

    var typeid = parseInt($property.find("PropertyType").text());
    property_object.typeid = typeid;

    switch (typeid) {
        case 2:
            property_object.typename = "Multi-Family";
            break;
        case 3:
            property_object.typename = "Lots and Land";
            break;
        case 4:
            property_object.typename = "Commercial";
            break;
        default:
            property_object.typename = "Residential";
            break;
    }

    var subtype = $property.find("Property_Type").text();
    property_object.subtype = subtype;
    var bedrooms = 0;
    if ($property.find("Bedroom").text().length > 0)
        bedrooms = parseInt($property.find("Bedroom").text());
    property_object.bedrooms = bedrooms;
    var full_baths = 0;
    if ($property.find("Full_Bath").text().length > 0)
        full_baths = parseInt($property.find("Full_Bath").text());
    property_object.full_baths = full_baths;
    var half_baths = 0;
    if ($property.find("Half_Bath").text().length > 0)
        half_baths = parseInt($property.find("Half_Bath").text());
    property_object.half_baths = half_baths;
    var square_feet = 0;
    if ($property.find("Ttl_Htd_SqFt").text().length > 0)
        square_feet = parseInt($property.find("Ttl_Htd_SqFt").text());
    property_object.square_feet = square_feet;
    var acreage = 0;
    if ($property.find("Lot_Size").text().length > 0)
        acreage = parseFloat($property.find("Lot_Size").text());
    property_object.acreage = acreage;
    if ($property.find("Year_Blt").text().length > 3)
        var built = parseInt($property.find("Year_Blt").text());
    else
        built = " ";
    property_object.built = built;

    var location_street_number = $property.find("Street_Num").text();
    var location_direction = $property.find("Direction").text();
    var location_address = $property.find("Address").text();
    var location_building_number = $property.find("Unit_Bldg_Num").text();
    var location_city = $property.find("City").text();
    var location_state = $property.find("State").text();
    var location_postal = $property.find("ZipCode").text();
    var address = location_street_number + ' ' + location_direction + ' ' + location_address + ' ' + location_building_number + ', ' + location_city + ', ' + location_state + ' ' + location_postal;
    property_object.address = address;

    var latitude = $property.find("Latitude").text();
    property_object.latitude = latitude;
    var longitude = $property.find("Longitude").text();
    property_object.longitude = longitude;
    if (property_object.latitude.length > 4 && property_object.longitude.length > 4)
        property_object.latlng = new google.maps.LatLng(latitude, longitude);
    else
        property_object.latlng = null;

    if (property_object.latlng != null && loc_latlng != null)
        property_object.distance = calculate_property_distance(property_object.latlng);
    else
        property_object.distance = null;


    var modified = $property.find("sys_Last_Modified").text();
    property_object.modified = new Date(modified);

    var openhouses = parseInt($property.find("OpenHouses").text());
    property_object.openhouses = openhouses;

    //if ($property.find("MLSNeighborhoodID").text().length > 0)
    //    var neighborhoodid = parseInt($property.find("MLSNeighborhoodID").text());
    //else
    //    var neighborhoodid = '';
    //property_object.neighborhoodid = neighborhoodid;

    //if ($property.find("MLSNeighborhoodName").text().length > 0)
    //    var neighborhoodname = parseInt($property.find("MLSNeighborhoodName").text());
    //else
    //    var neighborhoodname = '';
    //property_object.neighborhoodname = neighborhoodname;

    if ($property.find("MLSAreaID").text().length > 0)
        var areaid = parseInt($property.find("MLSAreaID").text());
    else
        var areaid = null;
    property_object.areaid = areaid;

    if ($property.find("MLSAreaName").text().length > 0)
        var areaname = $property.find("MLSAreaName").text();
    else
        var areaname = null;
    property_object.areaname = areaname;

    if ($property.find("MLSCityID").text().length > 0)
        var cityid = parseInt($property.find("MLSCityID").text());
    else
        var cityid = null;
    property_object.cityid = cityid;

    if ($property.find("MLSCityName").text().length > 0)
        var cityname = $property.find("MLSCityName").text();
    else
        var cityname = null;
    property_object.cityname = cityname;

    if ($property.find("MLSSchoolID").text().length > 0)
        var schoolid = parseInt($property.find("MLSSchoolID").text());
    else
        var schoolid = null;
    property_object.schoolid = schoolid;

    if ($property.find("MLSSchoolName").text().length > 0)
        var schoolname = $property.find("MLSSchoolName").text();
    else
        var schoolname = null;
    property_object.schoolname = schoolname;

    return property_object;
}
function format_property_price_label(price) {
    var label_price = Math.ceil(price / 1000);
    if (label_price > 1999)
        label_price = (label_price / 1000).toFixed(1) + "m";
    else if (label_price > 999)
        label_price = (label_price / 1000).toFixed(2) + "m";
    else
        label_price += "k";

    return label_price;
}
function create_infobox_content(property_object) {
    var infobox_content = '<div id="Infobox" onclick="load_property(' + property_object.mls + ');">' +
            (property_object.image != null ?
                '<div id="Infobox-Image"><div style="background-image: url(' + property_object.image + ');" ></div><p>' + property_object.image_count + ' Image' + (property_object.image_count != 1 ? 's' : '') + '</p></div>' :
                '<div id="Infobox-Image"></div>'
            ) +
        '<div id="Infobox-Content">' +
            '<p class="mls"><span>MLS#:</span>' + property_object.mls + '</p>' +
            '<p class="price">$' + property_object.display_price + '</p>' +
            '<table>' +
                '<tr>' +
                    (property_object.bedrooms > 0 && property_object.full_baths > 0 ? '<td>' + property_object.bedrooms + ' Bd /' + property_object.full_baths + (property_object.half_baths > 0 ? '+' : '') + ' Ba</td>' : '<td> </td>') +
                    (property_object.square_feet > 0 ? '<td>' + property_object.square_feet + ' Sq Ft</td>' : '<td> </td>') +
                '</tr>' +
                '<tr>' +
                    (property_object.built > 3 ? '<td>built: ' + property_object.built + '</td>' : '<td> </td>') +
                    (property_object.acreage > 0 ? '<td>' + property_object.acreage + ' Acres</td>' : '<td> </td>') +
                '</tr>' +
            '</table>' +
            '<span class="address">' + property_object.address + '</span>' +
    '</div>' +
    '</div>';

    return infobox_content;
}
function create_infobox_content_multiple(existing_id) {
    var property_object = filtered_property_objects_array[existing_id];
    // array of additional properties
    var property_id_array = tied_markers[existing_id];

    var infobox_content = '<div id="Infobox" active-index="0">' +
        '<div id="Infobox-Paging-Header"><p class="prev" onclick="progress_infobox(false);"></p><p class="next" onclick="progress_infobox(true);"></p><span>1 of ' + (property_id_array.length + 1) + '</span></div>';

    // add primary property information
    infobox_content += '<div class="wrap"  ref-index="0">' +
            '<div id="Infobox-Image" onclick="load_property(' + property_object.mls + ');">' +
                '<div style="background-image: url(' + property_object.image + ');" ></div>' +
                '<p>' + property_object.image_count + ' Image' + (property_object.image_count != 1 ? 's' : '') + '</p></div>' +
            '<div id="Infobox-Content"  onclick="load_property(' + property_object.mls + ');">' +
                '<p class="mls"><span>MLS#:</span>' + property_object.mls + '</p>' +
                '<p class="price">$' + property_object.display_price + '</p>' +
                '<table>' +
                    '<tr>' +
                        (property_object.bedrooms > 0 && property_object.full_baths > 0 ? '<td>' + property_object.bedrooms + ' Bd /' + property_object.full_baths + (property_object.half_baths > 0 ? '+' : '') + ' Ba</td>' : '<td> </td>') +
                        (property_object.square_feet > 0 ? '<td>' + property_object.square_feet + ' Sq Ft</td>' : '<td> </td>') +
                    '</tr>' +
                    '<tr>' +
                        (property_object.built > 3 ? '<td>built: ' + property_object.built + '</td>' : '<td> </td>') +
                        (property_object.acreage > 0 ? '<td>' + property_object.acreage + ' Acres</td>' : '<td> </td>') +
                    '</tr>' +
                '</table>' +
                '<span class="address">' + property_object.address + '</span>' +
            '</div>' +
        '</div>';

    //add additional 
    for (var listing = 0; listing < property_id_array.length; listing++) {
        property_object = filtered_property_objects_array[property_id_array[listing]];
        infobox_content += '<div class="wrap hidden"  ref-index="' + (listing + 1) + '">' +
            '<div id="Infobox-Image" onclick="load_property(' + property_object.mls + ');">' +
                '<div style="background-image: url(' + property_object.image + ');" ></div>' +
                '<p>' + property_object.image_count + ' Image' + (property_object.image_count != 1 ? 's' : '') + '</p></div>' +
            '<div id="Infobox-Content" onclick="load_property(' + property_object.mls + ');">' +
                '<p class="mls"><span>MLS#:</span>' + property_object.mls + '</p>' +
                '<p class="price">$' + property_object.display_price + '</p>' +
                '<table>' +
                    '<tr>' +
                        (property_object.bedrooms > 0 && property_object.full_baths > 0 ? '<td>' + property_object.bedrooms + ' Bd /' + property_object.full_baths + (property_object.half_baths > 0 ? '+' : '') + ' Ba</td>' : '<td> </td>') +
                        (property_object.square_feet > 0 ? '<td>' + property_object.square_feet + ' Sq Ft</td>' : '<td> </td>') +
                    '</tr>' +
                    '<tr>' +
                        (property_object.built > 3 ? '<td>built: ' + property_object.built + '</td>' : '<td> </td>') +
                        (property_object.acreage > 0 ? '<td>' + property_object.acreage + ' Acres</td>' : '<td> </td>') +
                    '</tr>' +
                '</table>' +
                '<span class="address">' + property_object.address + '</span>' +
            '</div>' +
        '</div>';
    }

    '</div>';

    return infobox_content;
}
function create_list_content(property_object) {
    var list_content = '<div class="item" onclick="load_property(' + property_object.mls + ');">' +
            '<div class="item-image">' +
                '<div style="background-image: url(' + property_object.image + ');" ></div>' +
                '<p>' + property_object.image_count + ' Image' + (property_object.image_count != 1 ? 's' : '') + '</p></div>' +
            '<div class="item-content">' +
                '<p class="mls"><span>MLS#:</span>' + property_object.mls + '</p>' +
                '<p class="price">$' + property_object.display_price + '</p>' +
                '<table>' +
                    '<tr>' +
                        (property_object.bedrooms > 0 ? '<td>' + property_object.bedrooms + ' Bd</td>' : '<td> </td>') +
                        (property_object.square_feet > 0 ? '<td>' + property_object.square_feet + ' Sq Ft</td>' : '<td> </td>') +
                    '</tr>' +
                    '<tr>' +
                        (property_object.full_baths > 0 ? '<td>' + property_object.full_baths + (property_object.half_baths > 0 ? '+' : '') + ' Ba</td>' : '<td> </td>') +
                        (property_object.acreage > 0 ? '<td>' + property_object.acreage + ' Acres</td>' : '<td> </td>') +
                    '</tr>' +
                '</table>' +
                '<span class="address">' + property_object.address + '</span>' +
                //(property_object.distance != null ? '<span class="address">' + property_object.distance + ' (' + property_object.latitude + ', ' + property_object.longitude + ')</span>' : '') +
                //('<span class="address"> (' + property_object.latitude + ', ' + property_object.longitude + ')</span>') +
        '</div>' +
        '</div>';

    return list_content;
}
function progress_infobox(progess) {
    var $infobox = $('#Infobox');
    var active = parseInt($infobox.attr('active-index'));
    var $tiles = $infobox.find('div.wrap');

    active += progess ? 1 : -1;
    active = active == $tiles.length ? 0 : active;
    active = active < 0 ? $tiles.length - 1 : active;

    $infobox.attr('active-index', active);
    $('#Infobox-Paging-Header span').html((active + 1) + ' of ' + $tiles.length);

    $tiles.hide();
    $tiles.eq(active).show();
}
function remove_markers_and_listings() {
    latlngbounds = new google.maps.LatLngBounds();
    displayed_count = 0;

    if (infobox != null)
        infobox.close();
    $('#List').empty();
    for (marker = 0; marker < markers.length; marker++) {
        if (markers[marker] != null)
            markers[marker].setMap(null);
    }
    markers = new Array();
}


/*------------------------------------------*/
/*                                          */
/*      Panel Display Updates               */
/*                                          */
/*------------------------------------------*/
function display_map(display) {
    $('#Sort').removeClass('active_panel');
    $('#Search').removeClass('active_panel');
    $('#Map').removeClass('active_panel');
    $('#List').removeClass('active_panel');

    active_panel = display ? "Map" : "List";

    $('#' + active_panel).addClass('active_panel');
}
function display_sort() {
    $('#Search').removeClass('active_panel');
    $('#Map').removeClass('active_panel');
    $('#List').removeClass('active_panel');
    $('#Sort').addClass('active_panel');

    display_get_location(false);
}
function display_search() {
    close_property_display_images();
    unload_property();
    $('#Sort').removeClass('active_panel');
    $('#Map').removeClass('active_panel');
    $('#List').removeClass('active_panel');
    $('#Search').addClass('active_panel');
    $('#Search-Navigation').show();
    $('#Search').scrollTop(0);
}

/*------------------------------------------*/
/*                                          */
/*      Sort Updates                        */
/*                                          */
/*------------------------------------------*/
function update_sort(obj, key, ascending) {
    filtered_key = key;
    filtered_asc = ascending;
    $(obj).addClass('selected');

    if (key == "distance") {
        display_get_location(true);
    } else {
        close_sort();
        sort_filter_array_by_key(key, ascending);

        remove_markers_and_listings();
        tied_markers = new Array();
        add_markers_to_map(0);
    }
}
function sort_filter_array_by_key(key, ascending) {
    filtered_property_objects_array = filtered_property_objects_array.sort(function (a, b) {
        var x = a[key],
            y = b[key];

        if (x == " " || x == null) {
            return 1;
        }
        else if (y == " " || y == null) {
            return -1;
        }
        else if (x === y) {
            return 0;
        }
        else if (ascending) {
            return x < y ? -1 : 1;
        }
        else if (!ascending) {
            return x < y ? 1 : -1;
        }
    });

    for(item = 0; item < filtered_property_objects_array.length; item++)
        console.log(filtered_property_objects_array[item].distance);
}

function display_get_location(display) {
    $('#Sort').scrollTop(0);
    if (display) {
        $('#Sort div.sort-address').show();
        $('#Sort div.sort-list').hide();
    } else {
        $('#Sort div.sort-address').hide();
        $('#Sort div.sort-list').show();
    }
    
}
function use_current_location() {
    $('#Loading').show();
    update_property_objects_for_nearby();
    close_sort();
}
function update_property_objects_for_nearby() {
    navigator.geolocation.getCurrentPosition(current_position_success, current_position_error);
}
function use_entered_location() {
    $('#Loading').show();
    find_entered_location();
    close_sort();
}
function sort_by_nearby() {
    sort_filter_array_by_key("distance", true);
    remove_markers_and_listings();
    tied_markers = new Array();
    add_markers_to_map(0);
}
function close_sort() {
    display_get_location(false);

    $('#Sort').removeClass('active_panel');
    $('#Sort li').removeClass('selected');

    $('#Search').removeClass('active_panel');
    $('#Search-Navigation').hide();

    if (active_panel == 'Sort')
        active_panel = "Map";
    $('#' + active_panel).addClass('active_panel');
}


/*------------------------------------------*/
/*                                          */
/*      Search Set Up                       */
/*                                          */
/*------------------------------------------*/
var type_objects_array = new Array();
var sub_type_objects_array = new Array();
var area_objects_array = new Array();
var city_objects_array = new Array();
var school_objects_array = new Array();

function parse_selection_info() {
    for (var prop = 0; prop < property_objects_array.length; prop++) {
        var property_object = property_objects_array[prop];

        // type array
        if (array_object_index_of(type_objects_array, 'typeid', property_object.typeid) < 0) {
            var type_object = new Object();
            type_object.typeid = property_object.typeid;
            type_objects_array.push(type_object);
        }

        // sub type array
        if (array_object_index_of(sub_type_objects_array, 'subtype', property_object.subtype) < 0) {
            var sub_type_object = new Object();
            sub_type_object.typeid = property_object.typeid;
            sub_type_object.typename = property_object.typename;
            sub_type_object.subtype = property_object.subtype;
            sub_type_objects_array.push(sub_type_object);
        }

        // area array
        if (property_object.areaid != null) {
            if (array_object_index_of(area_objects_array, 'areaid', property_object.areaid) < 0) {
                var area_object = new Object();
                area_object.areaid = property_object.areaid;
                area_object.areaname = property_object.areaname;
                area_objects_array.push(area_object);
            }
        }

        // city array
        if (property_object.cityid != null) {
            if (array_object_index_of(city_objects_array, 'cityid', property_object.cityid) < 0) {
                var city_object = new Object();
                city_object.cityid = property_object.cityid;
                city_object.cityname = property_object.cityname;
                city_objects_array.push(city_object);
            }
        }

        // school array
        if (property_object.schoolid != null) {
            if (array_object_index_of(school_objects_array, 'schoolid', property_object.schoolid) < 0) {
                var school_object = new Object();
                school_object.schoolid = property_object.schoolid;
                school_object.schoolname = property_object.schoolname;
                school_objects_array.push(school_object);
            }
        }
    }

    setup_search();
}
function array_object_index_of(containing_array, key, value) {
    for (var index = 0; index < containing_array.length; index++) {
        if (containing_array[index][key] === value) {
            return index;
        }
    }
    return -1;
}


function setup_search() {
    setup_price_range();
    // residential inputs
    setup_bed_range();
    setup_bath_range();
    setup_homesize_range();
    setup_lotsize_range();
    setup_homeage_range();

    setup_mls_areas();
    setup_mls_cities();
    setup_mls_schools();
}

function select_cui_option(obj) {
    var $li = $(obj);
    $li.toggleClass('active');

    var $ul = $li.parent();
    var $active_lis = $ul.find('li.active');

    var selected_array = new Array();
    for (var li = 0; li < $active_lis.length; li++) {
        $active_li = $active_lis.eq(li);
        selected_array.push($active_li.text());
    }

    var $label_span = $ul.parent().parent().find('label span');
    if (selected_array.length > 0) {
        $label_span.html(selected_array.join(', '));
    } else {
        $label_span.html('Any ' + $label_span.text());
    }
}

function setup_mls_areas() {
    var $label = $('<label>Area: <span>Any Area</span></label>');
    $label.click(function () {
        display_overlay_options(this, true);
    });
    $('#MLS-Area').append($label);

    var $div = $('<div class="cui-overlay-options">');
    var $back = $('<span class="cui-button">Done<i></i></span>');
    $back.click(function () {
        display_overlay_options(this, false);
    });
    $div.append($back);

    var $title = $('<h3>Available Areas</h3>');
    $div.append($title);
    var $ul = $('<ul></ul>');
    for (var area = 0; area < area_objects_array.length; area++) {
        var area_object = area_objects_array[area];
        var $li = $('<li cui-option="' + area_object.areaid + '" >' + area_object.areaname + '<span></span></li>');
        $li.click(function () {
            select_cui_option(this);
        });
        $ul.append($li);
    }
    $div.append($ul);
    $('#MLS-Area').append($div);
}
function setup_mls_cities() {
    sort_mls_array_by_key(city_objects_array, 'cityname', true);

    var $label = $('<label>City: <span>All Cities</span></label>');
    $label.click(function () {
        display_overlay_options(this, true);
    });
    $('#MLS-City').append($label);

    var $div = $('<div class="cui-overlay-options">');
    var $back = $('<span class="cui-button">Done<i></i></span>');
    $back.click(function () {
        display_overlay_options(this, false);
    });
    $div.append($back);

    var $title = $('<h3>Available Cities</h3>');
    $div.append($title);
    var $ul = $('<ul></ul>');
    for (var city = 0; city < city_objects_array.length; city++) {
        var city_object = city_objects_array[city];
        var $li = $('<li cui-option="' + city_object.cityid + '">' + city_object.cityname + '<span></span></li>');
        $li.click(function () {
            select_cui_option(this);
        });
        $ul.append($li);
    }
    $div.append($ul);
    $('#MLS-City').append($div);
}
function setup_mls_schools() {
    var $label = $('<label>School: <span>All Schools</span></label>');
    $label.click(function () {
        display_overlay_options(this, true);
    });
    $('#MLS-School').append($label);

    var $div = $('<div class="cui-overlay-options">');
    var $back = $('<span class="cui-button">Done<i></i></span>');
    $back.click(function () {
        display_overlay_options(this, false);
    });
    $div.append($back);

    var $title = $('<h3>Available Schools</h3>');
    $div.append($title);
    var $ul = $('<ul></ul>');
    for (var school = 0; school < school_objects_array.length; school++) {
        var school_object = school_objects_array[school];
        var $li = $('<li cui-option="' + school_object.schoolid + '">' + school_object.schoolname + '<span></span></li>');
        $li.click(function () {
            select_cui_option(this);
        });
        $ul.append($li);
    }
    $div.append($ul);
    $('#MLS-School').append($div);
}
function sort_mls_array_by_key(array, key, ascending) {
    array = array.sort(function (a, b) {
        var x = a[key],
            y = b[key];

        if (x == " " || x == null) {
            return 1;
        }
        else if (y == " " || y == null) {
            return -1;
        }
        else if (x === y) {
            return 0;
        }
        else if (ascending) {
            return x < y ? -1 : 1;
        }
        else if (!ascending) {
            return x < y ? 1 : -1;
        }
    });
}

function setup_price_range() {
    $("#Price-Range").slider({
        range: true,
        min: 0,
        max: 50,
        values: [0, 50],
        slide: function (event, ui) {
            populate_price_range(ui.values[0], ui.values[1]);
        }
    });

    // initial values
    var $slider = $("#Price-Range");
    populate_price_range($slider.slider("values", 0), $slider.slider("values", 1));
}
function populate_price_range(min_input, max_input) {
    var min_value = get_price_range_value(min_input, true);
    var minimum = format_price(min_value);
    var max_value = get_price_range_value(max_input, false);
    var maximum = format_price(max_value);

    if (minimum != maximum)
        $("#Price-Range-Label").html(minimum + ' to ' + maximum);
    else
        $("#Price-Range-Label").html(minimum);

    $("#min-price").val(min_value);
    $("#max-price").val(max_value);
}
function get_price_range_value(value, min_handle) {
    price = 0;
    if (value <= 20)
        price = value * 10000;
    else if (value <= 32)
        price = 200000 + (value - 20) * 25000;
    else if (value <= 42)
        price = 500000 + (value - 32) * 50000;
    else if (value < 50 || min_handle)
        price = 1000000 + (value - 42) * 250000;
    else
        price = 1000000000;

    return price;
}
function format_price(price) {
    var maxed = false;
    maxed = price > 2500000;
    var minned = false;
    minned = price == 0;

    if (maxed)
        price = "no max";
    if (minned)
        price = "no min";

    if (!maxed && !minned) {
        price = price.toFixed(0).replace(/./g, function (c, i, a) {
            return i && c !== "." && ((a.length - i) % 3 === 0) ? ',' + c : c;
        });
        price = "$" + price;
    }

    return price;
}

function setup_bed_range() {
    $("#Bed-Range").slider({
        range: true,
        min: 1,
        max: 5,
        values: [1, 5],
        slide: function (event, ui) {
            populate_bed_range(ui.values[0], ui.values[1]);
        }
    });

    // initial values
    var $slider = $("#Bed-Range");
    populate_bed_range($slider.slider("values", 0), $slider.slider("values", 1));
}
function populate_bed_range(min_input, max_input) {
    var min_value = get_bed_range_value(min_input, true);
    var minimum = format_beds(min_value);
    var max_value = get_bed_range_value(max_input, false);
    var maximum = format_beds(max_value);

    if (minimum != maximum)
        $("#Bed-Range-Label").html(minimum + ' to ' + maximum);
    else
        $("#Bed-Range-Label").html(minimum);

    $("#min-beds").val(min_value);
    $("#max-beds").val(max_value);
}
function get_bed_range_value(value, min_handle) {
    beds = 1;
    if (value < 5 || min_handle)
        beds = value;
    else
        beds = 100;

    return beds;
}
function format_beds(beds) {
    var maxed = false;
    maxed = beds > 5;

    if (maxed)
        beds = "no max";

    return beds;
}

function setup_bath_range() {
    $("#Bath-Range").slider({
        range: true,
        min: 1,
        max: 9,
        values: [1, 9],
        slide: function (event, ui) {
            populate_bath_range(ui.values[0], ui.values[1]);
        }
    });
    // initial values
    var $slider = $("#Bath-Range");
    populate_bath_range($slider.slider("values", 0), $slider.slider("values", 1));
}
function populate_bath_range(min_input, max_input) {
    var min_value = get_bath_range_value(min_input, true);
    var minimum = format_baths(min_value);
    var max_value = get_bath_range_value(max_input, false);
    var maximum = format_baths(max_value);

    if (minimum != maximum)
        $("#Bath-Range-Label").html(minimum + ' to ' + maximum);
    else
        $("#Bath-Range-Label").html(minimum);

    $("#min-baths").val(min_value);
    $("#max-baths").val(max_value);
}
function get_bath_range_value(value, min_handle) {
    baths = 1;
    if (value < 9 || min_handle)
        baths = (value - 1) / 2 + 1;
    else
        baths = 100;

    return baths;
}
function format_baths(baths) {
    var maxed = false;
    maxed = baths > 5;

    if (maxed)
        baths = "no max";

    return baths;
}

function setup_homesize_range() {
    $("#Home-Size-Range").slider({
        range: true,
        min: 0,
        max: 4,
        values: [0, 4],
        slide: function (event, ui) {
            populate_homesize_range(ui.values[0], ui.values[1]);
        }
    });
    // initial values
    var $slider = $("#Home-Size-Range");
    populate_homesize_range($slider.slider("values", 0), $slider.slider("values", 1));
}
function populate_homesize_range(min_input, max_input) {
    var min_value = get_homesize_range_value(min_input, true);
    var minimum = format_homesize(min_value);
    var max_value = get_homesize_range_value(max_input, false);
    var maximum = format_homesize(max_value);

    if (minimum != maximum)
        $("#Home-Size-Range-Label").html(minimum + ' to ' + maximum);
    else
        $("#Home-Size-Range-Label").html(minimum);

    $("#min-home-size").val(min_value);
    $("#max-home-size").val(max_value);
}
function get_homesize_range_value(value, min_handle) {
    sqft = 0;
    if (value < 4 || min_handle)
        sqft = value * 1000;
    else
        sqft = 1000000000;

    return sqft;
}
function format_homesize(sqft) {
    var maxed = false;
    maxed = sqft > 4000;
    var minned = false;
    minned = sqft == 0;

    if (maxed)
        sqft = "no max";
    if (minned)
        sqft = "no min";

    if (!maxed && !minned) {
        sqft += ' sqft';
    }

    return sqft;
}

function setup_lotsize_range() {
    $("#Lot-Size-Range").slider({
        range: true,
        min: 0,
        max: 6,
        values: [0, 6],
        slide: function (event, ui) {
            populate_lotsize_range(ui.values[0], ui.values[1]);
        }
    });
    // initial values
    var $slider = $("#Lot-Size-Range");
    populate_lotsize_range($slider.slider("values", 0), $slider.slider("values", 1));
}
function populate_lotsize_range(min_input, max_input) {
    var min_value = get_lotsize_range_value(min_input, true);
    var minimum = format_lotsize(min_value);
    var max_value = get_lotsize_range_value(max_input, false);
    var maximum = format_lotsize(max_value);

    if (minimum != maximum)
        $("#Lot-Size-Range-Label").html(minimum + ' to ' + maximum);
    else
        $("#Lot-Size-Range-Label").html(minimum);

    $("#min-lot-size").val(min_value);
    $("#max-lot-size").val(max_value);
}
function get_lotsize_range_value(value, min_handle) {
    acres = 0;
    if (value <= 2)
        acres = value / 2;
    else if (value <= 4)
        acres = (value - 2) * 2 + 1;
    else if (value < 6 || min_handle)
        acres = (value - 4) * 2.5 + 5;
    else
        acres = 100000;

    return acres;
}
function format_lotsize(acre) {
    var maxed = false;
    maxed = acre > 10000;
    var minned = false;
    minned = acre == 0;

    if (maxed)
        acre = "no max";
    if (minned)
        acre = "no min";

    if (!maxed && !minned) {
        acre += ' acres';
    }

    return acre;
}

function setup_homeage_range() {
    $("#Home-Age-Range").slider({
        range: true,
        min: 0,
        max: 6,
        values: [0, 6],
        slide: function (event, ui) {
            populate_homeage_range(ui.values[0], ui.values[1]);
        }
    });

    // initial values
    var $slider = $("#Home-Age-Range");
    populate_homeage_range($slider.slider("values", 0), $slider.slider("values", 1));
}
function populate_homeage_range(min_input, max_input) {
    var min_value = get_homeage_range_value(min_input, true);
    var minimum = format_homeage(min_value);
    var max_value = get_homeage_range_value(max_input, false);
    var maximum = format_homeage(max_value);

    if (minimum != maximum)
        $("#Home-Age-Range-Label").html(minimum + ' to ' + maximum);
    else
        $("#Home-Age-Range-Label").html(minimum);

    $("#min-home-age").val(min_value);
    $("#max-home-age").val(max_value);
}
function get_homeage_range_value(value, min_handle) {
    age = 0;
    if (value <= 2)
        age = value;
    else if (value < 6 || min_handle)
        age = ((value - 2) * 2) + 2;
    else
        age = 1000;

    return age;
}
function format_homeage(age) {
    var maxed = false;
    maxed = age > 10;
    var minned = false;
    minned = age == 0;

    if (maxed)
        age = "no max";
    if (minned)
        age = "no min";

    if (!maxed && !minned) {
        age += ' year' + (age != 1 ? 's' : '');
    }

    return age;
}

function display_property_types() {
    var $types = $('#Property-Type');
    var $options = $('#Property-Type div');
    if ($types.is('.active')) {
        $options.stop().slideUp();
    } else {
        $options.stop().slideDown();
    }
    $types.toggleClass('active');
}
function select_property_type(obj) {
    var $li = $(obj);
    $li.parent().find('li').removeClass('active');
    $li.addClass('active');
    var value = $li.attr('cui-option');
    if (value.length > 0) {
        $('#Property-Type label span').html($li.text());
    } else {
        $('#Property-Type label span').html('Any');
    }

    $('#Residential-Info').hide();
    $('#Multi-Family-Info').hide();
    $('#Land-Info').hide();
    $('#Commercial-Info').hide();

    if (value == 'Residential')
        $('#Residential-Info').show();
    if (value == 'Multi-Family')
        $('#Multi-Family-Info').show();
    if (value == 'Land')
        $('#Land-Info').show();
    if (value == 'Commercial')
        $('#Commercial-Info').show();
        

    display_property_types();
}

$(document).ready(function () {
    update_search_type('details');
    $("#MLS-Search-Form").submit(function () { load_property_by_search(); return false; });
    $("#Address-Lookup-Form").submit(function () { use_entered_location(); return false; });
});


/*------------------------------------------*/
/*                                          */
/*      Search                              */
/*                                          */
/*------------------------------------------*/
function load_recent_search(params) {
    //clear
    $('#Property-Type ul li').removeClass('active');
    set_property_type($('#Property-Type ul li').eq(0));
    $('#Search #Residential-Sub-Types ul li').removeClass('active');
    $('#Search #Residential-Sub-Types label span').text('Any');
    $('#Search #Multi-Family-Sub-Types ul li').removeClass('active');
    $('#Search #Multi-Family-Sub-Types label span').text('Any');
    $('#Search #Land-Sub-Types ul li').removeClass('active');
    $('#Search #Land-Sub-Types label span').text('Any');
    $('#Search #Commercial-Sub-Types ul li').removeClass('active');
    $('#Search #Commercial-Sub-Types label span').text('Any');
    $('#Search #MLS-Area ul li').removeClass('active');
    $('#Search #MLS-Area label span').text('Any');
    $('#Search #MLS-City ul li').removeClass('active');
    $('#Search #MLS-City label span').text('Any');
    $('#Search #MLS-School ul li').removeClass('active');
    $('#Search #MLS-School label span').text('Any');
    close_type_overlays();

    var $slider = $("#Price-Range");
    $slider.slider('values', 0, 0);
    $slider.slider('values', 1, 50);
    populate_price_range($slider.slider("values", 0), $slider.slider("values", 1));

    $slider = $("#Bed-Range");
    $slider.slider('values', 0, 1);
    $slider.slider('values', 1, 5);
    populate_bed_range($slider.slider("values", 0), $slider.slider("values", 1));

    $slider = $("#Bath-Range");
    $slider.slider('values', 0, 1);
    $slider.slider('values', 1, 9);
    populate_bath_range($slider.slider("values", 0), $slider.slider("values", 1));

    $slider = $("#Home-Size-Range");
    $slider.slider('values', 0, 0);
    $slider.slider('values', 1, 5);
    populate_homesize_range($slider.slider("values", 0), $slider.slider("values", 1));

    $slider = $("#Lot-Size-Range");
    $slider.slider('values', 0, 0);
    $slider.slider('values', 1, 9);
    populate_lotsize_range($slider.slider("values", 0), $slider.slider("values", 1));

    $slider = $("#Home-Age-Range");
    $slider.slider('values', 0, 0);
    $slider.slider('values', 1, 9);
    populate_homeage_range($slider.slider("values", 0), $slider.slider("values", 1));


    if (params != null) {
        var params_array = params.split('|');
        if (params_array.length > 0) {
            var type_array = params_array[0].split(',');
            var type_value = type_array[1];
            if (type_value == 'Any')
                set_property_type($('#Property-Type ul li').eq(0));
            else
                set_property_type($('#Property-Type ul li[cui-option=' + type_value + ']'));

            $('#Property-Type').removeClass('active');
            $('#Property-Type div').stop().slideUp();

            if (params_array.length > 1) {
                var property_type = parseInt(type_array[0]);
                var sub_type_array = params_array[1].split(',');
                if (property_type == 1) {
                    for (type = 0; type < sub_type_array.length; type++)
                        select_cui_option($('#Search #Residential-Sub-Types ul li[cui-option="' + sub_type_array[type] + '"]'));
                } else if (property_type == 2) {
                    for (type = 0; type < sub_type_array.length; type++)
                        select_cui_option($('#Search #Multi-Family-Sub-Types ul li[cui-option="' + sub_type_array[type] + '"]'));
                } else if (property_type == 3) {
                    for (type = 0; type < sub_type_array.length; type++)
                        select_cui_option($('#Search #Land-Sub-Types ul li[cui-option="' + sub_type_array[type] + '"]'));
                } else if (property_type == 4) {

                    for (type = 0; type < sub_type_array.length; type++) {
                        select_cui_option($('#Search #Commercial-Sub-Types ul li[cui-option="' + sub_type_array[type] + '"]'));
                    }
                }
            }
        }


        if (params_array.length > 2) {
            var price_array = params_array[2].split(',');
            var $slider = $("#Price-Range");
            $slider.slider('values', 0, get_value_for_price(parseInt(price_array[0])));
            $slider.slider('values', 1, get_value_for_price(parseInt(price_array[1])));
            populate_price_range($slider.slider("values", 0), $slider.slider("values", 1));
        }

        if (params_array.length > 3) {
            var bed_array = params_array[3].split(',');
            var $slider = $("#Bed-Range");
            $slider.slider('values', 0, get_value_for_beds(parseInt(bed_array[0])));
            $slider.slider('values', 1, get_value_for_beds(parseInt(bed_array[1])));
            populate_bed_range($slider.slider("values", 0), $slider.slider("values", 1));
        }

        if (params_array.length > 4) {
            var bath_array = params_array[4].split(',');
            var $slider = $("#Bath-Range");
            $slider.slider('values', 0, get_value_for_baths(parseFloat(bath_array[0])));
            $slider.slider('values', 1, get_value_for_baths(parseFloat(bath_array[1])));
            populate_bath_range($slider.slider("values", 0), $slider.slider("values", 1));
        }

        if (params_array.length > 5) {
            var home_size_array = params_array[5].split(',');
            var $slider = $("#Home-Size-Range");
            $slider.slider('values', 0, get_value_for_homesize(parseInt(home_size_array[0])));
            $slider.slider('values', 1, get_value_for_homesize(parseInt(home_size_array[1])));
            populate_homesize_range($slider.slider("values", 0), $slider.slider("values", 1));
        }

        if (params_array.length > 6) {
            var lot_size_array = params_array[6].split(',');
            var $slider = $("#Lot-Size-Range");
            $slider.slider('values', 0, get_value_for_lotsize(parseFloat(lot_size_array[0])));
            $slider.slider('values', 1, get_value_for_lotsize(parseFloat(lot_size_array[1])));
            populate_lotsize_range($slider.slider("values", 0), $slider.slider("values", 1));
        }

        if (params_array.length > 7) {
            var home_age_array = params_array[7].split(',');
            var $slider = $("#Home-Age-Range");
            $slider.slider('values', 0, get_value_for_homeage(parseInt(home_age_array[0])));
            $slider.slider('values', 1, get_value_for_homeage(parseInt(home_age_array[1])));
            populate_homeage_range($slider.slider("values", 0), $slider.slider("values", 1));
        }

        if (params_array.length > 8) {
            var area_array = params_array[8].split(',');
            for (area = 0; area < area_array.length; area++)
                select_cui_option($('#Search #MLS-Area ul li[cui-option="' + area_array[area] + '"]'));
        }

        if (params_array.length > 9) {
            var city_array = params_array[9].split(',');
            for (city = 0; city < city_array.length; city++)
                select_cui_option($('#Search #MLS-City ul li[cui-option="' + city_array[city] + '"]'));
        }

        if (params_array.length > 10) {
            var school_array = params_array[10].split(',');
            for (school = 0; school < school_array.length; school++)
                select_cui_option($('#Search #MLS-School ul li[cui-option="' + school_array[school] + '"]'));
        }
    } 
    update_search_type('details');
}
function set_property_type($li) {
    $li.parent().find('li').removeClass('active');
    $li.addClass('active');
    var value = $li.attr('cui-option');
    if (value.length > 0) {
        $('#Property-Type label span').html($li.text());
    } else {
        $('#Property-Type label span').html('Any');
    }

    $('#Residential-Info').hide();
    $('#Multi-Family-Info').hide();
    $('#Land-Info').hide();
    $('#Commercial-Info').hide();

    if (value == 'Residential')
        $('#Residential-Info').show();
    if (value == 'Multi-Family')
        $('#Multi-Family-Info').show();
    if (value == 'Land')
        $('#Land-Info').show();
    if (value == 'Commercial')
        $('#Commercial-Info').show();
}
function get_value_for_price(price) {
    var value = 0;
    if (price <= 200000) 
        value = price / 10000;
    else if (price <= 500000) 
        value = (price - 200000) / 25000 + 20;
    else if (price <= 1000000) 
        value = (price - 500000) / 50000 + 32;
    else if (price < 1000000000) 
        value = (price - 1000000) / 250000 + 42;
    else 
        value = 50;
    
    return value;
}
function get_value_for_beds(beds) {
    var value = 0;
    if (beds < 5) 
        value = beds;
    else 
        value = 5;
    
    return value;
}
function get_value_for_baths(baths) {
    var value = 0;
    if (baths < 9)
        value = (baths - 1) * 2 + 1;
    else
        value = 9;

    return value;
}
function get_value_for_homesize(sqft) {
    var value = 0;
    if(value < 4)
        value = sqft / 1000;
    else
        value = 4;

    return value;
}
function get_value_for_lotsize(acres) {
    var value = 0;
    if (acres <= 1)
        value = acres * 2;
    else if (acres <= 5)
        value = (acres - 1) / 2 + 2;
    else if (acres < 10)
        value = (acres - 5) / 2.5 + 4;
    else
        value = 6;

    return value;
}
function get_value_for_homeage(age) {
    var value = 0;

    if (age < 2)
        value = age;
    else if (age < 10)
        value = (age - 2) / 2 + 2;
    else
        value = 6;

    return value;
}
function close_type_overlays() {
    display_overlay_options($('#Search #Residential-Sub-Types label').eq(0), false);
    display_overlay_options($('#Search #Multi-Family-Sub-Types label').eq(0), false);
    display_overlay_options($('#Search #Land-Sub-Types label').eq(0), false);
    display_overlay_options($('#Search #Commercial-Sub-Types label').eq(0), false);
    display_overlay_options($('#Search #MLS-Area label').eq(0), false);
    display_overlay_options($('#Search #MLS-City label').eq(0), false);
    display_overlay_options($('#Search #MLS-School label').eq(0), false);
}

function search_properties() {
    filtered_property_objects_array = property_objects_array.slice(0);
    var search_params = "";
    var search_descr = "";
    var valid_search = false;

    var property_type = null;
    var type_value = "";
    if ($('#Property-Type ul li.active').length > 0) {
        type_value = $('#Property-Type ul li.active').attr('cui-option');
        if (type_value.length > 0) {
            switch (type_value) {
                case "Multi-Family":
                    property_type = 2;
                    break;
                case "Land":
                    property_type = 3;
                    break;
                case "Commercial":
                    property_type = 4;
                    break;
                default:
                    property_type = 1;
                    break;
            }
        }
    }
    // params for recent searches
    valid_search = (property_type > 1);
    search_params += ( property_type == null ? 0 : property_type) + ',' + type_value + ',' + $('#Property-Type label span').text();
    search_descr += (type_value.length > 0 ? type_value : 'Any') + ' Properties';

    var selected_subtype_array = new Array();
    var $selected_types = null;
    if (property_type == 1) 
        $selected_types = $('#Search #Residential-Sub-Types ul li.active');
    else if (property_type == 2) 
        $selected_types = $('#Search #Multi-Family-Sub-Types ul li.active');
    else if (property_type == 3) 
        $selected_types = $('#Search #Land-Sub-Types ul li.active');
    else if (property_type == 4) 
        $selected_types = $('#Search #Commercial-Sub-Types ul li.active');

    if ($selected_types != null) {
        for (var type = 0; type < $selected_types.length; type++) {
            selected_subtype_array.push($selected_types.eq(type).attr('cui-option'));
        }
    }
    // params for recent searches
    valid_search = (selected_subtype_array.length > 0) ? true : valid_search;
    search_params += '|' + selected_subtype_array.join(',');
    search_descr += selected_subtype_array.length > 0 ? ' (' + selected_subtype_array.join(',') + ')' : '';


    var min_price = parseInt($('#min-price').val());
    var max_price = parseInt($('#max-price').val());
    // params for recent searches
    valid_search = (min_price > 0 || max_price < 1000000000) ? true : valid_search;
    search_params += '|' + min_price + ',' + max_price + ',' + $('#Price-Range-Label').text();
    if (min_price > 0 || max_price < 1000000000) {
        search_descr += ', ' + $('#Price-Range-Label').text();
    } else {
        search_descr += ', no price range';
    }
    

    var min_beds = parseInt($('#min-beds').val());
    var max_beds = parseInt($('#max-beds').val());
    // params for recent searches
    if (property_type == 1) {
        valid_search = (min_beds > 1 || max_beds < 100) ? true : valid_search;
        search_params += '|' + min_beds + ',' + max_beds + ',' + $('#Bed-Range-Label').text();
        if (min_beds > 1 || max_beds < 100)
            search_descr += ', ' + $('#Bed-Range-Label').text() + ' beds';
    } else {
        search_params += '|1,100,1 to no max';
    }
    

    var min_baths = parseFloat($('#min-baths').val());
    var max_baths = parseFloat($('#max-baths').val());
    // params for recent searches
    if (property_type == 1) {
        valid_search = (min_baths > 0 || max_baths < 100) ? true : valid_search;
        search_params += '|' + min_baths + ',' + max_baths + ',' + $('#Bath-Range-Label').text();
        if (min_baths > 1 || max_baths < 100)
            search_descr += ', ' + $('#Bath-Range-Label').text() + ' baths';
    } else {
        search_params += '|1,100,1 to no max';
    }
    

    var min_sqft = parseInt($('#min-home-size').val());
    var max_sqft = parseInt($('#max-home-size').val());
    // params for recent searches
    valid_search = (min_sqft > 0 || max_sqft < 1000000000) ? true : valid_search;
    search_params += '|' + min_sqft + ',' + max_sqft + ',' + $('#Home-Size-Range-Label').text();
    if (min_sqft > 0 || max_sqft < 1000000000)
        search_descr += ', ' + $('#Home-Size-Range-Label').text();


    var min_acre = parseFloat($('#min-lot-size').val());
    var max_acre = parseFloat($('#max-lot-size').val());
    // params for recent searches
    valid_search = (min_acre > 0 || max_acre < 100000) ? true : valid_search;
    search_params += '|' + min_acre + ',' + max_acre + ',' + $('#Lot-Size-Range-Label').text();
    if (min_acre > 0 || max_acre < 100000)
        search_descr += ', ' + $('#Lot-Size-Range-Label').text();


    var min_age = parseInt($('#min-home-age').val());
    var max_age = parseInt($('#max-home-age').val());
    // params for recent searches
    valid_search = (min_age > 0 || max_age < 1000) ? true : valid_search;
    search_params += '|' + min_age + ',' + max_age + ',' + $('#Home-Age-Range-Label').text();
    if (min_age > 0 || max_age < 1000)
        search_descr += ', ' + $('#Home-Age-Range-Label').text();

    var $selected_area = $('#Search #MLS-Area ul li.active');
    var selected_area_array = new Array();
    var selected_areaname_array = new Array();
    for (var area = 0; area < $selected_area.length; area++) {
        selected_area_array.push(parseInt($selected_area.eq(area).attr('cui-option')));
        selected_areaname_array.push($selected_area.eq(area).text());
    }
    // params for recent searches
    valid_search = (selected_area_array.length > 0) ? true : valid_search;
    search_params += '|' + selected_area_array.join(',');
    if (selected_areaname_array.length > 0)
        search_descr += ', Areas (' + selected_areaname_array.join(', ') + ')';

    var $selected_city = $('#Search #MLS-City ul li.active');
    var selected_city_array = new Array();
    var selected_cityname_array = new Array();
    for (var city = 0; city < $selected_city.length; city++) {
        selected_city_array.push(parseInt($selected_city.eq(city).attr('cui-option')));
        selected_cityname_array.push($selected_city.eq(city).text());
    }
    // params for recent searches
    valid_search = (selected_city_array.length > 0) ? true : valid_search;
    search_params += '|' + selected_city_array.join(',');
    if (selected_cityname_array.length > 0)
        search_descr += ', Cities (' + selected_cityname_array.join(', ') + ')';

    var $selected_school = $('#Search #MLS-School ul li.active');
    var selected_school_array = new Array();
    var selected_schoolname_array = new Array();
    for (var school = 0; school < $selected_school.length; school++) {
        selected_school_array.push(parseInt($selected_school.eq(school).attr('cui-option')));
        selected_schoolname_array.push($selected_school.eq(school).text());
    }
    // params for recent searches
    valid_search = (selected_school_array.length > 0) ? true : valid_search;
    search_params += '|' + selected_school_array.join(',');
    if (selected_schoolname_array.length > 0)
        search_descr += ', Schools (' + selected_schoolname_array.join(', ') + ')';

    // remove items that do not match price filter
    for (item = filtered_property_objects_array.length - 1; item >= 0; item--) {
        var removed = false;
        var property_object = filtered_property_objects_array[item];

        // check area
        if (selected_area_array.length > 0) {
            if (selected_area_array.indexOf(property_object.areaid) < 0) {
                filtered_property_objects_array.splice(item, 1);
                removed = true;
            }
        }
        if (!removed) {
            // check city
            if (selected_city_array.length > 0) {
                if (selected_city_array.indexOf(property_object.cityid) < 0) {
                    filtered_property_objects_array.splice(item, 1);
                    removed = true;
                }
            }
        }
        if (!removed) {
            // check school
            if (selected_school_array.length > 0) {
                if (selected_school_array.indexOf(property_object.schoolid) < 0) {
                    filtered_property_objects_array.splice(item, 1);
                    removed = true;
                }
            }
        }
        if (!removed) {
            // check property type
            if (property_type != null) {
                var typeid = property_object.typeid;
                if (typeid != property_type) {
                    filtered_property_objects_array.splice(item, 1);
                    removed = true;
                }
            }
        }
        if (!removed) {
            // check property sub type
            if (selected_subtype_array.length > 0) {
                console.log('[' + property_object.subtype + ']');
                if (selected_subtype_array.indexOf(property_object.subtype) < 0) {
                    filtered_property_objects_array.splice(item, 1);
                    removed = true;
                }
            }
        }        

        if (!removed) {
            var price = property_object.price;
            if (price < min_price || price > max_price) {
                filtered_property_objects_array.splice(item, 1);
                removed = true;
            }
        }
        if (property_type == 1) {
            if (!removed) {
                var bedrooms = property_object.bedrooms;
                if (bedrooms < min_beds || bedrooms > max_beds) {
                    filtered_property_objects_array.splice(item, 1);
                    removed = true;
                }
            }
            if (!removed) {
                var full_baths = property_object.full_baths;
                var half_baths = property_object.half_baths;
                var baths = full_baths + (half_baths > 0 ? .5 : 0);
                if (baths < min_baths || baths > max_baths) {
                    filtered_property_objects_array.splice(item, 1);
                    removed = true;
                }
            }
            if (!removed) {
                var squarefeet = property_object.square_feet;
                if (squarefeet < min_sqft || squarefeet > max_sqft) {
                    filtered_property_objects_array.splice(item, 1);
                    removed = true;
                }
            }
        }
        if (!removed) {
            var acres = property_object.acreage;
            if (acres < min_acre || acres > max_acre) {
                filtered_property_objects_array.splice(item, 1);
                removed = true;
            }
        }
        if (!removed) {
            var acres = property_object.year;
            if (acres < min_acre || acres > max_acre) {
                filtered_property_objects_array.splice(item, 1);
                removed = true;
            }
        }
    }

    display_results_count(filtered_property_objects_array.length, true);
    if (filtered_property_objects_array.length > 0) {
        close_search();
        close_type_overlays();
        if (valid_search)
            store_search(search_params, search_descr);
    }
}
function store_search(params, descr) {
    if (has_local_storage) {
        var stored_searches = localStorage["stored_searches"];

        if (stored_searches != null) {
            // verify that search does not already exist
            var exists = false;
            var stored_search_array = stored_searches.split(';');
            for (var search = 0; search < stored_search_array.length; search++) {
                var search_array = stored_search_array[search].split(':');
                if (search_array[0] == params)
                    exists = true;
            }
            if (!exists)
                stored_searches += ';' + params + ':' + descr;
        }
        else
            stored_searches = params + ':' + descr;
        localStorage["stored_searches"] = stored_searches;
    }
    build_stored_property_list();
}
function close_search() {
    $('#Search').removeClass('active_panel');
    if (active_panel == 'Sort' || active_panel == 'Search')
        active_panel = "Map";
    $('#' + active_panel).addClass('active_panel');

    $('#Search-Navigation').hide();

    display_sort();
}
function display_results_count(items, display) {
    if (display) {
        if (items > 0) 
            $('#Results_Message p').html(items + ' Listing' + (items != 1 ? 's' : '') + ' Found');
        else
            $('#Results_Message p').html('No Listings Found<br />Please Adjust Your Search');
        $('#Results_Message').fadeIn();
        setTimeout('display_results_count(null, false);', 2000);
    } else {
        $('#Results_Message').stop().fadeOut();
    }
}

function update_search_type(type) {
    if (type == "mls") {
        $("#Search-Navigation div.subnav span.mls").addClass('active');
        $("#Search-Navigation div.subnav span.details").removeClass('active');
        $("#Search-Navigation div.subnav span.saved").removeClass('active');
        $("#Search div.details-search").hide();
        $("#Search div.mls-search").show();
        $("#Search div.saved-search").hide();
        $("#Search-Navigation span.search").show();
        $("#Search-Navigation span.search").unbind('click').click(function () {
            load_property_by_search();
        });
    } else if (type == "details") {
        $("#Search-Navigation div.subnav span.mls").removeClass('active');
        $("#Search-Navigation div.subnav span.details").addClass('active');
        $("#Search-Navigation div.subnav span.saved").removeClass('active');
        $("#Search div.details-search").show();
        $("#Search div.mls-search").hide();
        $("#Search div.saved-search").hide();
        $("#Search-Navigation span.search").show();
        $("#Search-Navigation span.search").unbind('click').click(function () {
            search_properties();
        });
    }else{
        $("#Search-Navigation div.subnav span.mls").removeClass('active');
        $("#Search-Navigation div.subnav span.details").removeClass('active');
        $("#Search-Navigation div.subnav span.saved").addClass('active');
        $("#Search div.details-search").hide();
        $("#Search div.mls-search").hide();
        $("#Search div.saved-search").show();
        $("#Search-Navigation span.search").hide();
    }
}
function display_overlay_options(obj, display) {
    if (display) {
        var $options = $(obj).parent().find('div.cui-overlay-options');
        $options.show();
        $('#Search').css({ overflow: 'hidden' });
    } else {
        var $options = $(obj).parent();
        $options.hide();
        $('#Search').css({ overflow: 'auto' });
    }
}



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
	$.support.cors=true;


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

    if ($property.length > 0) {

        var type = 1;
        if ($property.find("type").text().length > 0)
            type = parseInt($property.find("type").text());

        load_property_glance_details($property);
        load_property_images($property, $property.find("mls").text());
        load_property_agents($property);
        load_property_summary($property);
        load_property_open_house($property)
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
		if(saved){
			$('#Property-Navigation span.save').addClass('unsave');
			$('#Property-Navigation span.save').html('<i></i>Remove');
			$('#Property-Navigation span.save').click(function () {
				remove_from_stored_property_list($(this).attr('mls'));				
				set_property_save_link($(this).attr('mls'));
			});
		}else{
			$('#Property-Navigation span.save').removeClass('unsave');
			$('#Property-Navigation span.save').html('<i></i>Save');
			$('#Property-Navigation span.save').click(function () {
				// retrieve saved
				if(!check_if_property_saved($(this).attr('mls'))){
					var stored_properties = localStorage["stored_props"];
					if (stored_properties != null)
						stored_properties += ',' + $(this).attr('mls');
					else
						stored_properties = $(this).attr('mls');
					localStorage["stored_props"] = stored_properties;
				}
				build_stored_property_list();
				set_property_save_link($(this).attr('mls'));
			});
		}       
    } else {
        $('#Property-Navigation span.save').hide();
    }
}
function check_if_property_saved(mls){
	var stored_properties = localStorage["stored_props"];
	if (stored_properties != null){
		var property_array = stored_properties.split(',');
		return property_array.indexOf(mls) >= 0;
	}else
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
        $("#Property-Photos").swipe({ tap: open_property_display_images });
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
                ($agent.find("agent_title").text().length > 0 ? '(' + $agent.find("agent_title").text() + ')' : '') + '</a></p>';
            content += '<p><span>DRE #: </span>' + $agent.find("agent_dre").text() + '</p>';

            var $contacts = $agent.find('agent_contact');
            if ($contacts.length > 0) {
                content += '<p>';
                for (var contact = 0; contact < $contacts.length; contact++) {
                    var $contact = $contacts.eq(contact);
                    content += $contact.text() + '<br />';
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

function load_property_by_search() {
    var mls = $('#Search div.mls-search input').val();
    load_property(mls);
}

$(document).ready(function () {
    set_up_property_display_pinchzoom();
    $(window).resize(function () {
        size_property_photos();
    });
});






