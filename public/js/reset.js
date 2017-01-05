$('#reset-form').submit(function(event) {
    event.preventDefault()
    var pass = $('#password');
    var confirm = $('#confirm');

    if (pass.val() != confirm.val()) {
        confirm.parent().addClass('has-error');
    } else {
        this.submit();
    }
});