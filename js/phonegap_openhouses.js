var $xml = null;
function retrieve_open_houses_xml() {
    var ajaxUrl = "http://www.porterproperties.com/app/ajax/?Type=OpenHouses";
    $.ajax({
        url: ajaxUrl,
        beforeSend: function (xhr) {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
        }
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
        var price = $property.find("price").text();
        var type = $property.find("type").text();
        var location_street_number = $property.find("location_street_number").text();
        var location_direction = $property.find("location_direction").text();
        var location_address = $property.find("location_address").text();
        var location_building_number = $property.find("location_building_number").text();
        var location_city = $property.find("location_city").text();
        var location_state = $property.find("location_state").text();
        var location_postal = $property.find("location_postal").text();
        var address = location_street_number + ' ' + location_direction + ' ' + location_address + ' ' + location_building_number + '<br />' + location_city + ', ' + location_state + ' ' + location_postal;
        var image = $property.find("image").text();

        var $open_house_info = $property.find("open_house_dates");
        var start_time = $open_house_info.find("start_time").text();
        var end_time = $open_house_info.find("end_time").text();
        var $dates = $open_house_info.find("date");
        var date_array = new Array();
        for (var date = 0; date < $dates.length; date++) {
            var $date = $dates.eq(date);
            date_array.push($date.text());
        }

        var $wrap = $('<div></div>');
        var $tile = $('<div mls="' + mls + '"></div>');
        $tile.click(function () {
            location.href = 'Property.html?mls=' + mls;
        });
        $wrap.append($tile);
        var $img = $('<p></p>');
        $img.css({ 'background-image': 'url(' + image + ')' });
        $img.append('<span>' + type + '</span>');
        $tile.append($img);
        $tile.append('<span class="mls">MLS#: ' + mls + '</span>');
        $tile.append('<span class="price">$' + price + '</span>');
        $tile.append('<span class="address">' + address + '</span>');
        
        var $date_table = $('<table></table>');
        for (var date = 0; date < date_array.length && date < 3; date++) {
            $date_table.append('<tr><td>' + date_array[date] + '</td><td>' + start_time + ' - ' + end_time + '</td></tr>');
        }
        $tile.append($date_table);

        $('#Properties').append($wrap);
    }
    $('#Loading').remove();
    $('#Properties').slideDown();
}

$(document).ready(function () {
    retrieve_open_houses_xml();
});