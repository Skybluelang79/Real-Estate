import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Property } from '../../models/project.model';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SettingsComponent } from './settings/settings.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardComponent, SettingsComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

  activeTab: 'dashboard' | 'properties' | 'settings' = 'dashboard';
  properties: Property[] = [];
  showModal = false;
  editingProperty: Property | null = null;
  loading = false;

  formData = {
    title: '',
    description: '',
    price: 0,
    beds: 1,
    baths: 1,
    sqft: 0,
    address: '',
    city: '',
    state: '',
    zip: '',
    type: 'House',
    status: 'For Sale',
    yearBuilt: new Date().getFullYear(),
    image: '',
    tags: '',
    badge: '',
    featured: false,
    agent: '',
    agentPhone: '',
    agentEmail: ''
  };

  propertyTypes = ['House', 'Apartment', 'Condo', 'Villa', 'Cottage', 'Penthouse', 'Townhouse'];
  statusOptions = ['For Sale', 'For Rent', 'Sold'];

  ngOnInit(): void {
    if (!this.apiService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadProperties();
  }

  loadProperties(): void {
    this.loading = true;
    this.apiService.getProperties().subscribe({
      next: (data) => {
        this.properties = data.properties;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  openAddModal(): void {
    this.editingProperty = null;
    this.formData = {
      title: '', description: '', price: 0, beds: 1, baths: 1, sqft: 0,
      address: '', city: '', state: '', zip: '', type: 'House',
      status: 'For Sale', yearBuilt: new Date().getFullYear(),
      image: '', tags: '', badge: '', featured: false,
      agent: '', agentPhone: '', agentEmail: ''
    };
    this.showModal = true;
  }

  openEditModal(property: Property): void {
    this.editingProperty = property;
    this.formData = {
      title: property.title,
      description: property.description,
      price: property.price,
      beds: property.beds,
      baths: property.baths,
      sqft: property.sqft,
      address: property.address,
      city: property.city,
      state: property.state,
      zip: property.zip,
      type: property.type,
      status: property.status,
      yearBuilt: property.yearBuilt,
      image: property.image || '',
      tags: property.tags,
      badge: property.badge || '',
      featured: property.featured,
      agent: property.agent,
      agentPhone: property.agentPhone,
      agentEmail: property.agentEmail
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingProperty = null;
  }

  saveProperty(): void {
    const data = { ...this.formData };
    if (this.editingProperty) {
      this.apiService.updateProperty(this.editingProperty.id, data).subscribe({
        next: () => { this.loadProperties(); this.closeModal(); },
        error: (err) => alert(err.error?.error || 'Error updating property')
      });
    } else {
      this.apiService.createProperty(data).subscribe({
        next: () => { this.loadProperties(); this.closeModal(); },
        error: (err) => alert(err.error?.error || 'Error creating property')
      });
    }
  }

  deleteProperty(id: number): void {
    if (confirm('Delete this property?')) {
      this.apiService.deleteProperty(id).subscribe({
        next: () => this.loadProperties(),
        error: (err) => alert(err.error?.error || 'Error deleting property')
      });
    }
  }

  logout(): void {
    this.apiService.logout().subscribe({
      next: () => this.router.navigate(['/'])
    });
  }

  formatPrice(p: number): string {
    return '$' + p.toLocaleString();
  }
}
