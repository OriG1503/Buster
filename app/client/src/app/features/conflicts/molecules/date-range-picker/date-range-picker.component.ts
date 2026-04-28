import {
  Component,
  input,
  output,
  OutputEmitterRef,
  signal,
  computed,
  inject,
  ElementRef,
  HostListener,
  ViewEncapsulation,
  InputSignal,
  WritableSignal,
  Signal,
} from '@angular/core';
import { DateRangeMode } from '../../types/date-range-mode.type';
import { DateFilterOption } from '../../types/date-filter-option.type';
import { TimeUnit, TimeUnitOption } from '../../types/time-unit.type';
import { VerbalChange } from '../../types/verbal-change.type';
import {
  DATE_RANGE_MODE_LABEL_MAP,
  DATE_FILTER_OPTION_LABEL_MAP,
  TIME_UNIT_LABEL_MAP,
  DATE_RANGE_LABEL_MAP,
} from '../../mapping/date-range.label-map';
import { DEFAULT_VERBAL_AMOUNT, DEFAULT_VERBAL_UNIT } from '../../consts/date-range.consts';
import { CalendarViewComponent } from '../calendar-view/calendar-view.component';
import { VerbalViewComponent } from '../verbal-view/verbal-view.component';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CalendarViewComponent, VerbalViewComponent],
  templateUrl: './date-range-picker.component.html',
  styleUrl: './date-range-picker.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class DateRangePickerComponent {
  public $dateRange: InputSignal<Date[] | null> = input<Date[] | null>(null, { alias: 'dateRange' });
  public dateRangeChange: OutputEmitterRef<Date[] | null> = output<Date[] | null>();

  public $isPopupOpen: WritableSignal<boolean> = signal<boolean>(false);
  public $selectedMode: WritableSignal<DateRangeMode> = signal<DateRangeMode>('calendar');
  public $selectedOption: WritableSignal<DateFilterOption> = signal<DateFilterOption>('option1');
  private _$lastSelectionMode: WritableSignal<DateRangeMode> = signal<DateRangeMode>('calendar');
  private _$verbalAmount: WritableSignal<number> = signal<number>(DEFAULT_VERBAL_AMOUNT);
  private _$verbalUnit: WritableSignal<TimeUnit> = signal<TimeUnit>(DEFAULT_VERBAL_UNIT);

  public readonly timeUnitOptions: TimeUnitOption[] = [
    { value: 'days', label: TIME_UNIT_LABEL_MAP.days },
    { value: 'weeks', label: TIME_UNIT_LABEL_MAP.weeks },
    { value: 'months', label: TIME_UNIT_LABEL_MAP.months },
    { value: 'years', label: TIME_UNIT_LABEL_MAP.years },
  ];

  public readonly modeLabels: typeof DATE_RANGE_MODE_LABEL_MAP = DATE_RANGE_MODE_LABEL_MAP;
  public readonly optionLabels: typeof DATE_FILTER_OPTION_LABEL_MAP = DATE_FILTER_OPTION_LABEL_MAP;
  public readonly translations: typeof DATE_RANGE_LABEL_MAP = DATE_RANGE_LABEL_MAP;

  private _formatDatePipe: FormatDatePipe = inject(FormatDatePipe);
  private _elementRef: ElementRef = inject(ElementRef);

  public $buttonLabel: Signal<string> = computed<string>(() => {
    const isOpen: boolean = this.$isPopupOpen();
    const dateRange: Date[] | null = this.$dateRange();
    const hasDates: boolean = !!dateRange && dateRange.length === 2 && !!dateRange[0] && !!dateRange[1];

    if (isOpen || !hasDates) {
      return this.translations.defaultLabel;
    }

    if (this._$lastSelectionMode() === 'verbal') {
      const amount: number = this._$verbalAmount();
      const unit: TimeUnit = this._$verbalUnit();
      const unitLabel: string =
        this.timeUnitOptions.find((option: TimeUnitOption) => option.value === unit)?.label ?? '';
      return `${amount} ${unitLabel}`;
    }

    return `${this._formatDatePipe.transform(dateRange![0]!)} - ${this._formatDatePipe.transform(dateRange![1]!)}`;
  });

  public $isActive: Signal<boolean> = computed<boolean>(() => {
    const dateRange: Date[] | null = this.$dateRange();
    return !this.$isPopupOpen() && !!dateRange && dateRange.length === 2 && !!dateRange[0] && !!dateRange[1];
  });

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.isConnected) {
      return;
    }
    if (!this._elementRef.nativeElement.contains(target)) {
      this.$isPopupOpen.set(false);
    }
  }

  public togglePopup(): void {
    this.$isPopupOpen.update((isOpen: boolean) => !isOpen);
  }

  public selectMode(mode: DateRangeMode): void {
    this.$selectedMode.set(mode);
    if (mode === 'verbal') {
      this._emitVerbalRange(this._$verbalAmount(), this._$verbalUnit());
    }
  }

  public selectOption(option: DateFilterOption): void {
    this.$selectedOption.set(option);
  }

  public onCalendarSelect(dates: Date[]): void {
    this._$lastSelectionMode.set('calendar');
    this.dateRangeChange.emit(dates);
  }

  public onVerbalChange(change: VerbalChange): void {
    this._$verbalAmount.set(change.amount);
    this._$verbalUnit.set(change.unit);
    this._emitVerbalRange(change.amount, change.unit);
  }

  private _emitVerbalRange(amount: number, unit: TimeUnit): void {
    const today: Date = new Date();
    const startDate: Date = new Date();

    switch (unit) {
      case 'days':
        startDate.setDate(today.getDate() - amount);
        break;
      case 'weeks':
        startDate.setDate(today.getDate() - amount * 7);
        break;
      case 'months':
        startDate.setMonth(today.getMonth() - amount);
        break;
      case 'years':
        startDate.setFullYear(today.getFullYear() - amount);
        break;
    }

    this._$lastSelectionMode.set('verbal');
    this.dateRangeChange.emit([startDate, today]);
  }
}
