import { AuthService } from './../../services/auth.service';
import { DataService } from './../../services/data.service';
import {
  Component,
  Input,
  OnInit,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';

import { MatDialog } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { State } from '../../models';
import {
  EditCommentData,
  EditCommentDialogComponent,
} from '../edit-comment-dialog/edit-comment-dialog';

@Component({
  selector: 'app-state-history',
  templateUrl: './state-history.html',
  styleUrls: ['./state-history.scss'],
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DatePipe,
    CommonModule,
    MatDialogModule,
  ],
})
export class StateHistoryComponent implements OnInit {
  @Input() greenhouseId!: string;

  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  states: State[] = [];
  dataSource = new MatTableDataSource<State>();
  displayedColumns: string[] = ['created_at', 'state', 'comment'];

  isRecalculating = false;
  editingComment: string | null = null;
  role: 'specialist' | 'senior-specialist' = 'specialist';

  constructor(
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getRole();
    this.loadStates();
  }

  loadStates(): void {
    const from = new Date();
    from.setMonth(from.getMonth() - 1);

    this.dataService
      .getStates(this.greenhouseId, from.toISOString(), new Date().toISOString())
      .subscribe((states) => {
        this.states = states.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        this.dataSource.data = this.states;
        // Принудительное обнаружение изменений
        this.cdr.detectChanges();
      });
  }

  recalculateState(): void {
    this.isRecalculating = true;
    // Имитация задержки 3 сек (реально — 10-15 мин, но в моке — быстро)
    this.dataService.updateState(this.greenhouseId).subscribe(() => {
      setTimeout(() => {
        this.isRecalculating = false;
        this.loadStates(); // Обновить после расчёта
        // Принудительное обнаружение изменений
        this.cdr.detectChanges();
      }, 3000);
    });
  }

  startEditing(state: State): void {
    const dialogRef = this.dialog.open<EditCommentDialogComponent, EditCommentData>(
      EditCommentDialogComponent,
      {
        data: { comment: state.comment },
        width: '400px',
      }
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.dataService.commentState(state.state_id, result).subscribe(() => {
          state.comment = result;
          // Принудительное обнаружение изменений
          this.cdr.detectChanges();
        });
      }
    });
  }

  saveComment(state: State): void {
    const input = document.querySelector('.comment-input') as HTMLInputElement;
    const comment = input?.value?.trim() ?? '';

    this.dataService.commentState(state.state_id, comment).subscribe(() => {
      state.comment = comment;
      this.editingComment = null;
      // Принудительное обнаружение изменений
      this.cdr.detectChanges();
    });
  }

  getStatusText(state: number): string {
    const statusMap: Record<number, string> = { 0: 'Норма', 1: 'Предупреждение', 2: 'Авария' };
    return statusMap[state] ?? 'Неизвестно';
  }

  getStatusClass(state: number): string {
    const classMap: Record<number, string> = { 0: 'ok', 1: 'warning', 2: 'alarm' };
    return classMap[state] ?? 'unknown';
  }
}
