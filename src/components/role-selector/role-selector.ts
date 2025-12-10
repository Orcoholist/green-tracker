import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-role-selector',
  templateUrl: './role-selector.html',
  styleUrls: ['./role-selector.scss'],
  standalone: true,
  imports: [MatButtonModule],
})
export class RoleSelectorComponent {
  constructor(private authService: AuthService, private router: Router) {}

  setRole(role: 'specialist' | 'senior-specialist') {
    this.authService.setRole(role);
    this.router.navigate(['/dashboard']);
  }
}
