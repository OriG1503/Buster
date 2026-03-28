import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DownloadService {
  /** Downloads a file from any URL and triggers a browser save-as with the given filename. */
  public downloadFromUrl(url: string, filename: string): void {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => this._triggerBlobDownload(blob, filename));
  }

  private _triggerBlobDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}
