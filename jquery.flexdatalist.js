/**
 * jQuery Flexdatalist.
 * Autocomplete input fields, with support for datalists.
 *
 * Version:
 * 2.0.0
 *
 * Depends:
 * jquery.js > 1.8.3
 *
 * Demo and Documentation:
 * http://projects.sergiodinislopes.pt/flexdatalist/
 *
 * Github:
 * https://github.com/sergiodlopes/jquery-flexdatalist/
 *
 */

jQuery.fn.flexdatalist = function (_option, _value) {
    'use strict';

    var destroy = function ($flex) {
        $flex.each(function () {
            var $this = $(this),
                data = $this.data('flexdatalist');
            $this.removeClass('flexdatalist-set')
                .attr('type', 'text')
                .val((data && data.originalValue ? data.originalValue : ''))
                .removeData('flexdatalist')
                .next('.flexdatalist-alias, ul.flexdatalist-multiple')
                .remove();
        });
    }

    // Callable stuff
    if (typeof _option === 'string' && _option !== 'reset') {
        var target = this,
            _foptions = $(this).data('flexdatalist');
        // Set/get value
        if (_option === 'destroy') {
            destroy($(this));
        // Get/Set value
        } else if (_option === 'value') {
            if (typeof _value === 'undefined') {
                return this[0].fvalue.get();
            }
            this[0].fvalue.set(_value);
        // Add value
        } else if (_option === 'add') {
            if (typeof _value === 'undefined') {
                return this[0].debug('Missing value to add!');
            }
            this[0].fvalue.add(_value);
        // Toggle value
        } else if (_option === 'toggle') {
            if (typeof _value === 'undefined') {
                return this[0].debug('Missing value to toggle!');
            }
            this[0].fvalue.toggle(_value);
        // Remove value
        } else if (_option === 'remove') {
            if (typeof _value === 'undefined') {
                return this[0].debug('Missing value to remove!');
            }
            this[0].fvalue.remove(_value);
        // Destroy instance
        } else if (_foptions && typeof _foptions[_option] !== 'undefined') {
            if (typeof _value === 'undefined') {
                return _foptions[_option];
            }
            _foptions[_option] = _value;
            $(this).data('flexdatalist', _foptions);
        }
        return this;
    }

    // Destroy if already set
    if (typeof this[0] !== 'undefined' && typeof this[0].fvalue !== 'undefined') {
        destroy($(this));
    }

    var _options = $.extend({
        url: null,
        data: [],
        params: {},
        relatives: null,
        chainedRelatives: false,
        cache: true,
        cacheLifetime: 60,
        minLength: 2,
        groupBy: false,
        selectionRequired: false,
        focusFirstResult: false,
        textProperty: null,
        valueProperty: null,
        visibleProperties: [],
        thumbProperty: 'thumb',
        searchIn: ['label'],
        searchContain: false,
        searchEqual: false,
        searchByWord: false,
        searchDisabled: false,
        searchDelay: 200,
        normalizeString: null,
        multiple: false,
        maxShownResults: 100,
        removeOnBackspace: true,
        noResultsText: 'No results found for "{keyword}"',
        toggleSelected: false,
        allowDuplicateValues: false,
        requestType: 'get',
        limitOfValues: 0,
        valuesSeparator: ',',
        debug: true
    }, _option);

    return this.each(function () {
        var $this = $(this),
            _this = this,
            _searchTimeout = null,
            $alias = null,
            $multiple = null,
            options = $this.data('flexdatalist');

        if (!options) {
            options = $.extend({},
                _options,
                $this.data(),
                {
                    multiple: $this.is('[multiple]'),
                    originalValue: $this.val(),
                    _values: []
                }
            );
        }

    /**
     * Initialization
     */
        this.init = function () {
            this.prepare();
            this.chained();
            this.fvalue.set($this.attr('value'));

            $alias
            // Focus
            .on('focus', function (event) {
                // Redo search on focus if not selected yet
                _this.control.redoSearchFocus(event);
                _this.control.showAllResults(event);
            })
            // Focusin
            .on('focusin', function() {
                if ($multiple) {
                    $multiple.addClass('focus');
                }
            })
            // Keydown
            .on('input keydown', function (event) {
                if (_this.keyNum(event) === 9) {
                    _this.results.remove();
                }
                _this.control.backSpaceKeyRemove(event);
            })
            // Keyup
            .on('input keyup', function (event) {
                _this.control.keypressSearch(event);
                _this.control.copyValue(event);
                _this.control.backSpaceKeyRemove(event);
            })
            // Focusout
            .on('focusout', function() {
                if ($multiple) {
                    $multiple.removeClass('focus');
                }
            })
            // Blur
            .on('blur', function () {
            });

            window.onresize = function (event) {
                _this.position();
            };
        }

    /**
     * Handle events.
     */
        this.control = {

        /**
         * Check if keypress is valid.
         */
            keypressSearch: function (event) {
                var key = _this.keyNum(event),
                    keyword = $alias.val(),
                    length = keyword.length;

                clearTimeout(_searchTimeout);
                if ((length === 0 && options.minLength > 0) || length < options.minLength) {
                    _this.results.remove();
                // Ignore Enter and Directional keys
                } else if (!key || (key !== 13 && (key < 37 || key > 40))) {
                    _searchTimeout = setTimeout(function () {
                        if (length >= options.minLength) {
                            _this.search(function (matches) {
                                _this.results.show(matches);
                            });
                        } else {
                            _this.results.remove();
                        }
                    }, options.searchDelay);
                }
            },

        /**
         * Redo search if input get's back on focus and no value selected.
         */
            redoSearchFocus: function (event) {
                var val = $this.val();
                if (val.length === 0) {
                    this.keypressSearch(event);
                }
            },

        /**
         * Check if keypress is valid.
         */
            copyValue: function (event) {
                if (_this.keyNum(event) !== 13) {
                    var keyword = $alias.val();
                    if (!options.multiple) {
                        if (!options.selectionRequired) {
                            _this.fvalue.set(keyword);
                        } else {
                            _this.fvalue.clear();
                        }
                    }
                }
            },

        /**
         * Check if keypress is valid.
         */
            backSpaceKeyRemove: function (event) {
                if (options.removeOnBackspace) {
                    var val = $alias.val(),
                        $remove = $alias.data('_remove');
                    if ($remove) {
                        $remove.find('.fdl-remove').click();
                        $alias.data('_remove', null);
                    } else if (val.length === 0 && options.multiple && _this.keyNum(event) === 8) {
                        $alias.data('_remove', $alias.parents('li:eq(0)').prev());
                    }
                }
            },

        /**
         * Show all results if minLength option is 0.
         */
            showAllResults: function (event) {
                var val = $alias.val();
                val = $.trim(val);
                if (val === '' && options.minLength === 0) {
                    _this.data(function (data) {
                        _this.results.show(data);
                    });
                }
            }
        }
    /**
     * Prepare input replacement.
     */
        this.prepare = function () {
            $alias = this.alias();
            if (options.multiple) {
                $multiple = this.multipleInput($alias);
            } else {
                $alias.insertAfter($this);
            }
            // Respect autofocus attribute
            if ($alias.attr('autofocus')) {
                $alias.focus();
            }
        }

    /**
     * Single value input.
     */
        this.alias = function () {
            var $alias = $this
                .clone(false)
                .attr({
                    'list': null,
                    'name': ($this.attr('name') ? $this.attr('name') + '-flexdatalist' : null),
                    'id': ($this.attr('id') ? $this.attr('id') + '-flexdatalist' : null)
                })
                .addClass('flexdatalist-alias')
                .removeClass('flexdatalist');
            $this.addClass('flexdatalist flexdatalist-set').prop('type', 'hidden');
            return $alias;
        }

    /**
     * Multiple values input/list
     */
        this.multipleInput = function ($alias) {
            $multiple = $('<ul tabindex="1">')
                .addClass('flexdatalist-multiple')
                .css({
                    'border-color': $this.css('border-left-color'),
                    'border-width': $this.css('border-left-width'),
                    'border-style': $this.css('border-left-style'),
                    'border-radius': $this.css('border-top-left-radius'),
                    'background-color': $this.css('background-color')
                })
                .insertAfter($this).click(function () {
                    $(this).find('input').focus();
                });
            $('<li class="input-container">')
                .addClass('flexdatalist-multiple-value')
                .append($alias)
                .appendTo($multiple);

            return $multiple;
        }

    /**
     * Chained inputs handling.
     */
        this.chained = function () {
            if (!options.relatives || !options.chainedRelatives) {
                return;
            }
            var toggle = function (init) {
                options.relatives.each(function () {
                    var disabled = _this.isEmpty($(this).val()),
                        empty = _this.isEmpty($this.val());

                    // If disabling, clear all values
                    if (!init && (disabled || !empty)) {
                        _this.fvalue.clear();
                    }
                    if ($multiple) {
                        disabled && $multiple ? $multiple.addClass('disabled') : $multiple.removeClass('disabled');
                    } else {
                        $alias.prop('disabled', disabled);
                    }
                });
            };

            options.relatives.on('change', function () {
                toggle();
            });
            toggle(true);
        }

    /**
     * Manipulate input value(s) (where the real magic happens).
     */
        this.fvalue = {
        /**
         * Get value(s).
         */
            get: function () {
                var val = $this.val();
                if (options.multiple) {
                    return this.toObj(val);
                }
                return this.toStr(val);
            },
        /**
         * Parse given value.
         * Used on input init or when added directly.
         */
            set: function (val, append) {
                var _fvalue = this;
                if (!append) {
                    this.clear(true);
                }
                if (_this.isEmpty(val)) {
                    return;
                }
                this._normalize(val, function (values) {
                    if (!_this.isEmpty(values)) {
                        if ($.isArray(values)) {
                            $.each(values, function (i, value) {
                                _fvalue.extract(value, true);
                            });
                        } else {
                            _fvalue.extract(values, true);
                        }
                        $this.trigger('change:flexdatalist', [
                            values,
                            null,
                            options
                        ]).trigger('change');
                    }
                });
            },
        /**
         * Add value.
         */
            add: function (val) {
                this.set(val, true);
            },
        /**
         * Toggle value.
         */
            toggle: function (val) {
                this.multiple.toggle(val);
            },
        /**
         * Remove value.
         */
            remove: function (val) {
                this.multiple.remove(val);
            },
        /**
         * Normalize value.
         */
            _normalize: function (data, callback) {
                if (this.isJSON() || this.isCSV()) {
                    try {
                        data = this.toObj(data);
                    } catch (e) {
                        _this.debug('Invalid JSON given');
                    }
                }
                if (this.isCSV() || typeof options.valueProperty === 'string') {
                    var _searchIn = options.searchIn,
                        _searchEqual = options.searchEqual;
                    options.searchIn = options.valueProperty.split(',');
                    options.searchEqual = true;
                    _this.search(function (matches) {
                        if (matches.length > 0) {
                            callback(matches);
                        }
                        options.searchIn = _searchIn;
                        options.searchEqual = _searchEqual;
                    }, data);
                } else {
                    callback(data);
                }
            },
        /**
         * Add value.
         */
            extract: function (val, parse) {
                var txt = this.text(val),
                    value = this.value(val),
                    current = $this.val();

                if (!_this.isEmpty(val)) {
                    if (!value) {
                        return _this.debug('No value found');
                    } else if (!txt) {
                        return _this.debug('No text found');
                    }
                }
                // For allowDuplicateValues
                if (txt) {
                    options._values.push(txt);
                }

                if (options.multiple) {
                    this.multiple.add(value, txt);
                } else {
                    this.single(value, txt);
                }

                if (!parse) {
                    $this.trigger('change:flexdatalist', [
                        value,
                        txt,
                        options
                    ]).trigger('change');
                }
            },
        /**
         * Default input value.
         */
            single: function (val, txt) {
                if (txt && txt !== $alias.val()) {
                    $alias.val(txt, true);
                }
                $this.val(val, true);
            },
        /**
         * Input with multiple values.
         */
            multiple: {
            /**
             * Add value and item on list.
             */
                add: function (val, txt) {
                    var _multiple = this,
                        $li = this.li(val, txt);
                    // Toggle
                    $li.click(function () {
                        _multiple.toggle($(this));
                    // Remove
                    }).find('.fdl-remove').click(function () {
                        _multiple.remove($(this).parent());
                    });

                    this.push(val);
                    $alias.val('', true);
                    this.checkLimit();
                },
            /**
             * Push value to input.
             */
                push: function (val, index) {
                    var current = _this.fvalue.get();
                    val = _this.fvalue.toObj(val);
                    current.push(val);
                    val = _this.fvalue.toStr(current);
                    $this.val(val, true);
                },
            /**
             * Toggle value.
             */
                toggle: function ($li) {
                    if (!options.toggleSelected) {
                        return;
                    }
                    $li = this.findLi($li);
                    var index = $li.index(),
                        current = _this.fvalue.get();
                    if ($li.hasClass('disabled')) {
                        var value = $li.data('value');
                        current.splice(index, 0, value);
                        $li.removeClass('disabled');
                    } else {
                        current.splice(index, 1);
                        $li.addClass('disabled');
                    }
                    current = _this.fvalue.toStr(current);
                    _this.value = current;

                    $this.trigger('change:flexdatalist', [
                        $li.data('value'),
                        $li.data('text'),
                        options
                    ]).trigger('change');
                },
            /**
             * Remove value from input.
             */
                remove: function ($li) {
                    $li = this.findLi($li);
                    var values = _this.fvalue.get(),
                        index = $li.index();

                    // Remove from array
                    values.splice(index, 1);
                    values = _this.fvalue.toStr(values);

                    $this.val(values, true).trigger('change:flexdatalist', [
                        $li.data('value'),
                        $li.data('text'),
                        options
                    ]).trigger('change');

                    $li.remove();
                    // For allowDuplicateValues
                    options._values.splice(index, 1);
                    _this.fvalue.multiple.checkLimit();
                },
            /**
             * Remove all.
             */
                removeAll: function (values) {
                    $multiple.find('li:not(.input-container)').remove();
                    $this.val('', true);
                    options._values = [];
                },
            /**
             * Create new item and return it.
             */
                li: function (val, txt) {
                    var $inputContainer = $multiple.find('li.input-container');
                    return $('<li>')
                        .addClass('value' + (options.toggleSelected ? ' toggle' : ''))
                        .append('<span class="text">' + txt + '</span>')
                        .append('<span class="fdl-remove">&times;</span>')
                        .data({
                            'text': txt,
                            'value': val
                        })
                        .insertBefore($inputContainer);
                },
            /**
             * Create new item and return it.
             */
                checkLimit: function () {
                    var limit = options.limitOfValues;
                    if (limit > 0) {
                        var $input = $multiple.find('li.input-container'),
                            count = options._values.length;
                        (limit == count ? $input.hide() : $input.show());
                    }
                },
            /**
             * Get li item from value.
             */
                findLi: function ($li) {
                    if (typeof $li !== 'object') {
                        var val = $li;
                        $li = null;
                        $multiple.find('li:not(.input-container)').each(function () {
                            var $_li = $(this);
                            if ($_li.data('value') === val) {
                                $li = $_li;
                                return false;
                            }
                        });
                    }
                    return $li;
                }
            },
        /**
         * Get value that will be set on input field.
         */
            value: function (item) {
                var value = item;
                if (_this.isObject(item)) {
                    if (this.isJSON()) {
                        value = this.toStr(item);
                    } else if (_this.isDefined(item, options.valueProperty)) {
                        value = item[options.valueProperty];
                    } else if (_this.isDefined(item, options.searchIn[0])) {
                        value = item[options.searchIn[0]];
                    } else {
                        value = null;
                    }
                }
                return value;
            },
        /**
         * Get text that will be shown to user on the alias input field.
         */
            text: function (item) {
                var text = item;
                if (_this.isObject(item)) {
                    text = item[options.searchIn[0]];
                    if (_this.isDefined(item, options.textProperty)) {
                        text = item[options.textProperty];
                    } else {
                        text = this.placeholders.replace(item, options.textProperty, text);
                    }
                }
                return $('<div>').html(text).text();
            },
        /**
         * Text placeholders processing.
         */
            placeholders: {
                replace: function (item, pattern, fallback) {
                    if (_this.isObject(item) && typeof pattern === 'string') {
                        var properties = this.parse(pattern);
                        if (!_this.isEmpty(item) && properties) {
                            $.each(properties, function (string, property) {
                                if (_this.isDefined(item, property)) {
                                    pattern = pattern.replace(string, item[property]);
                                }
                            });
                            return pattern;
                        }
                    }
                    return fallback;
                },
                parse: function (pattern) {
                    var matches = pattern.match(/\{.+?\}/g);
                    if (matches) {
                        var properties = {};
                        matches.map(function (string) {
                            properties[string] = string.slice(1, -1);
                        });
                        return properties;
                    }
                    return false;
                }
            },
        /**
         * Clear input value(s).
         */
            clear: function (alias) {
                if (options.multiple) {
                    this.multiple.removeAll();
                }
                var current = $this.val();
                $this.val('', true);
                if (current !== '') {
                    $this.trigger('change:flexdatalist', [
                        null,
                        null,
                        options
                    ]).trigger('change');
                }
                if (alias) {
                    $alias.val('', true);
                }
                options._values = [];
            },
        /**
         * Value to object
         */
            toObj: function (val) {
                if (typeof val !== 'object') {
                    if (_this.isEmpty(val)) {
                        val = [];
                    } else if (this.isCSV()) {
                        val = val.toString().split(options.valuesSeparator);
                        val = $.map(val, function (v) {
                            return $.trim(v);
                        });
                    } else if (this.isJSON()) {
                        val = JSON.parse(val);
                    }
                }
                return val;
            },
        /**
         * Is value expected to be JSON (either object or string).
         */
            toStr: function (val) {
                if (typeof val !== 'string') {
                    if (_this.isEmpty(val)) {
                        val = '';
                    } else if (this.isCSV()) {
                        val = val.join(options.valuesSeparator);
                    } else if (this.isJSON()) {
                        val = JSON.stringify(val);
                    }
                }
                return $.trim(val);
            },
        /**
         * Is value expected to be JSON (either object or string).
         */
            isJSON: function () {
                var prop = options.valueProperty;
                return _this.isObject(prop) || prop === '*';
            },
        /**
         * Is value expected to be CSV?
         */
            isCSV: function () {
                return (!this.isJSON() && options.multiple);
            }
        }

    /**
     * Get data.
     */
        this.data = function (callback) {
            $this.trigger('before:flexdatalist.data');
            // Remote data
            this.url(function (remote) {
                // Static data
                _this._data(function (data) {
                    data = data.concat(remote);
                    // Datalist
                    _this.datalist(function (list) {
                        data = list.concat(data);
                        // Check for already set values
                        if (!options.allowDuplicateValues) {
                            var values = options._values;
                            for (var i = 0; i < data.length; i++) {
                                var item = data[i];
                                if (values && values.indexOf(_this.fvalue.text(item)) > -1) {
                                    delete data[i];
                                }
                            }
                        }
                        $this.trigger('after:flexdatalist.data', [data]);
                        callback(data);
                    });
                });
            });
        }

    /**
     * Get static data.
     */
        this._data = function (callback) {
            // Remote source
            if (typeof options.data === 'string') {
                var url = options.data,
                    cache = _this.cache.read(url);
                if (cache) {
                    callback(cache);
                    return;
                }
                _this.remote({
                    url: url,
                    success: function (data) {
                        var _data = _this.extractRemoteData(data);
                        options.data = _data;
                        callback(options.data);
                        _this.cache.write(url, options.data, options.cacheLifetime);
                    }
                });
            } else {
                callback(options.data);
            }
        }

    /**
     * Get datalist values.
     */
        this.datalist = function (callback) {
            var list = $this.attr('list'),
                datalist = [];
            if (!this.isEmpty(list)) {
                $('#' + list).find('option').each(function () {
                    var $option = $(this),
                        val = $option.val(),
                        label = $option.text();
                    datalist.push({
                        label: (label.length > 0 ? label : val),
                        value: val
                    });
                });
            }
            callback(datalist);
        }

    /**
     * Get remote data.
     */
        this.url = function (callback) {
            var keyword = $alias.val(),
                value = $this.val(),
                cacheKey = keyword;

            if (_this.isEmpty(options.url)) {
                return callback([]);
            }

            if (options.cache && options.cache !== 2) {
                cacheKey = keyword.substring(0, (options.minLength > 0 ? options.minLength : 1));
            }

            var _opts = {};
            if (options.requestType === 'post') {
                $.each(options, function (option, value) {
                    if (option.indexOf('_') == 0) {
                        return;
                    }
                    _opts[option] = value;
                });
                delete _opts.relatives;
            }

            this.remote({
                url: options.url,
                data: $.extend(
                    options.params,
                    {
                        keyword: keyword,
                        contain: options.searchContain,
                        selected: value,
                        options: _opts
                    }
                ),
                success: function (data) {
                    var _data = _this.extractRemoteData(data),
                        _keyword = $alias.val();
                    if (_keyword.length >= keyword.length) {
                        callback(_data);
                    }
                }
            });
        }

    /**
     * AJAX request.
     */
        this.remote = function (options) {
            // Prevent get data when pressing backspace button
            if ($this.hasClass('flexdatalist-loading')) {
                return;
            }
            $this.addClass('flexdatalist-loading');
            options = $.extend({
                type: options.requestType,
                dataType: 'json',
                complete: function () {
                    $this.removeClass('flexdatalist-loading');
                }
            }, options);
            $.ajax(options);
        }

    /**
     * Extract remote data from server response.
     */
        this.extractRemoteData = function (data) {
            var _data = data.results ? data.results : data;
            if (typeof _data === 'string' && _data.indexOf('[{') === 0) {
                _data = JSON.parse(_data);
            }
            if (_data.options) {
                options = $.extend({}, options, _data.options);
            }
            if (this.isObject(_data)) {
                return _data;
            }
            return [];
        }

    /**
     * Search for keywords in data and return matches.
     */
        this.search = function (callback, keywords) {
            this.data(function (data) {
                var matches = [];
                // If search disabled, return
                if (options.searchDisabled) {
                    return callback(data);
                }
                if (!_this.isDefined(keywords)) {
                    keywords = $alias.val();
                }
                $this.trigger('before:flexdatalist.search', [keywords, data]);
                keywords = _this.split(keywords);
                for (var index = 0; index < data.length; index++) {
                    var item = _this.matches(data[index], keywords);
                    if (item) {
                        matches.push(item);
                    }
                }
                $this.trigger('after:flexdatalist.search', [keywords, data, matches]);
                callback(matches);
            });
        }

    /**
     * Match against searchable properties.
     */
        this.matches = function (item, keywords) {
            var hasMatches = false,
                _item = $.extend({}, item),
                found = [],
                searchIn = options.searchIn;

            if (keywords.length > 0) {
                for (var index = 0; index < searchIn.length; index++) {
                    var searchProperty = searchIn[index];
                    if (!this.isDefined(item, searchProperty) || !item[searchProperty]) {
                        continue;
                    }
                    var text = item[searchProperty].toString(),
                        highlight = text,
                        strings = this.split(text);
                    for (var kwindex = 0; kwindex < keywords.length; kwindex++) {
                        var keyword = keywords[kwindex];
                        if (_this.find(keyword, strings)) {
                            found.push(keyword);
                            highlight = _this.highlight(keyword, highlight);
                        }
                    }
                    if (highlight !== text) {
                        _item[searchProperty + '_highlight'] = this.highlight(highlight);
                    }
                }
            }
            if (found.length === 0 || (options.searchByWord && found.length < (keywords.length - 1))) {
                return false;
            }
            return _item;
        }

    /**
     * Wrap found keyword with span.highlight.
     */
        this.highlight = function (keyword, text) {
            keyword = keyword.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
            if (text) {
                return text.replace(
                    new RegExp(keyword, (options.searchContain ? "ig" : "i")),
                    '|:|$&|::|'
                );
            }
            keyword = keyword.split('|:|').join('<span class="highlight">');
            return keyword.split('|::|').join('</span>');
        }

    /**
     * Search for keyword(s) in string.
     */
        this.find = function (keyword, strings) {
            for (var index = 0; index < strings.length; index++) {
                var text = strings[index];
                text = _this.normalizeString(text),
                keyword = _this.normalizeString(keyword);
                if (options.searchEqual) {
                    return text == keyword;
                }
                if ((options.searchContain ? (text.indexOf(keyword) >= 0) : (text.indexOf(keyword) === 0))) {
                    return true;
                }
            }
            return false;
        }

    /**
     * Split string by words if needed.
     */
        this.split = function (keywords) {
            if (typeof keywords === 'string') {
                keywords = [$.trim(keywords)];
            }
            if (options.searchByWord) {
                for (var index = 0; index < keywords.length; index++) {
                    var keyword = $.trim(keywords[index]);
                    if (keyword.indexOf(' ') > 0) {
                        var words = keyword.split(' ');
                        $.merge(keywords, words);
                    }
                }
            }
            return keywords;
        }

    /**
     * Normalize string to a consistent one to perform the search/match.
     */
        this.normalizeString = function (string) {
            if (typeof string === 'string') {
                var normalizeString = options.normalizeString;
                if (typeof normalizeString === 'function') {
                    string = normalizeString(string);
                }
                return string.toUpperCase();
            }
            return string;
        }

    /**
     * Handle results.
     */
        this.results = {
        /**
         * Save key = value data in local storage (if supported)
         *
         * @param string key Data key string
         */
            show: function (results) {
                var __this = this;
                this.remove(true);

                if (results.length === 0) {
                    this.empty(options.noResultsText);
                    return;
                }

                var $ul = this.container();
                if (!options.groupBy) {
                    this.items(results, $ul);
                } else {
                    results = this.group(results);
                    Object.keys(results).forEach(function (groupName, index) {
                        var items = results[groupName],
                            property = options.groupBy,
                            groupText = _this.results.highlight(items[0], property, groupName);

                        var $li = $('<li>')
                                .addClass('group')
                                .append($('<span>')
                                    .addClass('group-name')
                                    .html(groupText)
                                )
                                .append($('<span>')
                                    .addClass('group-item-count')
                                    .text(' ' + items.length)
                                )
                                .appendTo($ul);

                        __this.items(items, $ul);
                    });
                }

                var $li = $ul.find('li:not(.group)');
                $li.on('click', function (event) {
                    var item = $(this).data('item');
                    if (item) {
                        _this.fvalue.extract(item);
                        __this.remove();
                        $this.trigger('select:flexdatalist', [item, options]);
                    }
                }).hover(function () {
                    $li.removeClass('active');
                    $(this).addClass('active');
                }, function () {
                    $(this).removeClass('active');
                });

                if (options.focusFirstResult) {
                    $li.filter(':first').addClass('active');
                }
            },
        /**
         * Results container
         */
            empty: function (text) {
                if (_this.isEmpty(text)) {
                    return;
                }
                var $container = this.container(),
                    keyword = $alias.val();

                text = text.split('{keyword}').join(keyword);
                $('<li>')
                    .addClass('item no-results')
                    .append(text)
                    .appendTo($container)
            },

        /**
         * Items iteration.
         */
            items: function (items, $resultsContainer) {
                var max = options.maxShownResults;
                $this.trigger('show:flexdatalist.results', [items]);
                for (var index = 0; index < items.length; index++) {
                    if (max > 0 && max === index) {
                        break;
                    }
                    this.item(items[index]).appendTo($resultsContainer);
                }
                $this.trigger('shown:flexdatalist.results', [items]);
            },

        /**
         * Result item creation.
         */
            item: function (item) {
                var $li = $('<li>').data('item', item).addClass('item'),
                    visibleProperties = options.visibleProperties;

                for (var index = 0; index < visibleProperties.length; index++) {
                    var visibleProperty = visibleProperties[index];
                    if (options.groupBy && options.groupBy === visibleProperty || !_this.isDefined(item, visibleProperty)) {
                        continue;
                    }
                    var $item = {};
                    if (visibleProperty === 'thumb') {
                        // Thumbnail image
                        $item = $('<img>')
                            .addClass('item item-' + visibleProperty)
                            .attr('src', item[visibleProperty]);
                    } else {
                        var propertyText = _this.results.highlight(item, visibleProperty);
                        // Other text properties
                        $item = $('<span>')
                            .addClass('item item-' + visibleProperty)
                            .html(propertyText + ' ');
                    }
                    $item.appendTo($li);
                }
                return $li;
            },

        /**
         * Results container
         */
            container: function () {
                var $target = $this;
                if (options.multiple) {
                    $target = $multiple;
                }
                var $container = $('ul.flexdatalist-results');
                if ($container.length === 0) {
                    $container = $('<ul>')
                        .addClass('flexdatalist-results')
                        .appendTo('body')
                        .css({
                            'border-color': $target.css("border-left-color"),
                            'border-width': '1px',
                            'border-bottom-left-radius': $target.css("border-bottom-left-radius"),
                            'border-bottom-right-radius': $target.css("border-bottom-right-radius")
                        }).data('target', $alias);
                    _this.position($alias);
                }
                return $container;
            },
        /**
         * Results container
         */
            group: function (results) {
                var data = [],
                    groupProperty = options.groupBy;
                for (var index = 0; index < results.length; index++) {
                    var _data = results[index];
                    if (_this.isDefined(_data, groupProperty)) {
                        var propertyValue = _data[groupProperty];
                        if (!_this.isDefined(data, propertyValue)) {
                            data[propertyValue] = [];
                        }
                        data[propertyValue].push(_data);
                    }
                }
                return data;
            },

    /**
     * Check if highlighted property value exists,
     * if true, return it, if not, fallback to given string
     */
            highlight: function (item, property, fallback) {
                if (_this.isDefined(item, property + '_highlight')) {
                    return item[property + '_highlight'];
                }
                return (_this.isDefined(item, property) ? item[property] : fallback);
            },

        /**
         * Remove results
         */
            remove: function (itemsOnly) {
                var selector = 'ul.flexdatalist-results';
                if (itemsOnly) {
                    selector = 'ul.flexdatalist-results li';
                }
                $(selector).remove();
            }
        }

    /**
     * Position results below parent element.
     */
        this.position = function () {
            var $target = $('input:focus:eq(0)');
            if ($target.length === 0) {
                $target = $alias;
            }
            if (options.multiple) {
                $target = $target.parents('.flexdatalist-multiple:eq(0)');
            }
            // Set some required CSS properties
            $('ul.flexdatalist-results').css({
                'width': $target.outerWidth() + 'px',
                'top': (($target.offset().top + $target.outerHeight())) + 'px',
                'left': $target.offset().left + 'px'
            });
        }

    /**
     * Get key code from event.
     */
        this.keyNum = function (event) {
            return event.which || event.keyCode;
        }

    /**
     * Is variable empty.
     */
        this.isEmpty = function (value) {
            if (!_this.isDefined(value)) {
                return true;
            } else if (value === null) {
                return true;
            } else if (value === true) {
                return false;
            } else if (this.length(value) === 0) {
                return true;
            } else if ($.trim(value) === '') {
                return true;
            }
            return false;
        }

    /**
     * Is variable an object.
     */
        this.isObject = function (value) {
            return (value && typeof value === 'object');
        }

    /**
     * Get length of variable.
     */
        this.length = function (value) {
            if (this.isObject(value)) {
                return Object.keys(value).length;
            } else if (typeof value === 'number' || typeof value.length === 'number') {
                return value.toString().length;
            }
            return 0;
        }

    /**
     * Check if variable (and optionally property) is defined.
     */
        this.isDefined = function (variable, property) {
            var _variable = (typeof variable !== 'undefined');
            if (_variable && typeof property !== 'undefined') {
                return (typeof variable[property] !== 'undefined');
            }
            return _variable;
        }

    /**
    * Simple interface for sessionStorage.
    */
        this.cache = {
        /**
         * Save key = value data in local storage (if supported)
         *
         * @param string key Data key string
         * @param mixed value Value to be saved
         * @param int lifetime In Seconds
         * @return mixed
         */
            write: function (key, value, lifetime) {
                if (_this.cache.isSupported()) {
                    var object = {
                        value: value,
                        // Get current UNIX timestamp
                        timestamp: _this.unixtime(),
                        lifetime: (lifetime ? lifetime : false)
                    };
                    return sessionStorage.setItem(key, JSON.stringify(object));
                }
                return null;
            },
       /**
        * Read data associated with given key
        *
        * @param string key Data key string
        * @return mixed
        */
            read: function (key) {
                if (_this.cache.isSupported()) {
                    var data = sessionStorage.getItem(key);
                    if (data) {
                        var object = JSON.parse(data);
                        if (object.lifetime) {
                            var diff = (_this.unixtime() - object.timestamp);
                            if (object.lifetime > diff) {
                                return object.value;
                            }
                            _this.cache.delete(key);
                            return null;
                        }
                        return object.value;
                    }
                    return null;
                }
                return null;
            },
        /**
         * Remove data associated with given key
         *
         * @param string key Data key string
         * @return mixed
         */
            delete: function (key) {
                if (_this.cache.isSupported()) {
                    return sessionStorage.removeItem(key);
                }
                return null;
            },
       /**
        * Check if browser supports sessionStorage
        *
        * @return boolean True if supports, false otherwise
        */
            isSupported: function () {
                if (!options.cache) {
                    return false;
                }
                try {
                    return 'sessionStorage' in window && window['sessionStorage'] !== null;
                } catch (e) {
                    return false;
                }
            }
        }
    /**
     * Get unixtime stamp.
     *
     * @return boolean True if supports, false otherwise
     */
        this.unixtime = function (time) {
            var date = new Date();
            if (time) {
                date = new Date(time);
            }
            return Math.round(date.getTime() / 1000);
        }

    /**
     * To array.
     */
        this.csvToArray = function (value, _default) {
            if (value.length === 0) {
                return _default;
            }
            return typeof value === 'string' ? value.split(options.valuesSeparator) : value;
        }

    /**
     * Plugin warnings for debug.
     */
        this.debug = function (msg, data) {
            if (!options.debug) {
                return;
            }
            if (!data) {
                data = {};
            }
            msg = 'Flexdatalist: ' + msg;
            console.warn(msg);
            console.log($.extend({
                inputName: $this.attr('name'),
                options: options
            }, data));
            console.log('--- /flexdatalist ---');
        }

    // Normalize options ------------------------------
        options.searchIn = this.csvToArray(options.searchIn);
        options.relatives = options.relatives && $(options.relatives).length > 0 ? $(options.relatives) : null;
        options.textProperty = options.textProperty === null ? options.searchIn[0] : options.textProperty;
        options.visibleProperties = this.csvToArray(options.visibleProperties, options.searchIn);
        $this.data('flexdatalist', options);
    // ------------------------------------------------

    // Go!
        this.init();
    });
}

jQuery(function ($) {
    var $document = $(document);
    // Handle selection list keyboard shortcuts and events.
    if (!$document.data('flexdatalist')) {
        // Remove results on outside click
        $(document).mouseup(function (event) {
            var $container = $('.flexdatalist-results'),
                $target = $container.data('target');
            if ((!$target || !$target.is(':focus')) && !$container.is(event.target) && $container.has(event.target).length === 0) {
                $container.remove();
            }
        // Keyboard navigation
        }).keydown(function (event) {
            var $ul = $('.flexdatalist-results'),
                $li = $ul.find('li'),
                $active = $li.filter('.active'),
                index = $active.index(),
                length = $li.length,
                keynum = event.which || event.keyCode;

            if (length === 0) {
                return;
            }

            // on escape key, remove results
            if (keynum === 27) {
                return $ul.remove();
            }

            // Enter key
            if (keynum === 13) {
                event.preventDefault();
                $active.click();
            // Up/Down key
            } else if (keynum === 40 || keynum === 38) {
                event.preventDefault();
                // Down key
                if (keynum === 40) {
                    if (index < length && $active.nextAll('.item').first().length > 0) {
                        $active = $active.removeClass('active').nextAll('.item').first().addClass('active');
                    } else {
                        $active = $li.removeClass('active').filter('.item:first').addClass('active');
                    }
                // Up key
                } else if (keynum === 38) {
                    if (index > 0 && $active.prevAll('.item').first().length > 0) {
                        $active = $active.removeClass('active').prevAll('.item').first().addClass('active');
                    } else {
                        $active = $li.removeClass('active').filter('.item:last').addClass('active');
                    }
                }

                // Scroll to
                var position = ($active.prev().length === 0 ? $active : $active.prev()).position().top;
                $ul.animate({
                    scrollTop: position + $ul.scrollTop()
                }, 100);
            }
        }).data('flexdatalist', true);
    }

    jQuery('input.flexdatalist:not(.flexdatalist-set)').flexdatalist();
});

var _defaultValFunc = jQuery.fn.val;
jQuery.fn.val = function (value, _flexdatalist) {
    if (!_flexdatalist && $(this).hasClass('flexdatalist-set') && typeof value !== 'undefined') {
        $(this)[0].fvalue.set(value);
    }
    return _defaultValFunc.apply(this, arguments);
};