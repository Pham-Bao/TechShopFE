(function (o) {
    const e = (o['gu'] = o['gu'] || {});
    e.dictionary = Object.assign(e.dictionary || {}, {
        '%0 of %1': '',
        Bold: 'ઘાટુ - બોલ્ડ્',
        Cancel: '',
        Code: '',
        Italic: 'ત્રાંસુ - ઇટલિક્',
        'Remove color': '',
        'Restore default': '',
        Save: '',
        'Show more items': '',
        Strikethrough: '',
        Subscript: '',
        Superscript: '',
        Underline: 'નીચે લિટી - અન્ડરલાઇન્'
    });
    e.getPluralForm = function (o) {
        return o != 1;
    };
})(window.CKEDITOR_TRANSLATIONS || (window.CKEDITOR_TRANSLATIONS = {}));
