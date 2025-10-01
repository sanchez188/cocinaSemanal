# 🚀 Guía de Migración a Supabase

## Paso 1: Crear las tablas en Supabase

1. Ve al dashboard de Supabase: https://supabase.com/dashboard
2. Abre tu proyecto: `mxapjkgiahbcrdyzeout`
3. Ve a **SQL Editor**
4. Crea una nueva query
5. Copia y pega todo el contenido del archivo `database_migration_postgresql.sql`
6. Ejecuta la query (botón RUN)

## Paso 2: Verificar las tablas

Después de ejecutar el SQL, verifica que se crearon las siguientes tablas:

- ✅ ingredients
- ✅ dishes
- ✅ dish_ingredients
- ✅ weekly_menus
- ✅ weekly_menu_dishes
- ✅ menu_warnings
- ✅ shopping_lists
- ✅ shopping_items
- ✅ purchases
- ✅ purchase_items
- ✅ predefined_menus
- ✅ predefined_menu_dishes
- ✅ inventory_items

## Paso 3: Migrar los datos

1. Ejecuta tu aplicación Angular: `ng serve`
2. Ve a la pestaña **"Migración DB"**
3. Verifica los contadores de datos en Dexie (local)
4. Descarga un respaldo (recomendado)
5. Haz clic en **"Iniciar migración"**
6. Espera a que complete (puede tomar varios minutos)

## Paso 4: Verificar la migración

Después de completar la migración:

1. Verifica que los contadores de Supabase coincidan con Dexie
2. Ve al dashboard de Supabase → **Table Editor** para revisar los datos
3. Prueba la funcionalidad básica de la aplicación

## Paso 5: Actualizar servicios (Opcional)

Para completar la migración, puedes actualizar tus servicios existentes para usar Supabase en lugar de Dexie:

### Ejemplo para inventory.service.ts:

```typescript
// Reemplaza las llamadas a Dexie con Supabase
constructor(private supabaseService: SupabaseService) {}

async loadInventory() {
  const ingredients = await this.supabaseService.getIngredients();
  this.inventorySignal.set(ingredients);
}

async addIngredient(ingredient: Ingredient) {
  const success = await this.supabaseService.addIngredient(ingredient);
  if (success) {
    await this.loadInventory(); // Recargar desde Supabase
  }
  return success;
}
```

## Configuración adicional

### Variables de entorno ya configuradas:

- URL: `https://mxapjkgiahbcrdyzeout.supabase.co`
- Anon Key: Configurada en environments

### Servicios creados:

- ✅ `SupabaseService` - Cliente para todas las operaciones
- ✅ `MigrationService` - Herramientas de migración
- ✅ `MigrationComponent` - Interfaz de migración

## Beneficios de usar Supabase

- 🌐 **Sincronización en tiempo real** entre dispositivos
- 📱 **Acceso desde cualquier dispositivo** con internet
- 🔒 **Respaldos automáticos** en la nube
- ⚡ **Mejor performance** con índices PostgreSQL
- 🔧 **Escalabilidad** automática
- 🛡️ **Seguridad** a nivel de base de datos

## Troubleshooting

### Error: "Failed to create table"

- Verifica que tengas permisos de administrador en Supabase
- Revisa la consola de errores en SQL Editor

### Error: "Migration failed"

- Verifica tu conexión a internet
- Revisa la consola del navegador para detalles
- Asegúrate de que las tablas existen en Supabase

### Error: "Cannot find ingredients"

- Verifica que ejecutaste el SQL completo (incluyendo los datos iniciales)
- Ve a Table Editor → ingredients para verificar datos

## Siguiente paso: ¡Disfruta tu app en la nube! 🎉

Una vez completada la migración, tu aplicación estará usando PostgreSQL en Supabase y tendrás acceso a todas las funcionalidades avanzadas de una base de datos en la nube.
