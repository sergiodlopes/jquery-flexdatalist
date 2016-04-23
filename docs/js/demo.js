/*!
 * Start Bootstrap - Freelancer Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */

jQuery.fn.outerHTML = function(s) {
    return s
        ? this.before(s).remove()
        : jQuery("<p>").append(this.eq(0).clone()).html();
};

function htmlEncode(value){
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html();
}

$('input').each(function () {
    var value = $(this).outerHTML().trim(),
        $codeContainer = $(this).parents('.row:eq(0)'),
        $htmlContainer = $codeContainer.find('.language-html'),
        $jsContainer = $codeContainer.find('.language-js');
    
    
    
    
    
    
    
    
    
    htmlCode = htmlEncode(value)
        .replace(/"\s/g, '"' + "\n       ")
        .replace(/"/g, "'")
        .split('&amp;quot;').join('"');
    // List
    if ($(this).attr('list')) {
        var listHtml = $('#' + $(this).attr('list')).outerHTML().trim();
        htmlCode += "\n\n" + htmlEncode(listHtml);
    }    
    $htmlContainer.html(htmlCode);
    
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
    
    $jsContainer.html(javascript);
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

