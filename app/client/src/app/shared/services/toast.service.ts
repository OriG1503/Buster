import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error';

export type ToastMessage = {
  id: number;
  text: string;
  type: ToastType;
};

const TOAST_DURATION_MS = 3500;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _nextId = 0;

  public readonly $messages = signal<ToastMessage[]>([]);

  public show(text: string, type: ToastType): void {
    const id = this._nextId++;
    this.$messages.update((msgs) => [...msgs, { id, text, type }]);
    setTimeout(() => {
      this.$messages.update((msgs) => msgs.filter((m) => m.id !== id));
    }, TOAST_DURATION_MS);
  }
}
