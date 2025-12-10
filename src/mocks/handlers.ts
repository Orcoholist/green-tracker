import { http, HttpResponse } from 'msw';

// --- Типы ---
type FixMeasurementBody = { value: number };
type CommentStateBody = { comment: string };

// --- Данные ---
const regions = [
  { id: 'r1', name: 'Центральный округ' },
  { id: 'r2', name: 'Южный округ' },
  { id: 'r3', name: 'Сибирь' },
];

const greenhouses = [
  { id: 'g1', name: 'Теплица-1', region_id: 'r1' },
  { id: 'g2', name: 'Теплица-2', region_id: 'r1' },
  { id: 'g3', name: 'Теплица-3', region_id: 'r2' },
  { id: 'g4', name: 'Теплица-4', region_id: 'r3' },
];

// --- Генерация данных за год ---
const ONE_DAY = 24 * 60 * 60 * 1000; // мс в сутках

function seasonalTrend(dayOfYear: number): number {
  return 5 * Math.sin((2 * Math.PI * (dayOfYear - 80)) / 365) + 20;
}

// Добавляем шум и случайность
function generateNoisyValue(base: number, amplitude: number = 2): number {
  return base + (Math.random() * 2 - 1) * amplitude;
}

// Генерация измерений — по одному на каждый час
// --- Генерация измерений — по одной точке в день ---
function generateMeasurements(greenhouseId: string): any[] {
  const data: any[] = [];
  const now = new Date();
  const startDate = new Date(now);
  startDate.setFullYear(startDate.getFullYear() - 1); // год назад

  // Сдвиг температуры для каждой теплицы
  const offset = parseInt(greenhouseId.slice(1), 10) * 0.5;

  for (let d = new Date(startDate); d <= now; d = new Date(d.getTime() + ONE_DAY)) {
    const dayOfYear = Math.floor(
      (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / ONE_DAY
    );

    // Базовая температура с сезонным трендом
    const baseTemp = seasonalTrend(dayOfYear) + offset;

    // Добавим суточный разброс: утро прохладнее, день теплее
    const dailyVariation = 3 * Math.sin((2 * Math.PI * (d.getHours() - 6)) / 24);
    const value = generateNoisyValue(baseTemp + dailyVariation, 1); // ±1°C

    data.push({
      measurement_id: `m-${greenhouseId}-${d.toISOString().split('T')[0]}`,
      greenhouse_id: greenhouseId,
      created_at: d.toISOString(),
      value: parseFloat(value.toFixed(2)),
    });
  }
  return data;
}

// Генерация состояний — одно на каждый день
function generateStates(greenhouseId: string): any[] {
  const states: any[] = [];
  const now = new Date();
  const startDate = new Date(now);
  startDate.setFullYear(startDate.getFullYear() - 1); // год назад

  // Случайный сдвиг состояния по теплице
  const offset = parseInt(greenhouseId.slice(1), 10) * 0.1;
  let lastState = 0;

  for (let d = new Date(startDate); d <= now; d = new Date(d.getTime() + ONE_DAY)) {
    const dayOfYear = Math.floor(
      (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / ONE_DAY
    );
    const seasonFactor = Math.sin((2 * Math.PI * dayOfYear) / 365);
    const failureRate = 0.05 + Math.abs(seasonFactor) * 0.1 + offset; // зимой и летом — выше риск

    // Случайное состояние: 0=норма, 1=предупреждение, 2=авария
    const rand = Math.random();
    const state = rand < failureRate ? (rand < failureRate * 0.4 ? 2 : 1) : 0;

    // Состояние плавно меняется
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

// Хранение изменений
const stateComments: Record<string, string> = {};
const measurementValues: Record<string, number> = {};

//  базовый URL
const API_URL = 'http://localhost:4200';

export const handlers = [
  http.get(`${API_URL}/regions`, () => {
    return HttpResponse.json(regions);
  }),

  http.get(`${API_URL}/greenhouses`, () => {
    return HttpResponse.json(greenhouses);
  }),

  http.get(`${API_URL}/measurement/:greenhouseId`, ({ params }) => {
    const { greenhouseId } = params;
    const data = generateMeasurements(greenhouseId as string);
    return HttpResponse.json(data);
  }),

  http.get(`${API_URL}/update_measurements/:greenhouseId`, () => {
    console.log('Triggered sensor update');
    return HttpResponse.json(true);
  }),

  http.get(`${API_URL}/update_state/:greenhouseId`, async () => {
    await new Promise((r) => setTimeout(r, 3000));
    return HttpResponse.json(true);
  }),

  http.post<never, FixMeasurementBody>(
    `${API_URL}/fix_measurement/:measurementId`,
    async ({ params, request }) => {
      const { measurementId } = params;
      const { value } = await request.json();
      measurementValues[measurementId] = value;
      return HttpResponse.json(true);
    }
  ),

  http.get(`${API_URL}/states/:greenhouseId`, ({ params }) => {
    const { greenhouseId } = params;
    const states = generateStates(greenhouseId as string);
    return HttpResponse.json(states);
  }),

  http.post<never, CommentStateBody>(
    `${API_URL}/comment_state/:stateId`,
    async ({ params, request }) => {
      const { stateId } = params;
      const { comment } = await request.json();
      stateComments[stateId] = comment;
      return HttpResponse.json(true);
    }
  ),
];
