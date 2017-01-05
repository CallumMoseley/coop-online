$(document).ready(function() {
	$('#signup-form').validate({
		rules: {
            fname: 'required',
            lname: 'required',
            email: {required: true, email: true},
            password: 'required',
            confirm: {required: true, equalTo: '#password'},
            cname: {required: false},
            addr: {required: false}
        },
		messages: {
            fname: '',
            lname: '',
            email: {required: '', email: ''},
            password: '',
            confirm: {required: '', equalTo: ''},
            cname: '',
            addr: '',
            phone: ''
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
    $('#select-role').change(function() {
        var superInfo = $('.supervisor');
        var superInputs = $('.super');
        var teacher = $('.teacher');
        var student = $('.student');
        switch(this.value) {
            case 'Student':
                superInfo.fadeOut();
                teacher.fadeOut();
                student.fadeIn();
                superInputs.each(function() {$(this).rules('add', {required: false})});
                break;
            case 'Supervisor':
                superInfo.fadeIn();
                teacher.fadeOut();
                student.fadeOut();
                superInputs.each(function() {$(this).rules('add', {required: true})});
                break;
            case 'Teacher':
                superInfo.fadeOut();
                student.fadeOut();
                teacher.fadeIn();
                superInputs.each(function() {$(this).rules('add', {required: false})});
                break;
        }
    });
    $('.teacher').hide();
    $('.super').each(function() {$(this).rules('add', {required: false})});
    $('.supervisor').hide();
    $('.student').show();
});