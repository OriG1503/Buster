import { DateRangeMode } from '../types/date-range-mode.type';
import { TimeUnit } from '../types/time-unit.type';

export const DATE_RANGE_MODE_LABEL_MAP: Record<DateRangeMode, string> = {
  calendar: 'תאריכים',
  verbal: 'מילולי',
};

export const TIME_UNIT_LABEL_MAP: Record<TimeUnit, string> = {
  days: 'ימים',
  weeks: 'שבועות',
  months: 'חודשים',
  years: 'שנים',
};

export const DATE_RANGE_LABEL_MAP = {
  defaultLabel: 'בחירת תאריכים',
  apply: 'החל',
  fromPlaceholder: '- - -',
  toPlaceholder: '- - -',
  lastLabel: 'אחרונים',
};
