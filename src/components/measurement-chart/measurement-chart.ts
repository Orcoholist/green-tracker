import { TimeUnit } from 'chart.js';

import {
  Component,
  inject,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ChartPoint, Measurement } from '../../models';
import { DatePipe } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartDataset } from 'chart.js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-measurement-chart',
  imports: [BaseChartDirective, MatFormFieldModule, MatSelectModule, MatButtonModule, DatePipe],
  templateUrl: './measurement-chart.html',
  styleUrl: './measurement-chart.scss',
  standalone: true,
})
export class MeasurementChartComponent implements OnInit, OnChanges {
  // @Input() greenhouseId!: string;
  // @Input({ required: true }) greenhouseId!: string;
  @Input() greenhouseId!: string;
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);

  selectedType: 'T' | 'phi' | 'pH' = 'T';
  selectedTime: TimeUnit = 'hour';

  chartData: ChartData<'line', ChartPoint[], string> = {
    datasets: [],
    labels: undefined,
  };
  chartOptions: ChartConfiguration['options'] = {};

  role: 'specialist' | 'senior-specialist' = 'specialist';
  lastUpdated: Date = new Date();

  ngOnInit(): void {
    this.role = this.authService.getRole();
    this.setupChart();
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['greenhouseId']) {
      console.log('🟢 greenhouseId изменился:', this.greenhouseId);
      if (this.greenhouseId) {
        this.loadData();
      }
    }
  }

  setupChart(): void {
    const timeUnit = this.selectedTime === 'week' ? 'day' : this.selectedTime;

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      onClick: (event, elements) => {
        if (elements.length && this.role === 'senior-specialist') {
          this.handlePointClick(elements[0].index);
        }
      },
      plugins: {
        legend: { display: true },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          type: 'time' as const,
          time: {
            unit: timeUnit,
            tooltipFormat: 'dd.MM.yyyy HH:mm',
            displayFormats: {
              hour: 'HH:mm',
              day: 'dd MMM',
              month: 'MMM yyyy',
              year: 'yyyy',
            },
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          type: 'linear' as const,
          title: {
            display: true,
            text: this.getLabel(),
          },
        },
      },
    };
  }

  loadData(): void {
    if (!this.greenhouseId) return;

    this.setupChart();

    const { from, to } = this.getTimeRange();

    this.dataService
      .getMeasurements(this.greenhouseId, this.selectedType, from.toISOString(), to.toISOString())
      .subscribe((data) => {
        this.updateChart(data);
        this.lastUpdated = new Date();
        this.cdr.detectChanges();
      });
  }

  refreshData(): void {
    this.loadData();
    this.dataService.updateMeasurements(this.greenhouseId, this.selectedType).subscribe({
      complete: () => {
        // После обновления данных перезагружаем их
        this.loadData();
      },
    });
  }

  getTimeRange(): { from: Date; to: Date } {
    const to = new Date();
    const from = new Date();

    switch (this.selectedTime) {
      case 'hour':
        from.setTime(to.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'day':
        from.setTime(to.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'week':
        from.setTime(to.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 дней
        break;
      case 'month':
        from.setMonth(to.getMonth() - 6);
        break;
      case 'year':
        from.setFullYear(to.getFullYear() - 1);
        break;
    }

    return { from, to };
  }

  updateChart(data: Measurement[]): void {
    if (!data || data.length === 0) {
      this.chartData = { datasets: [], labels: undefined };
      return;
    }

    const chartData: ChartPoint[] = data.map((m) => ({
      x: new Date(m.created_at),
      y: +m.value,
      measurement_id: m.measurement_id,
    }));

    const dataset: ChartDataset<'line', ChartPoint[]> = {
      data: chartData,
      label: this.getLabel(),
      borderColor: this.getColor(),
      backgroundColor: this.getBackgroundColor(),
      pointRadius: 4,
      tension: 0.3,
      fill: false,
    };

    this.chartData = {
      datasets: [dataset],
      labels: undefined,
    };

    this.cdr.detectChanges();
  }

  getLabel(): string {
    return { T: 'Температура (°C)', phi: 'Влажность (%)', pH: 'pH' }[this.selectedType];
  }

  getColor(): string {
    return { T: '#1976d2', phi: '#43a047', pH: '#fb8c00' }[this.selectedType];
  }

  getBackgroundColor(): string {
    return this.getColor() + '40';
  }

  handlePointClick(index: number): void {
    const point = this.chartData.datasets[0].data[index];
    if (!point || !point.measurement_id) return;

    const dateLabel = new Date(point.x).toLocaleString('ru-RU');
    const currentValue = point.y;

    const newValue = window.prompt(
      `Редактирование значения\nДата: ${dateLabel}\nТекущее: ${currentValue}\nВведите новое:`,
      String(currentValue)
    );

    if (newValue !== null && !isNaN(+newValue)) {
      // 1. Обновить график
      const updatedData = [...this.chartData.datasets[0].data];
      updatedData[index] = { ...updatedData[index], y: +newValue };

      this.chartData = {
        ...this.chartData,
        datasets: [
          {
            ...this.chartData.datasets[0],
            data: updatedData,
          },
        ],
      };

      // 2. Отправить на сервер
      this.dataService.fixMeasurement(point.measurement_id, +newValue).subscribe({
        next: () => {
          this.snackBar?.open?.('Значение обновлено', 'OK', { duration: 2000 });
        },
        error: (err) => {
          console.error('Ошибка обновления измерения', err);
          this.snackBar?.open?.('Ошибка сохранения', 'Закрыть', { duration: 3000 });
        },
      });

      this.cdr.detectChanges();
    }
  }

  onChartClick(event: any): void {
    if (this.role !== 'senior-specialist') return;

    const points = event.active;
    if (!points || points.length === 0) return;

    const index = points[0].index;
    this.handlePointClick(index);
  }
}
