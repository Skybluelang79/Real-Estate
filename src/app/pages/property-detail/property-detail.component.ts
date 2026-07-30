import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { FavoritesService } from '../../services/favorites.service';
import { Property } from '../../models/project.model';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './property-detail.component.html',
  styleUrl: './property-detail.component.scss'
})
export class PropertyDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  favService = inject(FavoritesService);

  property: Property | null = null;
  loading = true;
  selectedImage = '';
  showAllImages = false;

  contact = { name: '', email: '', phone: '', message: '' };
  tour = { name: '', email: '', phone: '', preferredDate: '', preferredTime: '', message: '' };
  newsletterEmail = '';
  contactSent = false;
  tourSent = false;
  newsletterSent = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.apiService.getProperty(id).subscribe({
        next: (data) => {
          this.property = data.property;
          this.selectedImage = data.property.image || (data.property.images?.[0] || '');
          this.loading = false;
        },
        error: () => this.loading = false
      });
    }
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
  selectImage(img: string): void { this.selectedImage = img; }

  getGoogleMapsUrl(): string {
    if (!this.property) return '';
    return `https://www.google.com/maps?q=${encodeURIComponent(`${this.property.address} ${this.property.city} ${this.property.state} ${this.property.zip}`)}`;
  }

  submitContact(): void {
    if (!this.property) return;
    this.apiService.submitContact({ ...this.contact, propertyId: this.property.id }).subscribe({
      next: () => { this.contactSent = true; this.contact = { name: '', email: '', phone: '', message: '' }; },
      error: () => this.contactSent = true
    });
  }

  submitTour(): void {
    if (!this.property) return;
    this.apiService.scheduleTour({ ...this.tour, propertyId: this.property.id }).subscribe({
      next: () => { this.tourSent = true; this.tour = { name: '', email: '', phone: '', preferredDate: '', preferredTime: '', message: '' }; },
      error: () => this.tourSent = true
    });
  }

  subscribeNewsletter(): void {
    if (!this.newsletterEmail) return;
    this.apiService.subscribeNewsletter(this.newsletterEmail).subscribe({
      next: () => { this.newsletterSent = true; this.newsletterEmail = ''; },
      error: () => this.newsletterSent = true
    });
  }

  shareOn(platform: string): void {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(this.property?.title || 'Dream Homes');
    const links: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      email: `mailto:?subject=${text}&body=${url}`
    };
    window.open(links[platform], '_blank');
  }
}
