function selectSuper(id) {
    $.ajax({
        method: 'POST',
        url: "/assignsuper",
        data: {id: id}
    }).done(function(msg) {
        $('#response-text').text(msg);
    });
}

$('#search-box').keyup(function() {
    var query = $(this).val();
    var regex = new RegExp(query, 'i');
    $('.supervisor-row').each(function() {
        var data = $(this).children('td');

        var name = $(data[0]).html();
        var company = $(data[1]).html();

        if (name.match(regex) || company.match(regex)) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
});