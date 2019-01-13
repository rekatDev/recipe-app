import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgModel } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit, OnDestroy {
  isLoading = false;
  private authStatusSub: Subscription;

  constructor(public authService: AuthService) { }

  onSignup(form: NgModel) {
    if (form.invalid) {
      return;
    }
    this.isLoading = true;
    this.authService.createUser(form.value.email, form.value.password);
  }

  ngOnInit() {
    this.authStatusSub = this.authService.getAuthStatusListener()
    .subscribe( status => {
      this.isLoading = false;
    });
  }

  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
  }

}
