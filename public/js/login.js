$(document).ready(function() {
	$('#login-form').validate({
		rules: {
			email: {required: true, email: true},
			password: 'required'
		},
		messages: {
            email: {required: '', email: ''},
            password: ''
        },
        errorElement: 'none',
        highlight: function(element, errorClass) {
            $(element).parent().addClass(errorClass);
        },
        unhighlight: function(element, errorClass) {
            $(element).parent().removeClass(errorClass);
        },
        errorClass: 'has-error'
	});
});