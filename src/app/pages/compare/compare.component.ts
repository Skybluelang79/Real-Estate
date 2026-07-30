import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FavoritesService } from '../../services/favorites.service';
import { Property } from '../../models/project.model';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="compare-page">
      <nav class="compare-nav">
        <div class="nav-content">
          <a routerLink="/" class="logo">Dream Homes</a>
          <a routerLink="/" class="back-link"><i class="fas fa-arrow-left"></i> Back</a>
        </div>
      </nav>

      <div class="compare-content">
        <div class="section-header">
          <h2>Compare Properties</h2>
          <p>Select up to 4 properties to compare side by side</p>
        </div>

        @if (properties.length === 0) {
          <div class="empty-state">
            <i class="fas fa-balance-scale"></i>
            <p>No properties selected for comparison.</p>
            <p>Go to <a routerLink="/">property listings</a> and click the compare button on properties you want to compare.</p>
          </div>
        } @else {
          <div class="compare-table">
            <div class="compare-row header-row">
              <div class="compare-label">Property</div>
              @for (p of properties; track p.id) {
                <div class="compare-cell">
                  <button class="remove-btn" (click)="remove(p.id)">&times;</button>
                  <a [routerLink]="['/property', p.id]">{{ p.title }}</a>
                </div>
              }
            </div>
            <div class="compare-row">
              <div class="compare-label">Image</div>
              @for (p of properties; track p.id) {
                <div class="compare-cell">
                  <div class="compare-image">
                    @if (p.image) { <img [src]="p.image" [alt]="p.title"> }
                    @else { <div class="cp">{{ p.title.charAt(0) }}</div> }
                  </div>
                </div>
              }
            </div>
            <div class="compare-row">
              <div class="compare-label">Price</div>
              @for (p of properties; track p.id) {
                <div class="compare-cell price">\${{ p.price.toLocaleString() }}</div>
              }
            </div>
            <div class="compare-row">
              <div class="compare-label">Type</div>
              @for (p of properties; track p.id) {
                <div class="compare-cell">{{ p.type }}</div>
              }
            </div>
            <div class="compare-row">
              <div class="compare-label">Status</div>
              @for (p of properties; track p.id) {
                <div class="compare-cell">{{ p.status }}</div>
              }
            </div>
            <div class="compare-row">
              <div class="compare-label">Beds</div>
              @for (p of properties; track p.id) {
                <div class="compare-cell">{{ p.beds }}</div>
              }
            </div>
            <div class="compare-row">
              <div class="compare-label">Baths</div>
              @for (p of properties; track p.id) {
                <div class="compare-cell">{{ p.baths }}</div>
              }
            </div>
            <div class="compare-row">
              <div class="compare-label">Sq Ft</div>
              @for (p of properties; track p.id) {
                <div class="compare-cell">{{ p.sqft | number }}</div>
              }
            </div>
            <div class="compare-row">
              <div class="compare-label">Year Built</div>
              @for (p of properties; track p.id) {
                <div class="compare-cell">{{ p.yearBuilt }}</div>
              }
            </div>
            <div class="compare-row">
              <div class="compare-label">City</div>
              @for (p of properties; track p.id) {
                <div class="compare-cell">{{ p.city }}, {{ p.state }}</div>
              }
            </div>
            <div class="compare-row">
              <div class="compare-label">Featured</div>
              @for (p of properties; track p.id) {
                <div class="compare-cell">{{ p.featured ? 'Yes' : 'No' }}</div>
              }
            </div>
          </div>
          <button class="btn-clear-all" (click)="clearAll()">Clear All</button>
        }
      </div>
    </div>
  `,
  styles: [`
    .compare-page { min-height: 100vh; background: #f8f6f3; }
    .compare-nav { background: #1A1714; padding: 0 24px; position: sticky; top: 0; z-index: 100; }
    .nav-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; height: 70px; }
    .logo { font-family: 'Playfair Display', serif; font-size: 1.5rem; color: #C9A84C; font-weight: 700; text-decoration: none; }
    .back-link { color: #e8e0d6; text-decoration: none; font-size: 0.9rem; transition: color 0.3s; i { margin-right: 6px; } }
    .back-link:hover { color: #C9A84C; }
    .compare-content { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
    .section-header { text-align: center; margin-bottom: 40px; }
    .section-header h2 { font-family: 'Playfair Display', serif; font-size: 2.2rem; color: #1A1714; margin-bottom: 8px; }
    .section-header p { color: #6B6258; }
    .empty-state { text-align: center; padding: 80px 24px; color: #6B6258; }
    .empty-state i { font-size: 3rem; color: #C9A84C; margin-bottom: 16px; display: block; }
    .empty-state a { color: #C9A84C; font-weight: 600; }
    .compare-table { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.06); }
    .compare-row { display: grid; grid-template-columns: 120px repeat(auto-fill, 1fr); border-bottom: 1px solid #f0ebe5; }
    .compare-row:last-child { border: none; }
    .compare-label { padding: 16px; background: #f5f0ea; font-size: 0.85rem; font-weight: 600; color: #6B6258; display: flex; align-items: center; }
    .compare-cell { padding: 16px; font-size: 0.9rem; color: #3D3529; display: flex; align-items: center; gap: 8px; position: relative; min-width: 200px; }
    .compare-cell.price { font-weight: 700; color: #C9A84C; }
    .compare-cell a { color: #1A1714; text-decoration: none; font-weight: 600; }
    .compare-cell a:hover { color: #C9A84C; }
    .remove-btn { background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #6B6258; line-height: 1; padding: 0; transition: color 0.3s; }
    .remove-btn:hover { color: #ef4444; }
    .compare-image { width: 120px; height: 80px; border-radius: 8px; overflow: hidden; background: #e5ddd4; flex-shrink: 0; }
    .compare-image img { width: 100%; height: 100%; object-fit: cover; }
    .compare-image .cp { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #C9A84C, #A8882E); color: #fff; font-weight: 700; }
    .btn-clear-all { margin-top: 20px; padding: 10px 28px; background: transparent; border: 1px solid #e5ddd4; border-radius: 8px; cursor: pointer; color: #6B6258; transition: all 0.3s; }
    .btn-clear-all:hover { border-color: #ef4444; color: #ef4444; }
  `]
})
export class CompareComponent implements OnInit {
  private apiService = inject(ApiService);
  private favService = inject(FavoritesService);
  properties: Property[] = [];

  ngOnInit(): void {
    const ids = this.favService.getCompare();
    if (ids.length > 0) {
      this.apiService.getProperties().subscribe(data => {
        this.properties = data.properties.filter(p => ids.includes(p.id));
      });
    }
  }

  remove(id: number): void {
    this.favService.toggleCompare(id);
    this.properties = this.properties.filter(p => p.id !== id);
  }

  clearAll(): void {
    this.favService.clearCompare();
    this.properties = [];
  }
}
