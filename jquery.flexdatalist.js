/**
 * jQuery FlexDatalist.
 * Autocomplete alike to input fields.
 *
 * Depends:
 * jquery.js 1.7+
 *
 * Documentation:
 * http://projects.sergiodinislopes.pt/jquery.flexdatalist/
 *
 * Demo:
 * http://projects.sergiodinislopes.pt/jquery.flexdatalist/example/
 *
 * Github:
 * https://github.com/sergiodlopes/jquery.flexdatalist/
 */
(function($) {
    $.fn.flexdatalist = function(options) {
        var $document = $(document);
        if (!$document.data('flexdatalist')) {
            // Remove items on click outside
            $(document).mouseup(function (event) {
                var $container = $('.flexdatalist-results');
                if (!$container.is(event.target) && $container.has(event.target).length === 0) {
                    $container.remove();
                }
            // Keyboard navigation
            }).keydown(function (event) {
                var $ul = $('.flexdatalist-results'),
                    $li = $ul.find('li'),
                    $active = $li.filter('.active'),
                    index = $active.index(),
                    length = $li.length,
                    keynum = event.keyCode || event.which;
    
                if (length === 0) {
                    return;
                }
    
                // Enter key
                if (keynum === 13) {
                    $active.click();
                // Up/Down key
                } else if (keynum === 40 || keynum === 38) {
                    var position = 0;
                    // Down key
                    if (keynum === 40) {
                        if (index < length && $active.nextAll('.item').first().length > 0) {
                            $active = $active.removeClass('active').nextAll('.item').first().addClass('active');
                            position = ($active.prev().length === 0 ? $active : $active.prev()).position().top;
                            $ul.animate({
                                scrollTop: position + $ul.scrollTop()
                            }, 100);
                        }
                    // Up key
                    } else if (keynum === 38) {
                        if (index > 0 && $active.prevAll('.item').first().length > 0) {
                            $active = $active.removeClass('active').prevAll('.item').first().addClass('active');
                            position = ($active.prev().length === 0 ? $active : $active.prev()).position().top;
                            $ul.animate({
                                scrollTop: position + $ul.scrollTop()
                            }, 100);
                        }
                    }
                    event.preventDefault();
                }
            }).data('flexdatalist', true);
        }
    
        return this.each(function() {
            var $this = $(this),
                _cache = {},
                _inputName = $this.attr('name');
    
            if ($this.hasClass('flexdatalist')) {
                return;
            }
    
            options = $.extend({
                url: null, // Remote data URL
                data: [],
                cache: true,
                searchContain: true, // 'instance', 'session' or 'local'
                minLength: 3, // minimum characters in with starts searching
                dataAsValue: false, // add to input value the selected data (instead of text/value property)
                mergeRemoteData: false,
                groupBy: false, // Group results by given property name
                selectionRequired: false, // User must select an option on list suggestions
                selectFirstResult: true,
                visibleProperties: ['thumb', 'text', 'category', 'description'],
                searchProperties: ['text']
            }, options, $this.data());
    
        /**
         * Initialize.
         */
            $this.init = function () {
                // Listen to parent input key presses and state events.
                $this.on('keyup', function (event) {
                    var keynum = event.keyCode || event.which;
                    if (keynum === 13 || keynum === 38 || keynum === 40) {
                        return;
                    }
                    var val = $this.keyword();
                    if (val.length >= options.minLength) {
                        $this.search();
                    } else {
                        $this.removeResults();
                        if (options.selectionRequired) {
                            $this.clearInput();
                        }
                    }
                })
                .attr('autocomplete', 'off')
                .addClass('flexdatalist')
                .trigger('init.flexdatalist', [options]);
    
                if (options.selectionRequired && !$this.selected()) {
                    $this.clearInput();
                }
            }
    
        /**
         * Position results below parent element.
         */
            $this.search = function () {
                $this.data(function (data) {
                    var results = [],
                        keyword = $this.keyword();
                    
                    // Merge remote data with data set on init.
                    if (options.mergeRemoteData) {
                        data = $.extends(options.data, data);
                    }
                    
                    var groupProperty = options.groupBy;
                    for (var index = 0; index < data.length; index++) {
                        var _data = $this.match(data[index], keyword);
                        if (!_data) {
                            continue;
                        }                        
                        if (groupProperty) {
                            if (typeof _data[groupProperty] !== 'undefined') {
                                var propertyValue = _data[groupProperty];
                                if (typeof results[propertyValue] === 'undefined') {
                                    results[propertyValue] = [];
                                }
                                results[propertyValue].push(_data);
                            }
                        } else {
                            results.push(_data);
                        }
                    }
                    $this.showResults(results);
                });
            }
    
        /**
         * Match against searchable properties.
         */
            $this.match = function (data, keyword) {
                var matches = false;               
                for (var si = 0; si < options.searchProperties.length; si++) {
                    var searchProperty = options.searchProperties[si];
                    if (typeof data[searchProperty] === 'undefined') {
                        continue;
                    }
                    var propertyValue = data[searchProperty];
                    if ($this.find(propertyValue, keyword)) {
                        data[searchProperty + '_highlight'] = $this.highlight(propertyValue, keyword);
                        matches = true;
                    }
                }
                return matches ? data : null;
            }

        /**
         * Wrap found keyword with span.highlight
         */
            $this.highlight = function (text, keyword) {
                return text.replace(
                    new RegExp(keyword, "ig"),
                    '<span class="highlight">$&</span>'
                );
            }
    
        /**
         * Search for keyword in string.
         */
            $this.find = function (text, keyword) {
                text = $this.normalizeString(text),
                keyword = $this.normalizeString(keyword);
                return (options.searchContain ? (text.indexOf(keyword) >= 0) : (text.indexOf(keyword) === 0));
            }
    
        /**
         * Get data.
         */
            $this.data = function (callback) {
                if (options.data.length > 0) {
                    callback(options.data);
                    return;
                }
                
                var list = $this.attr('list');
                if (list) {
                    $('#' + list).find('option').each(function() {
                        options.data.push({
                            text: $(this).text(),
                            value: $(this).val()
                        });
                    });
                    callback(options.data);
                    return;
                }
    
                var keyword = $this.keyword(),
                    cacheKey = keyword.substring(0, options.minLength),
                    cachedData = $this.cache(cacheKey);
                    
                // Check cache
                if (cachedData) {
                    callback(cachedData);
                    return;
                }
    
                if ($this.hasClass('flexdatalist-loading')) {
                    return;
                }
                $this.addClass('flexdatalist-loading');
    
                $.ajax({
                    url: options.url,
                    data: {keyword: keyword, contain: options.searchContain},
                    type: 'post',
                    dataType: 'json',
                    success: function (data) {
                        $this.removeClass('flexdatalist-loading');
                        var _data = data.results ? data.results : data;
                        if (typeof _data === 'string' && _data.indexOf('[{') === 0) {
                            _data = JSON.parse(_data);
                        }
                        if (typeof _data === 'object') {
                            callback(_data);
                            $this.cache(cacheKey, _data);
                        }
                    }
                });
            }
    
        /**
         * Cached data.
         */
            $this.cache = function (key, data) {
                if (options.cache) {
                    key = $this.normalizeString(key);
                    if (typeof data === 'undefined') {
                        if (typeof _cache[key] !== 'undefined') {
                            data = _cache[key];
                        }
                        return data;
                    }
                    _cache[key] = data;
                }
                return null;
            }
    
        /**
         * Show results.
         */
            $this.showResults = function (data) {
                $this.removeResults();            
                
                if (data.length === 0 && Object.keys(data).length === 0) {
                    return;
                }
                
                var $ul = $this.getContainer();
                if (options.selectionRequired) {
                    $this.clearInput();
                }
                if (!options.groupBy) {
                    $this.items(data, $ul);                
                } else {
                    Object.keys(data).forEach(function (property, index) {
                        var _data = data[property];
                        var $li = $('<li>')
                            .addClass('group')
                            .append($('<span>').addClass('group-name').text(property))
                            .append($('<span>').addClass('group-item-count').text(' ' + _data.length))
                            .appendTo($ul);
                    
                        $this.items(_data, $ul);
                    });
                }
    
                var $li = $ul.find('li:not(.group)');
                $li.on('click', function (event) {
                    var item = $(this).data('item');
                    $this
                        .setValue(item)
                        .trigger('select.flexdatalist', [$(this)]);
                    $this.removeResults();                
                }).hover(function() {
                    $li.removeClass('active');
                    $(this).addClass('active');
                }, function() {
                    $(this).removeClass('active');
                });
                
                if (options.selectFirstResult) {
                    $li.filter(':first').addClass('active');
                }
    
                $this.position($ul);
            }
    
        /**
         * Get/create list container.
         */
            $this.getContainer = function () {
                var $container = $('ul.flexdatalist-results');
                if ($container.length === 0) {
                    $container = $('<ul>')
                        .addClass('flexdatalist-results')
                        .appendTo('body')
                        .css('border-color', $this.css("border-left-color"));
                }
                return $container;
            }
    
        /**
         * Remove results.
         */
            $this.removeResults = function () {
                $('ul.flexdatalist-results').remove();
                return $this;
            }
    
        /**
         * Items iteration.
         */
            $this.items = function (items, $ul) {
                for (var index = 0; index < items.length; index++) {
                    $this.setItem(items[index]).appendTo($ul);
                }
            }
        
        /**
         * Item creation.
         */
            $this.setItem = function (item) {
                var $li = $('<li>')
                    .data('item', item)
                    .addClass('item');
                    
                for (var index = 0; index < options.visibleProperties.length; index++) {
                    var property = options.visibleProperties[index];
                    if (options.groupBy && options.groupBy === property) {
                        continue;
                    }
                    if (typeof item[property] !== 'undefined') {
                        if (property === 'thumb') {
                            // Thumbnail image
                            $('<img>')
                                .addClass('item-' + property)
                                .attr('src', item[property])
                                .appendTo($li);
                        } else {
                            var propertyText = item[property];
                            if (typeof item[property + '_highlight'] !== 'undefined') {
                                propertyText = item[property + '_highlight'];
                            }
                            // Other text properties
                            $('<span>')
                                .addClass('item-' + property)
                                .html(propertyText + ' ')
                                .appendTo($li);
                        }
                        
                    }
                }
                return $li;
            }
    
        /**
         * Position results below parent element.
         */
            $this.position = function ($source) {
                // Set some required CSS propities
                $source.css({
                    'width': $this.outerWidth() + 'px',
                    'top': (($this.offset().top + $this.outerHeight())) + 'px',
                    'left': $this.offset().left + 'px'
                });
            }
    
        /**
         * Set value on item selection.
         */
            $this.setValue = function (item) {
                var value = item.value ? item.value : item.text;
                value = value.trim();
                $this.val(value);
                if (options.dataAsValue) {
                    delete item.highlight;
                    value = JSON.stringify(item);
                }
                return $this.getInput().val(value);
            }
    
        /**
         * Get input that holds item data.
         */
            $this.getInput = function () {
                if (!options.selectionRequired && !options.dataAsValue) {
                    return $this;
                }
                var $input = $('input[type="hidden"][name="' + _inputName + '"]');
                if ($input.length > 0) {
                    return $input;
                }
                $this.attr('name', null);
                return $('<input type="hidden">').attr({'name': _inputName}).insertAfter($this);
            }
    
        /**
         * Clear input value that holds item data.
         */
            $this.clearInput = function () {
                $this.getInput().val('');
            }
    
        /**
         * Normalize string to a consistent one.
         */
            $this.normalizeString = function (string) {
                return string.toUpperCase();
            }
    
        /**
         * Check if data was selected.
         */
            $this.selected = function () {
                return $this.getInput().val().trim().length > 0;
            }
    
        /**
         * Remove special characteres.
         */
            $this.keyword = function () {
                return this.val().trim();
            }
    
            $this.init();
        });
    }
})(jQuery);
