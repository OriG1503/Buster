import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Injectable({ providedIn: 'root' })
@Pipe({
  name: 'formatDate',
  standalone: true,
})
export class FormatDatePipe implements PipeTransform {
  public transform(value: Date | number | null): string {
    if (value === null || value === undefined) {
      return '';
    }
    const date: Date = value instanceof Date ? value : new Date(value);
    const day: string = date.getDate().toString().padStart(2, '0');
    const month: string = (date.getMonth() + 1).toString().padStart(2, '0');
    const year: string = (date.getFullYear() % 100).toString().padStart(2, '0');
    return `${day}/${month}/${year}`;
  }
}
