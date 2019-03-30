const wheelEvent = 'wheel';
const pluginName = 'tinyscrollbar';
const touchLabel = Symbol(pluginName + 'Touch');

export interface Options {
  axis: 'y' | 'x';
  wheel: boolean;
  wheelSpeed: number;
  wheelLock: boolean;
  touchLock: boolean | number;
  trackSize: boolean | number;
  thumbSize: boolean | number;
  thumbSizeMin: number;
}

export interface CustomWheelEvent extends WheelEvent {
  wheelDelta: number;
}

export interface CustomDragEvent extends WheelEvent {
  [touchLabel]: number;
}

export interface CustomTouch extends Touch, CustomDragEvent {
  [touchLabel]: number;
}

const defaults: Options = {
  axis: 'y',
  wheel: true,
  wheelSpeed: 40,
  wheelLock: true,
  touchLock: true,
  trackSize: false,
  thumbSize: false,
  thumbSizeMin: 20,
};

export default class Tinyscrollbar {
  private options: Options;

  private $body: HTMLBodyElement = document.querySelectorAll('body')[0];
  private $container: HTMLElement;
  private $viewport: HTMLElement;
  private $overview: HTMLElement;
  private $scrollbar: HTMLElement;
  private $track: HTMLElement;
  private $thumb: HTMLElement;

  private mousePosition = 0;
  private contentPosition = 0;
  private viewportSize = 0;
  private contentSize = 0;
  private contentRatio = 0;
  private trackSize = 0;
  private trackRatio = 0;
  private thumbSize = 0;
  private thumbPosition = 0;
  private hasContentToScroll = false;

  private moveEvent: Event;

  private isHorizontal: boolean;
  private hasTouchEvents: boolean;
  private sizeLabel: string;
  private posiLabel: string;

  constructor($container: HTMLElement, options?: Options) {
    this.options = { ...defaults, ...options };

    this.$container = $container;
    this.$viewport = $container.querySelectorAll('.viewport')[0] as HTMLElement;
    this.$overview = $container.querySelectorAll('.overview')[0] as HTMLElement;
    this.$scrollbar = $container.querySelectorAll('.scrollbar')[0] as HTMLElement;
    this.$track = this.$scrollbar.querySelectorAll('.track')[0] as HTMLElement;
    this.$thumb = this.$scrollbar.querySelectorAll('.thumb')[0] as HTMLElement;

    this.hasTouchEvents = ('ontouchstart' in document.documentElement);
    this.isHorizontal = this.options.axis === 'x';
    this.sizeLabel = this.isHorizontal ? 'width' : 'height';
    this.posiLabel = this.isHorizontal ? 'left' : 'top';

    this.moveEvent = document.createEvent('HTMLEvents');
    this.moveEvent.initEvent('move', true, true);

    this.update();
    this.setEvents();
  }

  public update(scrollTo: string | number = 0) {
    const sizeLabelCap = this.sizeLabel.charAt(0).toUpperCase() + this.sizeLabel.slice(1).toLowerCase();
    const scrcls = this.$scrollbar.className;
    const trackSize = Number(this.options.trackSize);
    const thumbSizeMax = Math.max(this.options.thumbSizeMin, (trackSize || (this.trackSize * this.contentRatio)));

    this.viewportSize = this.$viewport['offset' + sizeLabelCap as keyof HTMLElement] as number;
    this.contentSize = this.$overview['scroll' + sizeLabelCap as keyof HTMLElement] as number;
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

  private setStyleAttribute(element: HTMLElement, attrs: { [key: string]: string }): void {
    if (attrs !== undefined) {
      Object.keys(attrs).forEach((key: string) => {
        element.style.setProperty(key, attrs[key]);
      });
    }
  }

  private setCss(): void {
    this.setStyleAttribute(this.$thumb, { [this.posiLabel]: this.thumbPosition + 'px' });
    this.setStyleAttribute(this.$overview, { [this.posiLabel]: this.contentPosition + 'px' });
    this.setStyleAttribute(this.$scrollbar, { [this.sizeLabel]: this.trackSize + 'px' });
    this.setStyleAttribute(this.$track, { [this.sizeLabel]: this.trackSize + 'px' });
    this.setStyleAttribute(this.$thumb, { [this.sizeLabel]: this.thumbSize + 'px' });
  }

  private setEvents() {

    if (this.hasTouchEvents) {
      this.$viewport.ontouchstart = (event) => {
        if (1 === event.touches.length) {
          const touch = event.touches[0] as CustomTouch;
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

    this.$container.addEventListener(wheelEvent, ((ev: WheelEvent) => {
      this.wheel(ev as CustomWheelEvent);
    }), false);

    this.update('relative');

  }

  private isAtBegin(): boolean {
    return this.contentPosition > 0;
  }

  private isAtEnd(): boolean {
    return this.contentPosition <= (this.contentSize - this.viewportSize) - 5;
  }

  private start(event: MouseEvent, gotoMouse: boolean) {
    if (!this.hasContentToScroll) { return; }

    const posiLabel = this.posiLabel as keyof ClientRect;

    this.mousePosition = gotoMouse
      ? this.$thumb.getBoundingClientRect()[posiLabel]
      : (this.isHorizontal ? event.clientX : event.clientY);

    this.$body.className += ' noSelect';

    if (this.hasTouchEvents) {
      document.ontouchmove = (ev: TouchEvent) => {

        if (this.options.touchLock || this.isAtBegin() && this.isAtEnd()) {
          ev.preventDefault();
        }

        const touch = ev.touches[0] as CustomTouch;
        touch[touchLabel] = 1;

        this.drag(touch);

        document.ontouchend = this.end.bind(this);
      };
    }

    document.onmouseup = this.$thumb.onmouseup = this.end.bind(this);
    document.onmousemove = (ev) => {
      this.drag(ev as CustomDragEvent);
    };
    this.drag(event as CustomDragEvent);
  }

  private wheel(event: CustomWheelEvent) {
    if (!this.hasContentToScroll) { return; }

    const evntObj = event || window.event as CustomWheelEvent;
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

  private drag(event: CustomDragEvent) {
    if (!this.hasContentToScroll) { return; }

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

  private end() {
    const posiLabel = this.posiLabel as keyof CSSStyleDeclaration;

    this.thumbPosition = parseInt(this.$thumb.style[posiLabel], 10) || 0;

    this.$body.className = this.$body.className.replace(' noSelect', '');
    this.$thumb.onmouseup = null;
    this.$track.onmouseup = null;

    document.ontouchmove = document.ontouchend = null;
    document.onmousemove = document.onmouseup = null;
  }
}


