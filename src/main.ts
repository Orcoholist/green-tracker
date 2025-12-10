// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';
import { AppComponent } from './app/app';
import 'chart.js/auto';
import 'chartjs-adapter-date-fns';

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// Условная загрузка MSW только когда моки включены
if (environment.mock) {
  import('./mocks/browser').then(({ worker }) => {
    worker
      .start({
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
        onUnhandledRequest: 'bypass',
      })
      .then(() => {
        console.log('[MSW] Mocking enabled — запуск приложения');
        bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
      });
  });
} else {
  bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
}
