/*!
 * Start Bootstrap - Freelancer Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */

jQuery.fn.outerHTML = function (s) {
    return s
        ? this.before(s).remove()
        : jQuery("<p>").append(this.eq(0).clone()).html();
};
var htmlEncode = function(value) {
    return $('<div/>').text(value).html();
}

var $codeContainer = function ($parent, languageText, languageCode) {
    var $container = $('<div>').appendTo($parent),
        $h5 = $('<h5>')
            .text(languageText + ' ')
            .append(
                $('<a>').addClass('toggle-code-visibility').attr('href', '#').text('Show')
            ).appendTo($container),
        $pre = $('<pre>').addClass('hidden prettyprint').appendTo($container),
        $code = $('<code>').addClass('language-' + languageCode).appendTo($pre);
    return $code;
};

$('input').each(function () {
    var $this = $(this),
        value = $this.outerHTML().trim(),
        $exampleWrapper = $this.parents('.subsection:eq(0)'),
        $row = $exampleWrapper.find('.row.code-container');
        
    if ($row.length === 0) {
        $row = $('<div>').addClass('row code-container').appendTo($exampleWrapper);
    }
   
    // Get HTML code
    htmlCode = htmlEncode(value)
        .replace(/"\s/g, '"' + "\n       ")
        .replace(/"/g, "'")
        .replace('form-control ', '')
        .split('&amp;quot;').join('"');
    
    // Get datalist HTML
    if ($this.attr('list')) {
        var listHtml = $('#' + $this.attr('list')).outerHTML().trim();
        htmlCode += "\n\n" + htmlEncode(listHtml);
    }
    $codeContainer($row, 'HTML', 'html').html(htmlCode);
    
    // Generate Javascript example code
    var javascript = "$('.flexdatalist').flexdatalist({";
    var data = $(this).data();
    var i = 0;
    $.each(data, function (option, value) {
        if (i > 0) {
            javascript += ',';
        }
        if (typeof value === 'string') {
            value = "'" + value + "'";
        } else if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        javascript += "\n     " + option + ": " + value;
        i++;
    });    
    javascript += "\n});";    
    $codeContainer($row, 'JavaScript', 'js').html(javascript);
    
    // Column 
    var $col = $row.find('> div');    
    $col.each(function () {
        $(this).addClass('col-md-' + (12 / $col.length));
    });
    
});

// jQuery for page scrolling feature - requires jQuery Easing plugin
$(function() {
    $('body').on('click', '.page-scroll a', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500);
        event.preventDefault();
    });
});

// Floating label headings for the contact form
$(function() {
    $("body").on("input propertychange", ".floating-label-form-group", function(e) {
        $(this).toggleClass("floating-label-form-group-with-value", !! $(e.target).val());
    }).on("focus", ".floating-label-form-group", function() {
        $(this).addClass("floating-label-form-group-with-focus");
    }).on("blur", ".floating-label-form-group", function() {
        $(this).removeClass("floating-label-form-group-with-focus");
    });
});

// Highlight the top nav as scrolling occurs
$('body').scrollspy({
    target: '.navbar-fixed-top'
})

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function() {
    $('.navbar-toggle:visible').click();
});

$('a.toggle-code-visibility').on('click', function(event) {
    event.preventDefault();
    var $pre = $(this).parent().next('pre');
    if ($pre.hasClass('hidden')) {
        $pre.removeClass('hidden');
        $(this).text('Hide');
    } else {
        $pre.addClass('hidden');
        $(this).text('Show');
    }
});

var val = $('.flexdatalist').on('select:flexdatalist', function() {
    console.log('Selected!');
}).on('change:flexdatalist', function(event, value) {
    console.log('Changed to: ' + value);
    $(this).parent().find('.input-value span').html('<code>' + value + '</code>');
});

