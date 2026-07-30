import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { Property } from '../../../models/project.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-home"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ totalProperties }}</span>
            <span class="stat-label">Total Properties</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon featured"><i class="fas fa-star"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ featuredCount }}</span>
            <span class="stat-label">Featured</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon sale"><i class="fas fa-tag"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ forSaleCount }}</span>
            <span class="stat-label">For Sale</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon rent"><i class="fas fa-key"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ forRentCount }}</span>
            <span class="stat-label">For Rent</span>
          </div>
        </div>
      </div>

      <div class="recent-section">
        <h3>Recent Properties</h3>
        <div class="recent-list">
          @for (p of recentProperties; track p.id) {
            <div class="recent-item">
              <div class="recent-image">
                @if (p.image) {
                  <img [src]="p.image" [alt]="p.title">
                } @else {
                  <div class="recent-placeholder">{{ p.title.charAt(0) }}</div>
                }
              </div>
              <div class="recent-info">
                <strong>{{ p.title }}</strong>
                <span>{{ p.city }}, {{ p.state }} — {{ formatPrice(p.price) }}</span>
              </div>
              <span class="recent-badge" [class.featured]="p.featured">{{ p.featured ? 'Featured' : p.status }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding: 24px 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .stat-card { background: #fff; border-radius: 12px; padding: 24px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .stat-icon { width: 52px; height: 52px; border-radius: 12px; background: #f5f0ea; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: #C9A84C; flex-shrink: 0; }
    .stat-icon.featured { background: #fef3c7; color: #d97706; }
    .stat-icon.sale { background: #d1fae5; color: #059669; }
    .stat-icon.rent { background: #dbeafe; color: #2563eb; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.8rem; font-weight: 700; color: #1A1714; line-height: 1; }
    .stat-label { font-size: 0.8rem; color: #6B6258; margin-top: 4px; }
    .recent-section h3 { font-size: 1.1rem; color: #1A1714; margin-bottom: 16px; }
    .recent-list { display: flex; flex-direction: column; gap: 12px; }
    .recent-item { display: flex; align-items: center; gap: 16px; background: #fff; padding: 14px; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
    .recent-image { width: 56px; height: 56px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #e5ddd4; }
    .recent-image img { width: 100%; height: 100%; object-fit: cover; }
    .recent-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #C9A84C, #A8882E); color: #fff; font-weight: 700; }
    .recent-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .recent-info strong { font-size: 0.9rem; color: #1A1714; }
    .recent-info span { font-size: 0.8rem; color: #6B6258; }
    .recent-badge { font-size: 0.7rem; padding: 4px 10px; border-radius: 12px; background: #f0ebe5; color: #6B6258; font-weight: 500; }
    .recent-badge.featured { background: #C9A84C; color: #fff; }
  `]
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  properties: Property[] = [];
  totalProperties = 0;
  featuredCount = 0;
  forSaleCount = 0;
  forRentCount = 0;
  recentProperties: Property[] = [];

  ngOnInit(): void {
    this.apiService.getProperties().subscribe(data => {
      this.properties = data.properties;
      this.totalProperties = data.properties.length;
      this.featuredCount = data.properties.filter(p => p.featured).length;
      this.forSaleCount = data.properties.filter(p => p.status === 'For Sale').length;
      this.forRentCount = data.properties.filter(p => p.status === 'For Rent').length;
      this.recentProperties = data.properties.slice(0, 5);
    });
  }

  formatPrice(p: number): string {
    return '$' + p.toLocaleString();
  }
}
