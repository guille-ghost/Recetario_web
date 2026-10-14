import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentItem, PortalDataService, Recipe } from './portal-data.service';

type AdminTab = 'recetas' | 'catalogo' | 'bar';
interface RecipeForm {
  slug: string; titulo: string; equipo: string; carne: string; tiempoPrep: string; tiempoCoccion: string;
  porciones: number; imagen: string; descripcion: string; ingredientes: string; pasos: string;
  maridajeSalsas: string[]; maridajeEnsaladas: string[]; maridajeBebidas: string[];
}
interface ItemForm {
  slug: string; nombre: string; tipo: string; tiempoPrep: string; porciones: number;
  imagen: string; descripcion: string; ingredientes: string; pasos: string;
}
const blankRecipe = (): RecipeForm => ({ slug: '', titulo: '', equipo: '', carne: '', tiempoPrep: '', tiempoCoccion: '', porciones: 4, imagen: '', descripcion: '', ingredientes: '', pasos: '', maridajeSalsas: [], maridajeEnsaladas: [], maridajeBebidas: [] });
const blankItem = (): ItemForm => ({ slug: '', nombre: '', tipo: '', tiempoPrep: '', porciones: 1, imagen: '', descripcion: '', ingredientes: '', pasos: '' });

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (authState() === 'checking') { <main class="p-10 text-center text-ash">Comprobando sesión administrativa…</main> }
    @else if (authState() === 'login') {
      <main class="flex min-h-[80vh] items-center justify-center px-5 py-16"><section class="w-full max-w-md rounded-2xl border border-ember/20 bg-charcoal/95 p-8 shadow-xl">
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-gold">Acceso privado</p><h1 class="mb-3 font-display text-4xl">Panel de contenido</h1><p class="mb-7 text-sm text-ash">Solo el administrador autorizado puede editar recetas, salsas y bebidas.</p>
        <form (ngSubmit)="login()" class="space-y-4"><label class="block text-sm">Correo<input class="admin-input mt-1" type="email" name="email" autocomplete="username" required [(ngModel)]="email"></label><label class="block text-sm">Contraseña<input class="admin-input mt-1" type="password" name="password" autocomplete="current-password" required [(ngModel)]="password"></label><button class="primary-button w-full" [disabled]="busy()">{{ busy() ? 'Comprobando…' : 'Entrar al panel' }}</button>@if (message()) { <p role="alert" class="text-sm text-red-300">{{ message() }}</p> }</form>
      </section></main>
    }
    @else {
      <main class="mx-auto max-w-6xl px-5 py-10">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-4"><div><p class="mb-2 text-xs font-semibold uppercase tracking-widest text-ember">Panel del cocinero</p><h1 class="font-display text-4xl sm:text-5xl">Panel de contenido</h1></div><button class="secondary-button" type="button" (click)="logout()">Cerrar sesión</button></div>
        <p class="mb-7 text-ash">El contenido se guarda en Supabase y aparece para todos los visitantes.</p>
        <section class="mb-7 rounded-xl border border-ash/20 bg-smoke/70 p-5"><h2 class="mb-1 font-display text-xl text-ember">Respaldo de contenido</h2><p class="mb-4 text-xs text-ash">Exporta una copia JSON o restaura una copia guardada.</p><div class="flex flex-wrap gap-3"><button class="secondary-button" type="button" (click)="exportBackup()">Exportar respaldo JSON</button><label class="secondary-button cursor-pointer">Importar respaldo JSON<input class="hidden" type="file" accept="application/json" (change)="importBackup($event)"></label><button class="secondary-button" type="button" (click)="showDataCode()">Generar código para data.js</button></div></section>
        <nav class="mb-6 flex flex-wrap gap-2 border-b border-ash/20">@for (entry of tabs; track entry.id) { <button class="border-b-2 px-3 py-3 text-sm font-semibold" [class.tab-active]="tab() === entry.id" (click)="selectTab(entry.id)">{{ entry.label }}</button> }</nav>
        @if (message()) { <p role="status" class="mb-5 rounded-lg border px-4 py-3 text-sm" [class.border-red-800]="error()" [class.text-red-300]="error()" [class.border-green-800]="!error()" [class.text-green-300]="!error()">{{ message() }}</p> }
        @if (tab() === 'recetas') {
          <form (ngSubmit)="saveRecipe()" class="space-y-6">
            <section class="rounded-xl border border-ash/20 bg-smoke/70 p-5"><h2 class="mb-4 font-display text-xl text-ember">Datos de la receta</h2><div class="grid gap-4 sm:grid-cols-2">
              <label class="admin-field">Título *<input class="admin-input" required name="titulo" [(ngModel)]="recipeForm.titulo"></label>
              <label class="admin-field">Equipo *<select class="admin-input" required name="equipo" [(ngModel)]="recipeForm.equipo"><option value="">Selecciona…</option>@for (entry of objectEntries(data.manager.LABELS_EQUIPO); track entry[0]) { <option [value]="entry[0]">{{ entry[1] }}</option> }</select></label>
              <label class="admin-field">Proteína *<select class="admin-input" required name="carne" [(ngModel)]="recipeForm.carne"><option value="">Selecciona…</option>@for (entry of objectEntries(data.manager.LABELS_CARNE); track entry[0]) { <option [value]="entry[0]">{{ entry[1] }}</option> }</select></label>
              <label class="admin-field">Tiempo de preparación *<input class="admin-input" required name="tiempoPrep" [(ngModel)]="recipeForm.tiempoPrep"></label>
              <label class="admin-field">Tiempo de cocción *<input class="admin-input" required name="tiempoCoccion" [(ngModel)]="recipeForm.tiempoCoccion"></label>
              <label class="admin-field">Porciones *<input class="admin-input" required min="1" type="number" name="porciones" [(ngModel)]="recipeForm.porciones"></label>
              <label class="admin-field sm:col-span-2">URL de imagen<input class="admin-input" type="url" name="imagen" [(ngModel)]="recipeForm.imagen"></label>
              <label class="admin-field sm:col-span-2">Descripción *<textarea class="admin-input" required rows="3" name="descripcion" [(ngModel)]="recipeForm.descripcion"></textarea></label>
              <label class="admin-field sm:col-span-2">Ingredientes (uno por línea) *<textarea class="admin-input font-mono" required rows="6" name="ingredientes" [(ngModel)]="recipeForm.ingredientes"></textarea></label>
              <label class="admin-field sm:col-span-2">Pasos (uno por línea) *<textarea class="admin-input font-mono" required rows="6" name="pasos" [(ngModel)]="recipeForm.pasos"></textarea></label>
            </div></section>
            <section class="rounded-xl border border-ash/20 bg-smoke/70 p-5"><h2 class="mb-4 font-display text-xl text-ember">Maridaje</h2><div class="grid gap-4 sm:grid-cols-3">
              <label class="admin-field">Salsas<select class="admin-input min-h-32" multiple name="maridajeSalsas" [(ngModel)]="recipeForm.maridajeSalsas">@for (item of catalog(); track item.slug) { @if (item.tipo === 'salsa' || item.tipo === 'acompanamiento') { <option [value]="item.slug">{{ item.nombre }}</option> } }</select></label>
              <label class="admin-field">Ensaladas<select class="admin-input min-h-32" multiple name="maridajeEnsaladas" [(ngModel)]="recipeForm.maridajeEnsaladas">@for (item of catalog(); track item.slug) { @if (item.tipo === 'ensalada') { <option [value]="item.slug">{{ item.nombre }}</option> } }</select></label>
              <label class="admin-field">Bebidas<select class="admin-input min-h-32" multiple name="maridajeBebidas" [(ngModel)]="recipeForm.maridajeBebidas">@for (item of drinks(); track item.slug) { <option [value]="item.slug">{{ item.nombre }}</option> }</select></label>
            </div></section>
            <button class="primary-button" [disabled]="busy()">{{ busy() ? 'Guardando…' : recipeForm.slug ? 'Actualizar receta' : 'Guardar receta' }}</button>
          </form>
          <section class="mt-10"><h2 class="mb-4 font-display text-2xl">Todas las recetas</h2><div class="space-y-2">@for (item of recipes(); track item.slug) { <article class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ash/20 bg-smoke/70 px-4 py-3"><div><p>{{ item.titulo }}</p><p class="text-xs text-ash">{{ item.slug }}</p></div><div class="flex gap-4"><button class="text-ember" type="button" (click)="editRecipe(item)">Editar</button><button class="text-red-300" type="button" (click)="remove(item,'recipe')">Eliminar</button></div></article> } @empty { <p class="text-sm text-ash">No hay elementos para mostrar.</p> }</div></section>
        }
        @else {
          <form (ngSubmit)="saveItem()" class="space-y-6"><section class="rounded-xl border border-ash/20 bg-smoke/70 p-5"><h2 class="mb-4 font-display text-xl text-ember">{{ tab() === 'catalogo' ? 'Salsas y acompañamientos' : 'Bebidas' }}</h2><div class="grid gap-4 sm:grid-cols-2">
            <label class="admin-field">Nombre *<input class="admin-input" required name="nombre" [(ngModel)]="itemForm.nombre"></label>
            <label class="admin-field">Tipo *<select class="admin-input" required name="tipo" [(ngModel)]="itemForm.tipo"><option value="">Selecciona…</option>@for (entry of itemTypes(); track entry[0]) { <option [value]="entry[0]">{{ entry[1] }}</option> }</select></label>
            <label class="admin-field">Tiempo de preparación *<input class="admin-input" required name="tiempoPrep" [(ngModel)]="itemForm.tiempoPrep"></label>
            <label class="admin-field">Porciones *<input class="admin-input" required min="1" type="number" name="porciones" [(ngModel)]="itemForm.porciones"></label>
            <label class="admin-field sm:col-span-2">URL de imagen<input class="admin-input" type="url" name="imagen" [(ngModel)]="itemForm.imagen"></label>
            <label class="admin-field sm:col-span-2">Descripción *<textarea class="admin-input" required rows="3" name="descripcion" [(ngModel)]="itemForm.descripcion"></textarea></label>
            <label class="admin-field sm:col-span-2">Ingredientes<textarea class="admin-input font-mono" rows="5" name="ingredientes" [(ngModel)]="itemForm.ingredientes"></textarea></label>
            <label class="admin-field sm:col-span-2">Preparación<textarea class="admin-input font-mono" rows="6" name="pasos" [(ngModel)]="itemForm.pasos"></textarea></label>
          </div></section><button class="primary-button" [disabled]="busy()">{{ busy() ? 'Guardando…' : itemForm.slug ? 'Actualizar' : 'Guardar' }}</button></form>
          <section class="mt-10"><h2 class="mb-4 font-display text-2xl">{{ tab() === 'catalogo' ? 'Salsas y acompañamientos' : 'Bebidas' }}</h2><div class="space-y-2">@for (item of currentItems(); track item.slug) { <article class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ash/20 bg-smoke/70 px-4 py-3"><div><p>{{ item.nombre }}</p><p class="text-xs text-ash">{{ item.slug }} · {{ item.tipo }}</p></div><div class="flex gap-4"><button class="text-ember" type="button" (click)="editItem(item)">Editar</button><button class="text-red-300" type="button" (click)="remove(item,tab() === 'catalogo' ? 'catalog' : 'bar')">Eliminar</button></div></article> } @empty { <p class="text-sm text-ash">No hay elementos para mostrar.</p> }</div></section>
        }
      </main>
    }
  `,
})
export class AdminPage implements OnInit {
  private readonly portal = inject(PortalDataService);
  readonly data = this.portal;
  readonly authState = signal<'checking' | 'login' | 'authenticated'>('checking');
  readonly busy = signal(false);
  readonly error = signal(false);
  readonly message = signal('');
  readonly tab = signal<AdminTab>('recetas');
  readonly recipes = signal<Recipe[]>([]);
  readonly catalog = signal<ContentItem[]>([]);
  readonly drinks = signal<ContentItem[]>([]);
  readonly tabs = [{ id: 'recetas' as const, label: 'Recetas' }, { id: 'catalogo' as const, label: 'Salsas y acompañamientos' }, { id: 'bar' as const, label: 'Bebidas' }];
  email = '';
  password = '';
  recipeForm = blankRecipe();
  itemForm = blankItem();
  generatedCode = '';

  async ngOnInit(): Promise<void> {
    try {
      const response = await fetch('/api/admin', { credentials: 'include' });
      const data = await response.json();
      this.authState.set(data.authenticated ? 'authenticated' : 'login');
      if (data.authenticated) await this.refresh();
    } catch { this.authState.set('login'); }
  }

  async login(): Promise<void> {
    this.busy.set(true); this.message.set('');
    try {
      if (!window.supabaseClient) throw new Error('No está disponible la conexión de autenticación.');
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email: this.email.trim(), password: this.password });
      if (error) throw new Error(error.message);
      const response = await fetch('/api/admin', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: data.session?.access_token }) });
      const result = await response.json();
      if (!response.ok || !result.authenticated) throw new Error(result.error || 'La cuenta no está autorizada para administrar el sitio.');
      this.authState.set('authenticated');
      await this.refresh();
    } catch (error) { this.message.set(error instanceof Error ? error.message : 'No se pudo iniciar sesión.'); }
    finally { this.busy.set(false); }
  }

  async logout(): Promise<void> {
    try {
      await fetch('/api/admin', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
      await window.supabaseClient?.auth.signOut();
    } finally { this.authState.set('login'); }
  }

  async refresh(): Promise<void> {
    try {
      const [recipes, catalog, drinks] = await Promise.all([this.portal.recipes(), this.portal.catalog(), this.portal.bar()]);
      this.recipes.set(recipes); this.catalog.set(catalog); this.drinks.set(drinks);
    } catch (error) { this.error.set(true); this.message.set(error instanceof Error ? error.message : 'No se pudo cargar el contenido.'); }
  }

  selectTab(tab: AdminTab): void { this.tab.set(tab); this.recipeForm = blankRecipe(); this.itemForm = blankItem(); this.message.set(''); }
  objectEntries(value: Record<string, string>): Array<[string, string]> { return Object.entries(value); }
  itemTypes(): Array<[string, string]> { return this.tab() === 'catalogo' ? [['salsa', 'Salsa'], ['acompanamiento', 'Acompañamiento'], ['ensalada', 'Ensalada']] : [['coctel', 'Cóctel'], ['vino', 'Vino'], ['cerveza', 'Cerveza'], ['sin-alcohol', 'Sin alcohol']]; }
  currentItems(): ContentItem[] { return this.tab() === 'catalogo' ? this.catalog() : this.drinks(); }
  private lines(value: string): string[] { return value.split('\n').map(line => line.trim()).filter(Boolean); }

  async saveRecipe(): Promise<void> {
    this.busy.set(true); this.message.set('');
    try {
      const recipe = { ...this.recipeForm, slug: this.recipeForm.slug || this.portal.manager.generarSlug(this.recipeForm.titulo), ingredientes: this.lines(this.recipeForm.ingredientes), pasos: this.lines(this.recipeForm.pasos) } as Recipe;
      await this.portal.manager.guardarReceta(recipe); this.portal.invalidate('recipes'); this.recipeForm = blankRecipe(); this.message.set('Receta guardada correctamente.'); this.error.set(false); await this.refresh();
    } catch (error) { this.error.set(true); this.message.set(error instanceof Error ? error.message : 'No se pudo guardar la receta.'); }
    finally { this.busy.set(false); }
  }

  async saveItem(): Promise<void> {
    this.busy.set(true); this.message.set('');
    try {
      const item = { ...this.itemForm, slug: this.itemForm.slug || this.portal.manager.generarSlug(this.itemForm.nombre), ingredientes: this.lines(this.itemForm.ingredientes), pasos: this.lines(this.itemForm.pasos) } as ContentItem;
      if (this.tab() === 'catalogo') { await this.portal.manager.guardarCatalogoItem(item); this.portal.invalidate('catalogo'); }
      else { await this.portal.manager.guardarBarItem(item); this.portal.invalidate('bar'); }
      this.itemForm = blankItem(); this.message.set('Cambios guardados correctamente.'); this.error.set(false); await this.refresh();
    } catch (error) { this.error.set(true); this.message.set(error instanceof Error ? error.message : 'No se pudo guardar.'); }
    finally { this.busy.set(false); }
  }

  editRecipe(recipe: Recipe): void { this.tab.set('recetas'); this.recipeForm = { ...recipe, ingredientes: recipe.ingredientes.join('\n'), pasos: recipe.pasos.join('\n') }; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  editItem(item: ContentItem): void { this.itemForm = { ...blankItem(), ...item, ingredientes: item.ingredientes.join('\n'), pasos: item.pasos.join('\n') }; window.scrollTo({ top: 0, behavior: 'smooth' }); }

  async remove(item: ContentItem, kind: 'recipe' | 'catalog' | 'bar'): Promise<void> {
    if (!confirm(`¿Eliminar “${item.titulo || item.nombre}”? Esta acción no se puede deshacer.`)) return;
    try {
      if (kind === 'recipe') { await this.portal.manager.eliminarReceta(item.slug); this.portal.invalidate('recipes'); }
      else if (kind === 'catalog') { await this.portal.manager.eliminarCatalogoItem(item.slug); this.portal.invalidate('catalogo'); }
      else { await this.portal.manager.eliminarBarItem(item.slug); this.portal.invalidate('bar'); }
      this.message.set(`${item.titulo || item.nombre} eliminado.`); await this.refresh();
    } catch (error) { this.error.set(true); this.message.set(error instanceof Error ? error.message : 'No se pudo eliminar.'); }
  }

  async exportBackup(): Promise<void> {
    const [recipes, hiddenRecipes, catalog, hiddenCatalog, bar, hiddenBar] = await Promise.all([this.portal.manager.getRecetasUsuario(), this.portal.manager.getRecetasOcultas(), this.portal.manager.getCatalogoUsuario(), this.portal.manager.getCatalogoOcultas(), this.portal.manager.getBarUsuario(), this.portal.manager.getBarOcultas()]);
    const payload = { version: 1, fecha: new Date().toISOString(), recetas: recipes, recetasOcultas: hiddenRecipes, catalogo: catalog, catalogoOcultas: hiddenCatalog, bar, barOcultas: hiddenBar };
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })); link.download = `respaldo-fuego-real-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href);
  }

  async importBackup(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!confirm('Importar reemplazará los elementos personalizados en Supabase. ¿Continuar?')) return;
      await Promise.all([this.portal.manager.reemplazarRecetas(data.recetas || [], data.recetasOcultas || []), this.portal.manager.reemplazarCatalogo(data.catalogo || [], data.catalogoOcultas || []), this.portal.manager.reemplazarBar(data.bar || [], data.barOcultas || [])]);
      this.portal.invalidate('recipes', 'catalogo', 'bar'); this.message.set('Respaldo restaurado correctamente.'); await this.refresh();
    } catch (error) { this.error.set(true); this.message.set(error instanceof Error ? error.message : 'El archivo JSON no es un respaldo válido.'); }
  }

  async showDataCode(): Promise<void> {
    const [recipes, catalog, bar] = await Promise.all([this.portal.manager.getRecetasUsuario(), this.portal.manager.getCatalogoUsuario(), this.portal.manager.getBarUsuario()]);
    this.generatedCode = JSON.stringify({ recipes, catalog, bar }, null, 2);
    navigator.clipboard?.writeText(this.generatedCode).catch(() => undefined);
    this.message.set('Código copiado al portapapeles.');
  }
}
