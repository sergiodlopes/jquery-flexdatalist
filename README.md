jQuery.MailTo
======

Simple jQuery plugin to hide email addresses from spambots. If the element is `<a>`, it will add the attribute href with respective `mailto`.

## Demo ##

Check out the [demo page](http://projects.sergiodinislopes.pt/mailto/example/).

## Javascript ##

    $('.email').mailto();

The plugin to avoid having to set `data-host` in multiple email addresses, you can set the default host in the plugin:

    $('.email').mailto({
		host:'domain.com'
	});


## HTML ##

### Basic example ###

    <a class="email" data-account="my.name"></a>

**... will result in...**

    <a class="email" href="mailto:my.name@currenthost.com">my.name@currenthost.com</a>

----------

If you prefer literal email addresses...

    <a class="email">my dot name at domain dot com</a>

**... will result in...**

    <a class="email" href="mailto:my.name@domain.com">my.name@domain.com</a>

----------

### With link text set ###

    <a class="email" data-account="my.name" data-host="domain.com" data-text="My Email"></a>

**... will result in...**

    <a class="email" href="mailto:my.name@domain.com">My Email</a>

----------

### With hostname set ###

    <a class="email" data-account="my.name" data-host="domain.com"></a>

**... will result in...**

    <a class="email" href="mailto:my.name@domain.com">my.name@domain.com</a>

----------

### With subject set: ###

    <a class="email" data-account="my.name" data-host="domain.com" data-subject="Information Request"></a>

**... will result in...**

    <a class="email" href="mailto:my.name@domain.com?subject=Information%20Request">my.name@domain.com</a>

----------

### Example with `<span>` ###

If the element is not a `<a>`, it will not set the href attribute:

    <span class="email" data-account="my.name" data-host="domain.com"></span>

**... will result in...**

    <span class="email">my.name@domain.com</a>

