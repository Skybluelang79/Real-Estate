import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private key = 'dreamhomes_favorites';

  getFavorites(): number[] {
    return JSON.parse(localStorage.getItem(this.key) || '[]');
  }

  isFavorite(id: number): boolean {
    return this.getFavorites().includes(id);
  }

  toggle(id: number): boolean {
    let favs = this.getFavorites();
    if (favs.includes(id)) {
      favs = favs.filter(f => f !== id);
      localStorage.setItem(this.key, JSON.stringify(favs));
      return false;
    }
    favs.push(id);
    localStorage.setItem(this.key, JSON.stringify(favs));
    return true;
  }

  getCompare(): number[] {
    return JSON.parse(localStorage.getItem('dreamhomes_compare') || '[]');
  }

  isInCompare(id: number): boolean {
    return this.getCompare().includes(id);
  }

  toggleCompare(id: number): boolean {
    let list = this.getCompare();
    if (list.includes(id)) {
      list = list.filter(f => f !== id);
      localStorage.setItem('dreamhomes_compare', JSON.stringify(list));
      return false;
    }
    if (list.length >= 4) return false;
    list.push(id);
    localStorage.setItem('dreamhomes_compare', JSON.stringify(list));
    return true;
  }

  clearCompare(): void {
    localStorage.setItem('dreamhomes_compare', '[]');
  }
}
