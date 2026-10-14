import { Injectable } from '@angular/core';

export interface ContentItem {
  slug: string;
  nombre?: string;
  titulo?: string;
  descripcion: string;
  imagen?: string;
  tipo?: string;
  carne?: string;
  equipo?: string;
  tiempoPrep?: string;
  tiempoCoccion?: string;
  porciones?: number;
  ingredientes: string[];
  pasos: string[];
  es_personalizada?: boolean;
  eliminada?: boolean;
  [key: string]: unknown;
}

export interface Recipe extends ContentItem {
  titulo: string;
  equipo: string;
  carne: string;
  tiempoPrep: string;
  tiempoCoccion: string;
  porciones: number;
  imagen: string;
  maridajeSalsas: string[];
  maridajeEnsaladas: string[];
  maridajeBebidas: string[];
}

export interface DataManagerApi {
  LABELS_EQUIPO: Record<string, string>;
  LABELS_CARNE: Record<string, string>;
  LABELS_TIPO_CATALOGO: Record<string, string>;
  LABELS_TIPO_BAR: Record<string, string>;
  getRecetas(): Promise<Recipe[]>;
  getRecetaBySlug(slug: string): Promise<Recipe | null>;
  getCatalogo(): Promise<ContentItem[]>;
  getBar(): Promise<ContentItem[]>;
  guardarReceta(recipe: Recipe): Promise<unknown>;
  guardarCatalogoItem(item: ContentItem): Promise<unknown>;
  guardarBarItem(item: ContentItem): Promise<unknown>;
  eliminarReceta(slug: string): Promise<unknown>;
  eliminarCatalogoItem(slug: string): Promise<unknown>;
  eliminarBarItem(slug: string): Promise<unknown>;
  generarSlug(value: string): string;
  getRecetasUsuario(): Promise<Recipe[]>;
  getRecetasOcultas(): Promise<string[]>;
  getCatalogoUsuario(): Promise<ContentItem[]>;
  getCatalogoOcultas(): Promise<string[]>;
  getBarUsuario(): Promise<ContentItem[]>;
  getBarOcultas(): Promise<string[]>;
  reemplazarRecetas(items: Recipe[], hidden: string[]): Promise<void>;
  reemplazarCatalogo(items: ContentItem[], hidden: string[]): Promise<void>;
  reemplazarBar(items: ContentItem[], hidden: string[]): Promise<void>;
}

interface SupabaseAuthClient {
  auth: {
    signInWithPassword(credentials: { email: string; password: string }): Promise<{
      data: { session: { access_token: string } | null };
      error: { message: string } | null;
    }>;
    signOut(): Promise<unknown>;
  };
}

declare global {
  interface Window {
    DataManager: DataManagerApi;
    supabaseClient?: SupabaseAuthClient;
  }
}

@Injectable({ providedIn: 'root' })
export class PortalDataService {
  private readonly prefix = 'portal-content:';
  private readonly ttl = 120_000;

  get manager(): DataManagerApi {
    return window.DataManager;
  }

  recipes(): Promise<Recipe[]> {
    return this.cached('recipes', () => this.manager.getRecetas());
  }

  catalog(): Promise<ContentItem[]> {
    return this.cached('catalogo', () => this.manager.getCatalogo());
  }

  bar(): Promise<ContentItem[]> {
    return this.cached('bar', () => this.manager.getBar());
  }

  recipe(slug: string): Promise<Recipe | null> {
    return this.recipes().then(items => items.find(item => item.slug === slug) ?? null);
  }

  invalidate(...keys: string[]): void {
    for (const key of keys) sessionStorage.removeItem(`${this.prefix}${key}`);
  }

  private async cached<T extends ContentItem>(key: string, load: () => Promise<T[]>): Promise<T[]> {
    const cacheKey = `${this.prefix}${key}`;
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null') as { items?: T[]; savedAt?: number } | null;
      if (cached?.items && Date.now() - (cached.savedAt ?? 0) < this.ttl) {
        void load().then(items => this.write(cacheKey, items)).catch(() => undefined);
        return cached.items;
      }
    } catch {
      sessionStorage.removeItem(cacheKey);
    }
    const items = await load();
    this.write(cacheKey, items);
    return items;
  }

  private write<T>(key: string, items: T[]): void {
    try {
      sessionStorage.setItem(key, JSON.stringify({ items, savedAt: Date.now() }));
    } catch {
      // Session storage can be unavailable in private browsing contexts.
    }
  }
}
