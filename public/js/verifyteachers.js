function verifyTeacher(id) {
    var hiddenForm = $('#hiddenForm');
    hiddenForm.html('<input name="userid" type="hidden" value="' + id + '">');
    hiddenForm.submit();
}