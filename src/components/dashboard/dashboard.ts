import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MeasurementChartComponent } from '../measurement-chart/measurement-chart';
import { StatusWidgetComponent } from '../status-widget/status-widget';
import { StateHistoryComponent } from '../state-history/state-history';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Greenhouse, Region } from '../../models';
import { signal, computed } from '@angular/core';
import { fromEvent, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, StatusWidgetComponent, MeasurementChartComponent, StateHistoryComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit {
  regions = signal<Region[]>([]);
  greenhouses = signal<Greenhouse[]>([]);
  selectedGhId = signal<string | null>(null);
  selectedGhName = signal<string | null>(null);
  isRoleMenuOpen = signal<boolean>(false);

  role: 'specialist' | 'senior-specialist' = 'specialist';

  regionsWithGreenhouses = computed(() => {
    const regions = this.regions();
    const greenhouses = this.greenhouses();

    return regions.map((region) => ({
      ...region,
      greenhouses: greenhouses.filter((gh) => gh.region_id === region.id),
    }));
  });

  selectedRegionId = signal<string | null>(null);

  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.role = this.authService.getRole();
    this.loadStructure();
  }

  ngAfterViewInit(): void {
    // Закрыть меню при клике вне его
    fromEvent(document, 'click')
      .pipe(
        takeUntil(this.destroy$) // если используете OnDestroy
      )
      .subscribe((event: any) => {
        const button = document.querySelector('.role-button');
        const menu = document.querySelector('.role-menu');

        if (!button?.contains(event.target) && !menu?.contains(event.target)) {
          this.isRoleMenuOpen.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStructure(): void {
    this.dataService.getRegions().subscribe({
      next: (regions) => {
        console.log(' Regions loaded:', regions);
        this.regions.set(regions);
      },
      error: (err) => {
        console.error(' Failed to load regions:', err);
      },
    });

    this.dataService.getGreenhouses().subscribe({
      next: (greenhouses) => {
        console.log('Greenhouses loaded:', greenhouses);
        this.greenhouses.set(greenhouses);
      },
      error: (err) => {
        console.error(' Failed to load greenhouses:', err);
      },
    });
  }

  selectGreenhouse(gh: Greenhouse): void {
    this.selectedGhId.set(gh.id);
    this.selectedGhName.set(gh.name);
    this.selectedRegionId.set(gh.region_id);
    console.log('Selected greenhouse:', gh);
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  selectRegion(region: Region): void {
    console.log('Selected region:', region);
  }

  onRegionChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const regionId = select.value;

    this.selectedRegionId.set(regionId ? regionId : null);
    this.selectedGhId.set(null);
    this.selectedGhName.set(null);
  }

  onGreenhouseChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const greenhouseId = select.value;

    if (greenhouseId) {
      const greenhouse = this.greenhouses().find((gh) => gh.id === greenhouseId);
      if (greenhouse) {
        this.selectGreenhouse(greenhouse);
      }
    } else {
      this.selectedGhId.set(null);
      this.selectedGhName.set(null);
    }
  }
  greenhousesByRegion = computed(() => {
    const regionId = this.selectedRegionId();
    if (!regionId) return [];
    return this.greenhouses().filter((gh) => gh.region_id === regionId);
  });

  toggleRoleMenu(): void {
    this.isRoleMenuOpen.update((open) => !open);
  }

  logout(): void {
    this.isRoleMenuOpen.set(false);
    this.router.navigate(['/role']);
  }
}
