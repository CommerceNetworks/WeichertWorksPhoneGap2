var $xml = null;
function retrieve_resources_xml() {
	$.support.cors=true;

    var ajaxUrl = "http://www.porterproperties.com/app/ajax/?Type=Resources";
    $.ajax({
        url: ajaxUrl,
        beforeSend: function (xhr) {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
        }
    }).done(function (data) {
        $xml = $($.parseXML(data));
        parse_resources_xml();
    }).fail(function () {
        alert('page failed to load');
    });
}
function parse_resources_xml() {
    var $categories = $xml.find("category");
    for (var category = 0; category < $categories.length; category++) {
        var $category = $categories.eq(category);

        var category_id = $category.find("category-id").text();
        var category_name = $category.find("category-name").text();
        $('#Category-Selection').append('<option value="' + category_id + '">' + category_name + '</option>');

        var $items = $category.find('category-item');
        parse_items_xml($items, category_id, category_name);
    }

    update_category_selection();
}
function parse_items_xml($items, category_id, category_name) {
    var $category = $('<div ref="' + category_id + '"></div>');

    for (var item = 0; item < $items.length; item++) {
        var $item = $items.eq(item);

        $category.append('<h3>' + $item.find("category-item-name").text() + '</h3>');
        $category.append('<p>' + $item.find("category-item-description").text() + '</p>');

        var $numbers = $item.find('category-item-number');
        parse_item_numbers($numbers, $category);

        var $links = $item.find('category-item-link');
        parse_item_links($links, $category);

        var $socials = $item.find('category-item-social');
        parse_item_socials($socials, $category);
    }

    $('#Items').append($category);
}
function parse_item_numbers($numbers, $category) {
    for (var number = 0; number < $numbers.length; number++) {
        var $number = $numbers.eq(number);
        var number_type = $number.find("category-item-number-type").text();
        var number_link = $number.find("category-item-number-link").text();
        $category.append('<a href="tel:' + number_link + '" >' + number_type + ': ' + number_link + '</a>');
    }
}
function parse_item_links($links, $category) {
    for (var link = 0; link < $links.length; link++) {
        var $link = $links.eq(link);
        var link_type = $link.find("category-item-link-type").text();
        var link_link = $link.find("category-item-link-link").text();
        if (link_type == "link")
            $category.append('<a href="' + link_link + '" target="_blank" onclick="window.open(\'' + link_link + '\', \'_system\'); return false;">' + link_link + '</a>');
        else
            $category.append('<a href="mailto:' + link_link + '">' + link_link + '</a><br />');
    }
}
function parse_item_socials($socials, $category) {
    for (var link = 0; link < $socials.length; link++) {
        var $link = $socials.eq(link);
        var link_type = $link.find("category-item-social-type").text();
        var link_link = $link.find("category-item-social-link").text();
        $category.append('<a href="' + link_link + '" target="_blank">' + link_link + '</a>');
    }
}

function update_category_selection() {
    $('#Loading').remove();

    var selected = $('#Category-Selection').val();
    $('#Categories').slideDown();

    var $active = $('#Items div.active');
    $active.removeClass('active').slideUp();

    var $selected = $('#Items div[ref=' + selected + ']');
    $selected.addClass('active').slideDown();

}

$(document).ready(function () {
    retrieve_resources_xml();
});