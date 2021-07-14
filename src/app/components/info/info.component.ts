import { Location } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss'],
})
export class InfoComponent implements OnInit {

  hasHistory: boolean;
  selectedSection: string;

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.goBack();
  }

  constructor(
    private location: Location,
    private router: Router
  ) {
    this.hasHistory = this.router.navigated;
  }

  ngOnInit(): void {
    this.selectedSection = 'stake';
  }

  setMenuSection(section: string): void  {
    this.selectedSection = section;
  }

  goBack(): void {
    if (this.hasHistory) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }
}
