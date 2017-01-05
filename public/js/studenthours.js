$(document).ready(function() {
    $('#selectAll').change(function() {
        $('.hourCheck').prop('checked', $(this).is(':checked'));
    });
    $('.hourCheck').change(function() {
        if (!$(this).is(':checked')) {
            $('#selectAll').prop('checked', false);
        }
    });
});
function verify() {
    var dates = [];
    $('.hourCheck:checked').each(function() {
        dates.push($(this).data('date'));
    });
    if (dates.length > 0) {
        $.ajax({
            type: 'POST',
            url: '/checkhours',
            data: {id: $('#name').data('id'), hours: dates}
        }).done(function (data) {
            $('#message').text(data);
        });
    }
}