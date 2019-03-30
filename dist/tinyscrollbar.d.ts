declare const touchLabel: unique symbol;
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
export default class Tinyscrollbar {
    private options;
    private $body;
    private $container;
    private $viewport;
    private $overview;
    private $scrollbar;
    private $track;
    private $thumb;
    private mousePosition;
    private contentPosition;
    private viewportSize;
    private contentSize;
    private contentRatio;
    private trackSize;
    private trackRatio;
    private thumbSize;
    private thumbPosition;
    private hasContentToScroll;
    private moveEvent;
    private isHorizontal;
    private hasTouchEvents;
    private sizeLabel;
    private posiLabel;
    constructor($container: HTMLElement, options?: Options);
    update(scrollTo?: string | number): void;
    private setStyleAttribute;
    private setCss;
    private setEvents;
    private isAtBegin;
    private isAtEnd;
    private start;
    private wheel;
    private drag;
    private end;
}
export {};
