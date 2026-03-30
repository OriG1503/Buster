import { Component, inject, input } from '@angular/core';

import { RelationalHistoryAnchor, RelationalHistoryGroup, RelationalHistoryResponse } from '../../../../shared/types/relational-history-response.type';
import { DisplayNamesService } from '../../../../core/services/display-names/display-names.service';

@Component({
  standalone: true,
  selector: 'app-history-table-relational',
  templateUrl: './history-table-relational.component.html',
  styleUrl: './history-table-relational.component.scss',
})
export class HistoryTableRelationalComponent {
  public readonly $history = input.required<RelationalHistoryResponse>();
  public readonly $sourceLabel = input.required<string>();
  public readonly $sourceTimeLabel = input.required<string>();
  public readonly $notesLabel = input.required<string>();

  private readonly _displayNames = inject(DisplayNamesService);

  protected getEntityName(tableName: string): string {
    return this._displayNames.getEntityName(tableName);
  }

  protected getAnchorFieldKeys(anchor: RelationalHistoryAnchor): string[] {
    return Object.keys(anchor.fields);
  }

  protected getAnchorFieldLabel(tableName: string, field: string): string {
    return this._displayNames.getColumnLabel(tableName, field);
  }

  protected getGroupLabel(group: RelationalHistoryGroup): string {
    return `אופציות ${this._displayNames.getEntityName(group.relatedTable)}`;
  }

  protected getGroupSubtreeFields(group: RelationalHistoryGroup): string[] {
    const fields = new Set<string>();
    group.options.forEach((opt) => Object.keys(opt.subtreeIds).forEach((field) => fields.add(field)));
    return [...fields];
  }

  protected getSubtreeFieldLabel(relatedTable: string, fkField: string): string {
    return this._displayNames.getColumnLabel(relatedTable, fkField);
  }
}
