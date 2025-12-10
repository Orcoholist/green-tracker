import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface EditCommentData {
  comment: string;
}

@Component({
  selector: 'app-edit-comment-dialog',
  templateUrl: './edit-comment-dialog.html',
  styleUrl: './edit-comment-dialog.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
})
export class EditCommentDialogComponent {
  comment: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: EditCommentData) {
    this.comment = data.comment;
  }
}
