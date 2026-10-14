import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements AfterViewInit, OnDestroy {
  private emberScript?: HTMLScriptElement;

  ngAfterViewInit(): void {
    this.emberScript = document.createElement('script');
    this.emberScript.src = '/js/brasas.js';
    document.body.appendChild(this.emberScript);
  }

  ngOnDestroy(): void {
    this.emberScript?.remove();
  }
}
