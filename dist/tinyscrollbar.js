"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var wheelEvent = 'wheel';
var pluginName = 'tinyscrollbar';
var touchLabel = Symbol(pluginName + 'Touch');
var defaults = {
    axis: 'y',
    wheel: true,
    wheelSpeed: 40,
    wheelLock: true,
    touchLock: true,
    trackSize: false,
    thumbSize: false,
    thumbSizeMin: 20,
};
var Tinyscrollbar = /** @class */ (function () {
    function Tinyscrollbar($container, options) {
        this.$body = document.querySelectorAll('body')[0];
        this.mousePosition = 0;
        this.contentPosition = 0;
        this.viewportSize = 0;
        this.contentSize = 0;
        this.contentRatio = 0;
        this.trackSize = 0;
        this.trackRatio = 0;
        this.thumbSize = 0;
        this.thumbPosition = 0;
        this.hasContentToScroll = false;
        this.options = __assign({}, defaults, options);
        this.$container = $container;
        this.$viewport = $container.querySelectorAll('.viewport')[0];
        this.$overview = $container.querySelectorAll('.overview')[0];
        this.$scrollbar = $container.querySelectorAll('.scrollbar')[0];
        this.$track = this.$scrollbar.querySelectorAll('.track')[0];
        this.$thumb = this.$scrollbar.querySelectorAll('.thumb')[0];
        this.hasTouchEvents = ('ontouchstart' in document.documentElement);
        this.isHorizontal = this.options.axis === 'x';
        this.sizeLabel = this.isHorizontal ? 'width' : 'height';
        this.posiLabel = this.isHorizontal ? 'left' : 'top';
        this.moveEvent = document.createEvent('HTMLEvents');
        this.moveEvent.initEvent('move', true, true);
        this.update();
        this.setEvents();
    }
    Tinyscrollbar.prototype.update = function (scrollTo) {
        if (scrollTo === void 0) { scrollTo = 0; }
        var sizeLabelCap = this.sizeLabel.charAt(0).toUpperCase() + this.sizeLabel.slice(1).toLowerCase();
        var scrcls = this.$scrollbar.className;
        var trackSize = Number(this.options.trackSize);
        var thumbSizeMax = Math.max(this.options.thumbSizeMin, (trackSize || (this.trackSize * this.contentRatio)));
        this.viewportSize = this.$viewport['offset' + sizeLabelCap];
        this.contentSize = this.$overview['scroll' + sizeLabelCap];
        this.contentRatio = this.viewportSize / this.contentSize;
        this.trackSize = trackSize || this.viewportSize;
        this.thumbSize = Math.min(this.trackSize, thumbSizeMax);
        this.trackRatio = (this.contentSize - this.viewportSize) / (this.trackSize - this.thumbSize);
        this.hasContentToScroll = this.contentRatio < 1;
        this.$scrollbar.className = this.hasContentToScroll
            ? scrcls.replace(/disable/g, '')
            : scrcls.replace(/ disable/g, '') + ' disable';
        switch (scrollTo) {
            case 'bottom':
                this.contentPosition = Math.max(this.contentSize - this.viewportSize, 0);
                break;
            case 'relative':
                var max = Math.max(this.contentSize - this.viewportSize, 0);
                this.contentPosition = Math.min(max, Math.max(0, this.contentPosition));
                break;
            default:
                this.contentPosition = parseInt(scrollTo.toString(), 10) || 0;
        }
        this.thumbPosition = this.contentPosition / this.trackRatio;
        this.setCss();
    };
    Tinyscrollbar.prototype.setStyleAttribute = function (element, attrs) {
        if (attrs !== undefined) {
            Object.keys(attrs).forEach(function (key) {
                element.style.setProperty(key, attrs[key]);
            });
        }
    };
    Tinyscrollbar.prototype.setCss = function () {
        var _a, _b, _c, _d, _e;
        this.setStyleAttribute(this.$thumb, (_a = {}, _a[this.posiLabel] = this.thumbPosition + 'px', _a));
        this.setStyleAttribute(this.$overview, (_b = {}, _b[this.posiLabel] = this.contentPosition + 'px', _b));
        this.setStyleAttribute(this.$scrollbar, (_c = {}, _c[this.sizeLabel] = this.trackSize + 'px', _c));
        this.setStyleAttribute(this.$track, (_d = {}, _d[this.sizeLabel] = this.trackSize + 'px', _d));
        this.setStyleAttribute(this.$thumb, (_e = {}, _e[this.sizeLabel] = this.thumbSize + 'px', _e));
    };
    Tinyscrollbar.prototype.setEvents = function () {
        var _this = this;
        if (this.hasTouchEvents) {
            this.$viewport.ontouchstart = function (event) {
                if (1 === event.touches.length) {
                    var touch = event.touches[0];
                    _this.start(touch, false);
                    event.stopPropagation();
                }
            };
        }
        this.$thumb.onmousedown = function (event) {
            event.stopPropagation();
            _this.start(event, false);
        };
        this.$track.onmousedown = function (event) {
            _this.start(event, true);
        };
        window.addEventListener('resize', function () {
            _this.update('relative');
        }, true);
        this.$container.addEventListener(wheelEvent, (function (ev) {
            _this.wheel(ev);
        }), false);
        this.update('relative');
    };
    Tinyscrollbar.prototype.isAtBegin = function () {
        return this.contentPosition > 0;
    };
    Tinyscrollbar.prototype.isAtEnd = function () {
        return this.contentPosition <= (this.contentSize - this.viewportSize) - 5;
    };
    Tinyscrollbar.prototype.start = function (event, gotoMouse) {
        var _this = this;
        if (!this.hasContentToScroll) {
            return;
        }
        var posiLabel = this.posiLabel;
        this.mousePosition = gotoMouse
            ? this.$thumb.getBoundingClientRect()[posiLabel]
            : (this.isHorizontal ? event.clientX : event.clientY);
        this.$body.className += ' noSelect';
        if (this.hasTouchEvents) {
            document.ontouchmove = function (ev) {
                if (_this.options.touchLock || _this.isAtBegin() && _this.isAtEnd()) {
                    ev.preventDefault();
                }
                var touch = ev.touches[0];
                touch[touchLabel] = 1;
                _this.drag(touch);
                document.ontouchend = _this.end.bind(_this);
            };
        }
        document.onmouseup = this.$thumb.onmouseup = this.end.bind(this);
        document.onmousemove = function (ev) {
            _this.drag(ev);
        };
        this.drag(event);
    };
    Tinyscrollbar.prototype.wheel = function (event) {
        var _a, _b;
        if (!this.hasContentToScroll) {
            return;
        }
        var evntObj = event || window.event;
        var wheelSpeedDelta = -(evntObj.deltaY || evntObj.detail || (-1 / 3 * evntObj.wheelDelta)) / 40;
        this.contentPosition -= wheelSpeedDelta * this.options.wheelSpeed;
        this.contentPosition = Math.min((this.contentSize - this.viewportSize), Math.max(0, this.contentPosition));
        this.thumbPosition = this.contentPosition / this.trackRatio;
        this.$container.dispatchEvent(this.moveEvent);
        this.setStyleAttribute(this.$thumb, (_a = {}, _a[this.posiLabel] = this.thumbPosition + 'px', _a));
        this.setStyleAttribute(this.$overview, (_b = {}, _b[this.posiLabel] = -this.contentPosition + 'px', _b));
        if (this.options.wheelLock || this.isAtBegin() && this.isAtEnd()) {
            evntObj.preventDefault();
        }
        event.stopPropagation();
    };
    Tinyscrollbar.prototype.drag = function (event) {
        var _a, _b;
        if (!this.hasContentToScroll) {
            return;
        }
        var mousePositionNew = this.isHorizontal ? event.clientX : event.clientY;
        var thumbPositionDelta = event[touchLabel]
            ? (this.mousePosition - mousePositionNew)
            : (mousePositionNew - this.mousePosition);
        var max = Math.max(0, this.thumbPosition + thumbPositionDelta);
        var thumbPositionNew = Math.min((this.trackSize - this.thumbSize), max);
        this.contentPosition = thumbPositionNew * this.trackRatio;
        this.$container.dispatchEvent(this.moveEvent);
        this.setStyleAttribute(this.$thumb, (_a = {}, _a[this.posiLabel] = thumbPositionNew + 'px', _a));
        this.setStyleAttribute(this.$overview, (_b = {}, _b[this.posiLabel] = -this.contentPosition + 'px', _b));
    };
    Tinyscrollbar.prototype.end = function () {
        var posiLabel = this.posiLabel;
        this.thumbPosition = parseInt(this.$thumb.style[posiLabel], 10) || 0;
        this.$body.className = this.$body.className.replace(' noSelect', '');
        this.$thumb.onmouseup = null;
        this.$track.onmouseup = null;
        document.ontouchmove = document.ontouchend = null;
        document.onmousemove = document.onmouseup = null;
    };
    return Tinyscrollbar;
}());
exports.default = Tinyscrollbar;
