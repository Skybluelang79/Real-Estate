import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <div class="settings-card">
        <h3>Site Settings</h3>
        <div class="form-group">
          <label>Site Name</label>
          <input type="text" [(ngModel)]="siteName" placeholder="Dream Homes">
        </div>
        <div class="form-group">
          <label>Site Description</label>
          <textarea [(ngModel)]="siteDescription" rows="2" placeholder="Luxury Real Estate"></textarea>
        </div>
        <div class="form-group">
          <label>Contact Email</label>
          <input type="email" [(ngModel)]="contactEmail" placeholder="info@dreamhomes.com">
        </div>
        <div class="form-group">
          <label>Contact Phone</label>
          <input type="text" [(ngModel)]="contactPhone" placeholder="(800) 555-HOME">
        </div>
        <button class="btn-save-settings" (click)="saveSettings()">Save Settings</button>
        @if (saved) {
          <p class="save-success">Settings saved successfully!</p>
        }
      </div>

      <div class="settings-card">
        <h3>Account</h3>
        <div class="form-group">
          <label>Current Password</label>
          <input type="password" [(ngModel)]="currentPassword" placeholder="Enter current password">
        </div>
        <div class="form-group">
          <label>New Password</label>
          <input type="password" [(ngModel)]="newPassword" placeholder="Enter new password">
        </div>
        <button class="btn-save-settings" (click)="changePassword()">Change Password</button>
        @if (passwordChanged) {
          <p class="save-success">Password changed!</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .settings-page { display: flex; flex-direction: column; gap: 24px; padding: 24px 0; max-width: 600px; }
    .settings-card { background: #fff; border-radius: 12px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .settings-card h3 { font-size: 1.1rem; color: #1A1714; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #f0ebe5; }
    .form-group { margin-bottom: 18px; }
    .form-group label { display: block; font-size: 0.8rem; font-weight: 600; color: #3D3529; margin-bottom: 6px; }
    .form-group input, .form-group textarea {
      width: 100%; padding: 10px 14px; border: 1px solid #e5ddd4; border-radius: 8px;
      font-size: 0.9rem; outline: none; transition: border-color 0.3s; box-sizing: border-box;
    }
    .form-group input:focus, .form-group textarea:focus { border-color: #C9A84C; }
    .btn-save-settings {
      padding: 10px 28px; background: #C9A84C; color: #fff; border: none; border-radius: 8px;
      font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: background 0.3s;
    }
    .btn-save-settings:hover { background: #b8973a; }
    .save-success { margin-top: 12px; color: #059669; font-size: 0.85rem; font-weight: 500; }
  `]
})
export class SettingsComponent {
  siteName = 'Dream Homes';
  siteDescription = 'Luxury Real Estate';
  contactEmail = 'info@dreamhomes.com';
  contactPhone = '(800) 555-HOME';
  currentPassword = '';
  newPassword = '';
  saved = false;
  passwordChanged = false;

  saveSettings(): void {
    localStorage.setItem('site_name', this.siteName);
    localStorage.setItem('site_description', this.siteDescription);
    localStorage.setItem('contact_email', this.contactEmail);
    localStorage.setItem('contact_phone', this.contactPhone);
    this.saved = true;
    setTimeout(() => this.saved = false, 3000);
  }

  changePassword(): void {
    this.passwordChanged = true;
    this.currentPassword = '';
    this.newPassword = '';
    setTimeout(() => this.passwordChanged = false, 3000);
  }
}
