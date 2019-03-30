"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wheelEvent = 'wheel';
const pluginName = 'tinyscrollbar';
const touchLabel = Symbol(pluginName + 'Touch');
const defaults = {
    axis: 'y',
    wheel: true,
    wheelSpeed: 40,
    wheelLock: true,
    touchLock: true,
    trackSize: false,
    thumbSize: false,
    thumbSizeMin: 20,
};
class Tinyscrollbar {
    constructor($container, options) {
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
        this.options = Object.assign({}, defaults, options);
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
    update(scrollTo = 0) {
        const sizeLabelCap = this.sizeLabel.charAt(0).toUpperCase() + this.sizeLabel.slice(1).toLowerCase();
        const scrcls = this.$scrollbar.className;
        const trackSize = Number(this.options.trackSize);
        const thumbSizeMax = Math.max(this.options.thumbSizeMin, (trackSize || (this.trackSize * this.contentRatio)));
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
                const max = Math.max(this.contentSize - this.viewportSize, 0);
                this.contentPosition = Math.min(max, Math.max(0, this.contentPosition));
                break;
            default:
                this.contentPosition = parseInt(scrollTo.toString(), 10) || 0;
        }
        this.thumbPosition = this.contentPosition / this.trackRatio;
        this.setCss();
    }
    setStyleAttribute(element, attrs) {
        if (attrs !== undefined) {
            Object.keys(attrs).forEach((key) => {
                element.style.setProperty(key, attrs[key]);
            });
        }
    }
    setCss() {
        this.setStyleAttribute(this.$thumb, { [this.posiLabel]: this.thumbPosition + 'px' });
        this.setStyleAttribute(this.$overview, { [this.posiLabel]: this.contentPosition + 'px' });
        this.setStyleAttribute(this.$scrollbar, { [this.sizeLabel]: this.trackSize + 'px' });
        this.setStyleAttribute(this.$track, { [this.sizeLabel]: this.trackSize + 'px' });
        this.setStyleAttribute(this.$thumb, { [this.sizeLabel]: this.thumbSize + 'px' });
    }
    setEvents() {
        if (this.hasTouchEvents) {
            this.$viewport.ontouchstart = (event) => {
                if (1 === event.touches.length) {
                    const touch = event.touches[0];
                    this.start(touch, false);
                    event.stopPropagation();
                }
            };
        }
        this.$thumb.onmousedown = (event) => {
            event.stopPropagation();
            this.start(event, false);
        };
        this.$track.onmousedown = (event) => {
            this.start(event, true);
        };
        window.addEventListener('resize', () => {
            this.update('relative');
        }, true);
        this.$container.addEventListener(wheelEvent, ((ev) => {
            this.wheel(ev);
        }), false);
        this.update('relative');
    }
    isAtBegin() {
        return this.contentPosition > 0;
    }
    isAtEnd() {
        return this.contentPosition <= (this.contentSize - this.viewportSize) - 5;
    }
    start(event, gotoMouse) {
        if (!this.hasContentToScroll) {
            return;
        }
        const posiLabel = this.posiLabel;
        this.mousePosition = gotoMouse
            ? this.$thumb.getBoundingClientRect()[posiLabel]
            : (this.isHorizontal ? event.clientX : event.clientY);
        this.$body.className += ' noSelect';
        if (this.hasTouchEvents) {
            document.ontouchmove = (ev) => {
                if (this.options.touchLock || this.isAtBegin() && this.isAtEnd()) {
                    ev.preventDefault();
                }
                const touch = ev.touches[0];
                touch[touchLabel] = 1;
                this.drag(touch);
                document.ontouchend = this.end.bind(this);
            };
        }
        document.onmouseup = this.$thumb.onmouseup = this.end.bind(this);
        document.onmousemove = (ev) => {
            this.drag(ev);
        };
        this.drag(event);
    }
    wheel(event) {
        if (!this.hasContentToScroll) {
            return;
        }
        const evntObj = event || window.event;
        const wheelSpeedDelta = -(evntObj.deltaY || evntObj.detail || (-1 / 3 * evntObj.wheelDelta)) / 40;
        this.contentPosition -= wheelSpeedDelta * this.options.wheelSpeed;
        this.contentPosition = Math.min((this.contentSize - this.viewportSize), Math.max(0, this.contentPosition));
        this.thumbPosition = this.contentPosition / this.trackRatio;
        this.$container.dispatchEvent(this.moveEvent);
        this.setStyleAttribute(this.$thumb, { [this.posiLabel]: this.thumbPosition + 'px' });
        this.setStyleAttribute(this.$overview, { [this.posiLabel]: -this.contentPosition + 'px' });
        if (this.options.wheelLock || this.isAtBegin() && this.isAtEnd()) {
            evntObj.preventDefault();
        }
        event.stopPropagation();
    }
    drag(event) {
        if (!this.hasContentToScroll) {
            return;
        }
        const mousePositionNew = this.isHorizontal ? event.clientX : event.clientY;
        const thumbPositionDelta = event[touchLabel]
            ? (this.mousePosition - mousePositionNew)
            : (mousePositionNew - this.mousePosition);
        const max = Math.max(0, this.thumbPosition + thumbPositionDelta);
        const thumbPositionNew = Math.min((this.trackSize - this.thumbSize), max);
        this.contentPosition = thumbPositionNew * this.trackRatio;
        this.$container.dispatchEvent(this.moveEvent);
        this.setStyleAttribute(this.$thumb, { [this.posiLabel]: thumbPositionNew + 'px' });
        this.setStyleAttribute(this.$overview, { [this.posiLabel]: -this.contentPosition + 'px' });
    }
    end() {
        const posiLabel = this.posiLabel;
        this.thumbPosition = parseInt(this.$thumb.style[posiLabel], 10) || 0;
        this.$body.className = this.$body.className.replace(' noSelect', '');
        this.$thumb.onmouseup = null;
        this.$track.onmouseup = null;
        document.ontouchmove = document.ontouchend = null;
        document.onmousemove = document.onmouseup = null;
    }
}
exports.default = Tinyscrollbar;
