import { Routes } from '@angular/router';
import { AdminPage } from './admin-page.component';
import { CollectionPage, HomePage, RecipeDetailPage, RecipeListPage } from './pages';

export const routes: Routes = [
	{ path: '', component: HomePage },
	{ path: 'recetario', component: RecipeListPage },
	{ path: 'receta', component: RecipeDetailPage },
	{ path: 'catalogo', component: CollectionPage, data: { kind: 'catalogo' } },
	{ path: 'bar', component: CollectionPage, data: { kind: 'bar' } },
	{ path: 'admin', component: AdminPage },
	{ path: 'admin-panel', redirectTo: 'admin', pathMatch: 'full' },
	{ path: 'admin-login', redirectTo: 'admin', pathMatch: 'full' },
	{ path: 'admin.html', redirectTo: 'admin', pathMatch: 'full' },
	{ path: '**', redirectTo: '' },
];
