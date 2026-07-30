import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FavoritesService } from '../../services/favorites.service';
import { Property } from '../../models/project.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, AfterViewInit {
  private apiService = inject(ApiService);
  favService = inject(FavoritesService);
  properties: Property[] = [];
  featuredProperties: Property[] = [];
  filteredProperties: Property[] = [];
  newsletterEmail = '';
  newsletterSent = false;
  mapInitialized = false;

  searchTerm = '';
  selectedType = '';
  selectedStatus = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  minBeds: number | null = null;

  propertyTypes = ['House', 'Apartment', 'Condo', 'Villa', 'Cottage', 'Penthouse', 'Townhouse'];
  statusOptions = ['For Sale', 'For Rent', 'Sold'];

  ngOnInit(): void {
    this.apiService.getProperties().subscribe(data => {
      this.properties = data.properties;
      this.featuredProperties = data.properties.filter(p => p.featured);
      this.filteredProperties = data.properties;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 2000);
  }

  private initMap(): void {
    const el = document.getElementById('property-map');
    if (!el || this.mapInitialized) return;
    const L = (window as any).L;
    if (!L) return;
    this.mapInitialized = true;
    const map = L.map(el).setView([34.05, -118.24], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    this.properties.forEach(p => {
      if (p.latitude && p.longitude) {
        const marker = L.marker([p.latitude, p.longitude]).addTo(map);
        marker.bindPopup(`<strong>${p.title}</strong><br>${this.formatPrice(p.price)}`);
      }
    });
  }

  getTagArray(tags: string): string[] { return tags ? tags.split(',').map(t => t.trim()) : []; }
  formatPrice(price: number): string { return '$' + price.toLocaleString(); }

  getBadgeClass(badge: string | null): string {
    const map: Record<string, string> = {
      'Premium': 'badge-gold', 'New': 'badge-blue', 'Exclusive': 'badge-purple',
      'Hot Deal': 'badge-red', 'Family Favorite': 'badge-green', 'Beach Life': 'badge-teal'
    };
    return badge ? map[badge] || 'badge-default' : '';
  }

  filterProperties(): void {
    this.filteredProperties = this.properties.filter(p => {
      if (this.searchTerm) {
        const s = this.searchTerm.toLowerCase();
        if (!p.title.toLowerCase().includes(s) && !p.city.toLowerCase().includes(s) && !p.state.toLowerCase().includes(s)) return false;
      }
      if (this.selectedType && p.type !== this.selectedType) return false;
      if (this.selectedStatus && p.status !== this.selectedStatus) return false;
      if (this.minPrice !== null && p.price < this.minPrice) return false;
      if (this.maxPrice !== null && p.price > this.maxPrice) return false;
      if (this.minBeds !== null && p.beds < this.minBeds) return false;
      return true;
    });
  }

  clearFilters(): void {
    this.searchTerm = ''; this.selectedType = ''; this.selectedStatus = '';
    this.minPrice = null; this.maxPrice = null; this.minBeds = null;
    this.filteredProperties = this.properties;
  }

  subscribeNewsletter(): void {
    if (!this.newsletterEmail) return;
    this.apiService.subscribeNewsletter(this.newsletterEmail).subscribe({
      next: () => { this.newsletterSent = true; this.newsletterEmail = ''; },
      error: () => this.newsletterSent = true
    });
  }
}
