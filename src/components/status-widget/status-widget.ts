import { Component, Input, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../services/data.service';
import { State, Greenhouse } from '../../models';
import { CommonModule } from '@angular/common';
import { combineLatest } from 'rxjs';

interface StatusCount {
  ok: number;
  warning: number;
  alarm: number;
}

@Component({
  selector: 'app-status-widget',
  imports: [MatCardModule, MatIconModule, CommonModule],
  templateUrl: './status-widget.html',
  styleUrl: './status-widget.scss',
  standalone: true,
})
export class StatusWidgetComponent implements OnInit {
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);

  @Input() regionId?: string;

  counts: StatusCount = { ok: 0, warning: 0, alarm: 0 };

  ngOnInit() {
    this.loadStatusCounts();
  }

  loadStatusCounts() {
    // Получаем все данные параллельно
    combineLatest([
      this.dataService.getGreenhouses(),
      this.dataService.getStates('g1', this.get30DaysAgo(), new Date().toISOString()),
      this.dataService.getStates('g2', this.get30DaysAgo(), new Date().toISOString()),
      this.dataService.getStates('g3', this.get30DaysAgo(), new Date().toISOString()),
      this.dataService.getStates('g4', this.get30DaysAgo(), new Date().toISOString()),
    ]).subscribe(([greenhouses, s1, s2, s3, s4]) => {
      const statesMap = new Map<string, State[]>([
        ['g1', s1],
        ['g2', s2],
        ['g3', s3],
        ['g4', s4],
      ]);

      // Фильтруем теплицы по региону, если указан
      const filteredGhs = this.regionId
        ? greenhouses.filter((gh) => gh.region_id === this.regionId)
        : greenhouses;

      let ok = 0;
      let warning = 0;
      let alarm = 0;

      filteredGhs.forEach((gh) => {
        const states = statesMap.get(gh.id) || [];
        if (states.length > 0) {
          // Находим последнее состояние
          const latest = states.reduce((prev, current) =>
            new Date(prev.created_at) > new Date(current.created_at) ? prev : current
          );

          if (latest.state === 0) ok++;
          else if (latest.state === 1) warning++;
          else if (latest.state === 2) alarm++;
        }
      });

      // Обновляем счетчики
      this.counts = { ok, warning, alarm };

      // Принудительное обнаружение изменений
      this.cdr.detectChanges();
    });
  }

  private get30DaysAgo(): string {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }
}
