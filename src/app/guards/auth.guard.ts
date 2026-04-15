import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn && authService.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};

export const managerGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn && authService.isAdminOrManager()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
