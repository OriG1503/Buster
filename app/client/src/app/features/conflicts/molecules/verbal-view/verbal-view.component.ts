import { Component, output, OutputEmitterRef, signal, ViewEncapsulation, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { TimeUnit, TimeUnitOption } from '../../types/time-unit.type';
import { VerbalChange } from '../../types/verbal-change.type';
import {
  DEFAULT_VERBAL_AMOUNT,
  DEFAULT_VERBAL_UNIT,
  MAX_VERBAL_DATE_AMOUNT,
  MIN_VERBAL_DATE_AMOUNT,
} from '../../consts/date-range.consts';
import { TIME_UNIT_LABEL_MAP, DATE_RANGE_LABEL_MAP } from '../../mapping/date-range.label-map';

@Component({
  selector: 'app-verbal-view',
  standalone: true,
  imports: [FormsModule, Select],
  templateUrl: './verbal-view.component.html',
  styleUrl: './verbal-view.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class VerbalViewComponent {
  public verbalChange: OutputEmitterRef<VerbalChange> = output<VerbalChange>();

  public $verbalAmount: WritableSignal<number> = signal<number>(DEFAULT_VERBAL_AMOUNT);
  public $verbalUnit: WritableSignal<TimeUnit> = signal<TimeUnit>(DEFAULT_VERBAL_UNIT);

  public readonly timeUnitOptions: TimeUnitOption[] = [
    { value: 'days', label: TIME_UNIT_LABEL_MAP.days },
    { value: 'weeks', label: TIME_UNIT_LABEL_MAP.weeks },
    { value: 'months', label: TIME_UNIT_LABEL_MAP.months },
    { value: 'years', label: TIME_UNIT_LABEL_MAP.years },
  ];

  public readonly translations = DATE_RANGE_LABEL_MAP;
  public readonly maxAmount: number | null = MAX_VERBAL_DATE_AMOUNT;

  public decrementAmount(): void {
    const current: number = this.$verbalAmount();
    if (current > MIN_VERBAL_DATE_AMOUNT) {
      this.$verbalAmount.set(current - 1);
      this._emitChange();
    }
  }

  public incrementAmount(): void {
    const current = this.$verbalAmount();
    if (this.maxAmount === null || current < this.maxAmount) {
      this.$verbalAmount.set(current + 1);
      this._emitChange();
    }
  }

  public onAmountInput(event: Event): void {
    const input: HTMLInputElement = event.target as HTMLInputElement;
    const parsed: number = parseInt(input.value, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(
        MIN_VERBAL_DATE_AMOUNT,
        this.maxAmount !== null ? Math.min(this.maxAmount, parsed) : parsed,
      );
      this.$verbalAmount.set(clamped);
      this._emitChange();
    }
  }

  public onUnitChange(unit: TimeUnit): void {
    this.$verbalUnit.set(unit);
    this._emitChange();
  }

  private _emitChange(): void {
    this.verbalChange.emit({
      amount: this.$verbalAmount(),
      unit: this.$verbalUnit(),
    });
  }
}
