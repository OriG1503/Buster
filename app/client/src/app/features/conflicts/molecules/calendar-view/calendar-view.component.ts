import {
  Component,
  input,
  output,
  OutputEmitterRef,
  computed,
  inject,
  ViewEncapsulation,
  InputSignal,
  Signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { DATE_RANGE_LABEL_MAP } from '../../mapping/date-range.label-map';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [FormsModule, DatePicker],
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CalendarViewComponent {
  private _formatDatePipe: FormatDatePipe = inject(FormatDatePipe);

  public $dateRange: InputSignal<Date[] | null> = input<Date[] | null>(null, { alias: 'dateRange' });
  public dateSelect: OutputEmitterRef<Date[]> = output<Date[]>();

  public readonly translations: typeof DATE_RANGE_LABEL_MAP = DATE_RANGE_LABEL_MAP;

  public $fromDate: Signal<string | null> = computed<string | null>(() => {
    const dateRange: Date[] | null = this.$dateRange();
    if (dateRange && dateRange.length >= 1 && dateRange[0]) {
      return this._formatDatePipe.transform(dateRange[0]);
    }
    return null;
  });

  public $toDate: Signal<string | null> = computed<string | null>(() => {
    const dateRange: Date[] | null = this.$dateRange();
    if (dateRange && dateRange.length >= 2 && dateRange[1]) {
      return this._formatDatePipe.transform(dateRange[1]);
    }
    return null;
  });

  public onCalendarSelect(dates: Date[]): void {
    this.dateSelect.emit(dates);
  }
}
