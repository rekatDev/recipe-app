import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authStatusListenerSub: Subscription;

  isAuth = false;

  constructor(public authService: AuthService) {}

  ngOnInit() {
    this.isAuth = this.authService.getAuthStatus();
    this.authStatusListenerSub = this.authService.getAuthStatusListener().subscribe(result => {
      this.isAuth = result;
    });
  }

  ngOnDestroy(): void {
    this.authStatusListenerSub.unsubscribe();
  }

  onLogout() {
    this.authService.logout();
  }

}
