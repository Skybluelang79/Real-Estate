import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Property, User } from '../models/project.model';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3006/api';

  private tokenKey = 'auth_token';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const token = this.getToken();
    if (token) {
      this.me().subscribe(response => {
        this.currentUserSubject.next(response.user);
      });
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return token
      ? new HttpHeaders({ 'Authorization': `Bearer ${token}` })
      : new HttpHeaders();
  }

  login(email: string, password: string): Observable<{ user: User; token: string }> {
    return this.http.post<{ user: User; token: string }>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(tap(response => {
        this.setToken(response.token);
        this.currentUserSubject.next(response.user);
      }));
  }

  register(name: string, email: string, password: string): Observable<{ user: User; token: string }> {
    return this.http.post<{ user: User; token: string }>(`${this.apiUrl}/auth/signup`, { name, email, password })
      .pipe(tap(response => {
        this.setToken(response.token);
        this.currentUserSubject.next(response.user);
      }));
  }

  me(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.apiUrl}/auth/me`, { headers: this.getHeaders() })
      .pipe(tap(response => this.currentUserSubject.next(response.user)));
  }

  logout(): Observable<any> {
    this.clearToken();
    return new Observable(sub => sub.next(null));
  }

  getProperties(): Observable<{ properties: Property[] }> {
    return this.http.get<{ properties: Property[] }>(`${this.apiUrl}/properties`);
  }

  getProperty(id: number): Observable<{ property: Property }> {
    return this.http.get<{ property: Property }>(`${this.apiUrl}/properties/${id}`);
  }

  createProperty(property: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/properties`, property, { headers: this.getHeaders() });
  }

  updateProperty(id: number, property: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/properties/${id}`, property, { headers: this.getHeaders() });
  }

  deleteProperty(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/properties/${id}`, { headers: this.getHeaders() });
  }

  submitContact(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/contacts`, data);
  }

  scheduleTour(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tours`, data);
  }

  subscribeNewsletter(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/newsletter`, { email });
  }
}
