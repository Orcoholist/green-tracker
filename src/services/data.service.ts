import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Greenhouse, Measurement, Region, State } from '../models';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl || '';

  getRegions(): Observable<Region[]> {
    if (environment.mock) {
      // При работе с моками возвращаем локальные данные
      return of([
        { id: 'r1', name: 'Центральный округ' },
        { id: 'r2', name: 'Южный округ' },
        { id: 'r3', name: 'Сибирь' },
      ]);
    }
    return this.http.get<Region[]>(`${this.apiUrl}/regions`);
  }

  getGreenhouses(): Observable<Greenhouse[]> {
    if (environment.mock) {
     
      return of([
        { id: 'g1', name: 'Теплица-1', region_id: 'r1' },
        { id: 'g2', name: 'Теплица-2', region_id: 'r1' },
        { id: 'g3', name: 'Теплица-3', region_id: 'r2' },
        { id: 'g4', name: 'Теплица-4', region_id: 'r3' },
      ]);
    }
    return this.http.get<Greenhouse[]>(`${this.apiUrl}/greenhouses`);
  }

  getMeasurements(
    greenhouseId: string,
    mType: 'T' | 'phi' | 'pH',
    dtFrom: string,
    dtTo: string
  ): Observable<Measurement[]> {
    if (environment.mock) {
      // Генерируем моковые данные
      return of(this.generateMockMeasurements(greenhouseId, mType, dtFrom, dtTo));
    }
    return this.http.get<Measurement[]>(`${this.apiUrl}/measurement/${greenhouseId}`, {
      params: { m_type: mType, dt_from: dtFrom, dt_to: dtTo },
    });
  }

  updateMeasurements(greenhouseId: string, mType: 'T' | 'phi' | 'pH' | 'all'): Observable<boolean> {
    if (environment.mock) {
      return of(true);
    }
    return this.http.get<boolean>(`${this.apiUrl}/update_measurements/${greenhouseId}`, {
      params: { m_type: mType },
    });
  }

  updateState(greenhouseId: string): Observable<boolean> {
    if (environment.mock) {
      return of(true);
    }
    return this.http.get<boolean>(`${this.apiUrl}/update_state/${greenhouseId}`);
  }

  fixMeasurement(measurementId: string, value: number): Observable<boolean> {
    if (environment.mock) {
      return of(true);
    }
    return this.http.post<boolean>(`${this.apiUrl}/fix_measurement/${measurementId}`, { value });
  }

  getStates(greenhouseId: string, dtFrom: string, dtTo: string): Observable<State[]> {
    if (environment.mock) {
      // Генерируем моковые данные о состоянии
      return of(this.generateMockStates(greenhouseId, dtFrom, dtTo));
    }
    return this.http.get<State[]>(`${this.apiUrl}/states/${greenhouseId}`, {
      params: { dt_from: dtFrom, dt_to: dtTo },
    });
  }

  commentState(stateId: string, comment: string): Observable<boolean> {
    if (environment.mock) {
      return of(true);
    }
    return this.http.post<boolean>(`${this.apiUrl}/comment_state/${stateId}`, { comment });
  }

  // Генерация моковых данных для измерений
  private generateMockMeasurements(
    greenhouseId: string,
    mType: string,
    dtFrom: string,
    dtTo: string
  ): Measurement[] {
    const data: Measurement[] = [];
    const fromDate = new Date(dtFrom);
    const toDate = new Date(dtTo);
    const oneDay = 24 * 60 * 60 * 1000;

    // Определяем базовое значение в зависимости от типа измерения
    let baseValue = 20;
    if (mType === 'phi') baseValue = 60;
    if (mType === 'pH') baseValue = 7;

    // Смещение для разных теплиц
    const offset = parseInt(greenhouseId.slice(1), 10) * 0.5;

    for (let d = new Date(fromDate); d <= toDate; d = new Date(d.getTime() + oneDay)) {
      const value = baseValue + offset + (Math.random() * 4 - 2); // ±2 отклонение

      data.push({
        measurement_id: `m-${greenhouseId}-${d.toISOString().split('T')[0]}`,
        greenhouse_id: greenhouseId,
        created_at: d.toISOString(),
        value: parseFloat(value.toFixed(2)),
      });
    }

    return data;
  }

  // Генерация моковых данных о состоянии
  private generateMockStates(greenhouseId: string, dtFrom: string, dtTo: string): State[] {
    const states: State[] = [];
    const fromDate = new Date(dtFrom);
    const toDate = new Date(dtTo);
    const oneDay = 24 * 60 * 60 * 1000;

    // Смещение для разных теплиц
    const offset = parseInt(greenhouseId.slice(1), 10) * 0.1;
    let lastState: 0 | 1 | 2 = 0;

    for (let d = new Date(fromDate); d <= toDate; d = new Date(d.getTime() + oneDay)) {
      // Вероятность различных состояний
      const rand = Math.random() + offset;
      let state: 0 | 1 | 2 = 0;

      if (rand > 0.9) {
        state = 2; // Авария
      } else if (rand > 0.7) {
        state = 1; // Предупреждение
      }

      // Состояние может меняться постепенно
      if (Math.random() > 0.2) {
        lastState = state;
      }

      states.push({
        state_id: `s-${greenhouseId}-${d.toISOString().split('T')[0]}`,
        greenhouse_id: greenhouseId,
        created_at: d.toISOString(),
        state: lastState,
        comment: '',
      });
    }

    return states;
  }
}
