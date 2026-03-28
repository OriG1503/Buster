import { animate, style, transition, trigger } from '@angular/animations';

export const SLIDE_DOWN_ANIMATION = trigger('slideDown', [
  transition(':enter', [
    style({ height: '0', overflow: 'hidden', opacity: 0 }),
    animate('220ms ease-out', style({ height: '*', overflow: 'hidden', opacity: 1 })),
  ]),
  transition(':leave', [
    style({ height: '*', overflow: 'hidden', opacity: 1 }),
    animate('180ms ease-in', style({ height: '0', overflow: 'hidden', opacity: 0 })),
  ]),
]);

export const FADE_SLIDE_IN_ANIMATION = trigger('fadeSlideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-6px)' }),
    animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);
