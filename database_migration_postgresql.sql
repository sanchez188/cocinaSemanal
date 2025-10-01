-- ============================================================================
-- MIGRACIÓN DE DEXIE A POSTGRESQL PARA COCINA SEMANAL
-- ============================================================================
-- Este archivo contiene todas las definiciones de tablas, índices, relaciones
-- y datos iniciales equivalentes a la estructura Dexie actual
-- ============================================================================

-- Crear extensión para UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsquedas de texto mejoradas

-- ============================================================================
-- TABLA: ingredients (Ingredientes)
-- ============================================================================
CREATE TABLE ingredients (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL,
    is_package BOOLEAN DEFAULT FALSE,
    price_total DECIMAL(10,2) DEFAULT NULL, -- Para items que se manejan por paquete
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para ingredients
CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_ingredients_name_trgm ON ingredients USING gin(name gin_trgm_ops);

-- ============================================================================
-- TABLA: dishes (Platos/Recetas)
-- ============================================================================
CREATE TABLE dishes (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('desayuno', 'almuerzo', 'cafe', 'cena')),
    servings INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para dishes
CREATE INDEX idx_dishes_name ON dishes(name);
CREATE INDEX idx_dishes_category ON dishes(category);
CREATE INDEX idx_dishes_name_trgm ON dishes USING gin(name gin_trgm_ops);

-- ============================================================================
-- TABLA: dish_ingredients (Relación Many-to-Many entre platos e ingredientes)
-- ============================================================================
CREATE TABLE dish_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dish_id VARCHAR(255) NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    ingredient_id VARCHAR(255) NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity DECIMAL(10,3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(dish_id, ingredient_id)
);

-- Índices para dish_ingredients
CREATE INDEX idx_dish_ingredients_dish_id ON dish_ingredients(dish_id);
CREATE INDEX idx_dish_ingredients_ingredient_id ON dish_ingredients(ingredient_id);

-- ============================================================================
-- TABLA: weekly_menus (Menús Semanales)
-- ============================================================================
CREATE TABLE weekly_menus (
    id VARCHAR(255) PRIMARY KEY,
    week DATE NOT NULL, -- Fecha del lunes de la semana (YYYY-MM-DD)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(week)
);

-- Índices para weekly_menus
CREATE INDEX idx_weekly_menus_week ON weekly_menus(week);

-- ============================================================================
-- TABLA: weekly_menu_dishes (Platos asignados a días específicos del menú)
-- ============================================================================
CREATE TABLE weekly_menu_dishes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    weekly_menu_id VARCHAR(255) NOT NULL REFERENCES weekly_menus(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')),
    dish_id VARCHAR(255) NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    meal_order INTEGER DEFAULT 1, -- Para ordenar múltiples platos en el mismo día
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para weekly_menu_dishes
CREATE INDEX idx_weekly_menu_dishes_menu_id ON weekly_menu_dishes(weekly_menu_id);
CREATE INDEX idx_weekly_menu_dishes_day ON weekly_menu_dishes(day_of_week);
CREATE INDEX idx_weekly_menu_dishes_dish_id ON weekly_menu_dishes(dish_id);

-- ============================================================================
-- TABLA: menu_warnings (Advertencias del menú semanal)
-- ============================================================================
CREATE TABLE menu_warnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    weekly_menu_id VARCHAR(255) NOT NULL REFERENCES weekly_menus(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')),
    meal_category VARCHAR(50) NOT NULL CHECK (meal_category IN ('desayuno', 'almuerzo', 'cafe', 'cena')),
    dish_id VARCHAR(255) NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    warnings JSONB NOT NULL, -- Array de strings con las advertencias
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para menu_warnings
CREATE INDEX idx_menu_warnings_menu_id ON menu_warnings(weekly_menu_id);
CREATE INDEX idx_menu_warnings_day ON menu_warnings(day_of_week);

-- ============================================================================
-- TABLA: shopping_lists (Listas de Compras)
-- ============================================================================
CREATE TABLE shopping_lists (
    id VARCHAR(255) PRIMARY KEY,
    week_id VARCHAR(255) NOT NULL REFERENCES weekly_menus(id) ON DELETE CASCADE,
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(week_id)
);

-- Índices para shopping_lists
CREATE INDEX idx_shopping_lists_week_id ON shopping_lists(week_id);
CREATE INDEX idx_shopping_lists_completed ON shopping_lists(completed);

-- ============================================================================
-- TABLA: shopping_items (Items de las Listas de Compras)
-- ============================================================================
CREATE TABLE shopping_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shopping_list_id VARCHAR(255) NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    ingredient_id VARCHAR(255) NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- Nombre del ingrediente (desnormalizado para histórico)
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    purchased BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para shopping_items
CREATE INDEX idx_shopping_items_list_id ON shopping_items(shopping_list_id);
CREATE INDEX idx_shopping_items_ingredient_id ON shopping_items(ingredient_id);
CREATE INDEX idx_shopping_items_purchased ON shopping_items(purchased);

-- ============================================================================
-- TABLA: purchases (Compras Realizadas)
-- ============================================================================
CREATE TABLE purchases (
    id VARCHAR(255) PRIMARY KEY,
    week_id VARCHAR(255) NOT NULL REFERENCES weekly_menus(id) ON DELETE CASCADE,
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para purchases
CREATE INDEX idx_purchases_week_id ON purchases(week_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date);

-- ============================================================================
-- TABLA: purchase_items (Items de las Compras)
-- ============================================================================
CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id VARCHAR(255) NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    ingredient_id VARCHAR(255) NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- Nombre del ingrediente (desnormalizado para histórico)
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para purchase_items
CREATE INDEX idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_ingredient_id ON purchase_items(ingredient_id);

-- ============================================================================
-- TABLA: predefined_menus (Menús Predefinidos)
-- ============================================================================
CREATE TABLE predefined_menus (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para predefined_menus
CREATE INDEX idx_predefined_menus_name ON predefined_menus(name);
CREATE INDEX idx_predefined_menus_name_trgm ON predefined_menus USING gin(name gin_trgm_ops);

-- ============================================================================
-- TABLA: predefined_menu_dishes (Platos de los Menús Predefinidos)
-- ============================================================================
CREATE TABLE predefined_menu_dishes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    predefined_menu_id VARCHAR(255) NOT NULL REFERENCES predefined_menus(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')),
    dish_id VARCHAR(255) NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    meal_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para predefined_menu_dishes
CREATE INDEX idx_predefined_menu_dishes_menu_id ON predefined_menu_dishes(predefined_menu_id);
CREATE INDEX idx_predefined_menu_dishes_day ON predefined_menu_dishes(day_of_week);

-- ============================================================================
-- TABLA: inventory_items (Inventario - para compatibilidad con db.service.ts)
-- ============================================================================
-- Nota: Esta tabla parece ser un duplicado simplificado de ingredients
-- Se mantiene para compatibilidad, pero se recomienda usar ingredients
CREATE TABLE inventory_items (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dishes_updated_at BEFORE UPDATE ON dishes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weekly_menus_updated_at BEFORE UPDATE ON weekly_menus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON shopping_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predefined_menus_updated_at BEFORE UPDATE ON predefined_menus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DATOS INICIALES (SEED DATA)
-- ============================================================================

-- Insertar ingredientes iniciales
INSERT INTO ingredients (id, name, quantity, unit, price_per_unit, category, is_package, price_total) VALUES
('arroz-001', 'Arroz', 1, 'kg', 0, 'cereales', FALSE, NULL),
('frijoles-001', 'Frijoles', 1, 'kg', 0, 'cereales', FALSE, NULL),
('harina-001', 'Harina', 1, 'kg', 0, 'cereales', FALSE, NULL),
('cereal-001', 'Cereal', 1, 'paquete', 0, 'cereales', TRUE, 0),
('leche-nido-001', 'Leche Nido', 1, 'Latas', 0, 'lacteos', FALSE, NULL),
('leche-001', 'Leche', 1, 'litro', 0, 'lacteos', FALSE, NULL),
('queso-001', 'Queso', 1, 'kg', 0, 'lacteos', FALSE, NULL),
('queso-crema-001', 'Queso crema', 1, 'paquete', 0, 'lacteos', TRUE, 0),
('jamon-001', 'Jamón', 1, 'paquete', 0, 'carnes', TRUE, 0),
('atun-vegetales-001', 'Atún con vegetales', 4, 'Latas', 0, 'carnes', FALSE, NULL),
('atun-azul-001', 'Atún azul', 2, 'Latas', 0, 'carnes', FALSE, NULL),
('zanahoria-001', 'Zanahoria', 1, 'kg', 0, 'verduras', FALSE, NULL),
('repollo-001', 'Repollo', 1, 'unidad', 0, 'verduras', FALSE, NULL),
('maiz-dulce-001', 'Maíz dulce', 1, 'Latas', 0, 'verduras', FALSE, NULL),
('bananos-001', 'Bananos', 1, 'unidad', 0, 'frutas', FALSE, NULL),
('uvas-verdes-001', 'Uvas verdes', 1, 'kg', 0, 'frutas', FALSE, NULL),
('tostada-integral-001', 'Tostada integral', 1, 'paquete', 0, 'cereales', TRUE, 0),
('royal-001', 'Royal', 1, 'paquete', 0, 'otros', TRUE, 0),
('frijoles-sin-picante-001', 'Frijoles molidos Sin picante', 1, 'paquete', 0, 'cereales', TRUE, 0),
('frijoles-picantes-001', 'Frijoles molidos picantes', 1, 'paquete', 0, 'cereales', TRUE, 0),
('papel-higienico-001', 'Papel higiénico', 1, 'paquete', 0, 'limpieza', TRUE, 0),
('galleta-maria-001', 'Galleta María', 1, 'paquete', 0, 'galletas', TRUE, 0),
('club-soda-001', 'Club soda', 1, 'paquete', 0, 'galletas', TRUE, 0),
('galleta-avena-001', 'Galleta de Avena', 1, 'paquete', 0, 'galletas', TRUE, 0),
('galleta-dulce-001', 'Galleta dulce', 1, 'paquete', 0, 'galletas', TRUE, 0),
('aceite-001', 'Aceite', 1, 'litro', 0, 'otros', FALSE, NULL),
('huevos-001', 'Huevos', 12, 'unidad', 0, 'lacteos', FALSE, NULL),
('pollo-001', 'Pollo', 1, 'kg', 0, 'carnes', FALSE, NULL);

-- Insertar platos iniciales
INSERT INTO dishes (id, name, category, servings) VALUES
('dish-001', 'Huevos Revueltos', 'desayuno', 2),
('dish-002', 'Arroz con Pollo', 'almuerzo', 4),
('dish-003', 'Café con Galletas', 'cafe', 1),
('dish-004', 'Frijoles con Arroz', 'cena', 2);

-- Insertar ingredientes de los platos
INSERT INTO dish_ingredients (dish_id, ingredient_id, quantity) VALUES
('dish-001', 'huevos-001', 3),
('dish-001', 'aceite-001', 0.01),
('dish-002', 'arroz-001', 0.25),
('dish-002', 'pollo-001', 0.4),
('dish-002', 'aceite-001', 0.02),
('dish-003', 'galleta-maria-001', 0.1),
('dish-004', 'frijoles-001', 0.2),
('dish-004', 'arroz-001', 0.15);

-- ============================================================================
-- VISTAS ÚTILES PARA LA APLICACIÓN
-- ============================================================================

-- Vista para obtener platos con sus ingredientes
CREATE VIEW dish_details AS
SELECT 
    d.id,
    d.name,
    d.category,
    d.servings,
    d.created_at,
    d.updated_at,
    json_agg(
        json_build_object(
            'ingredientId', di.ingredient_id,
            'ingredientName', i.name,
            'quantity', di.quantity,
            'unit', i.unit
        ) ORDER BY i.name
    ) AS ingredients
FROM dishes d
LEFT JOIN dish_ingredients di ON d.id = di.dish_id
LEFT JOIN ingredients i ON di.ingredient_id = i.id
GROUP BY d.id, d.name, d.category, d.servings, d.created_at, d.updated_at;

-- Vista para menús semanales con platos
CREATE VIEW weekly_menu_details AS
SELECT 
    wm.id,
    wm.week,
    wm.created_at,
    wm.updated_at,
    json_object_agg(
        wmd.day_of_week,
        json_agg(
            json_build_object(
                'id', d.id,
                'name', d.name,
                'category', d.category,
                'servings', d.servings
            ) ORDER BY wmd.meal_order
        )
    ) AS days
FROM weekly_menus wm
LEFT JOIN weekly_menu_dishes wmd ON wm.id = wmd.weekly_menu_id
LEFT JOIN dishes d ON wmd.dish_id = d.id
GROUP BY wm.id, wm.week, wm.created_at, wm.updated_at;

-- Vista para listas de compras con items
CREATE VIEW shopping_list_details AS
SELECT 
    sl.id,
    sl.week_id,
    sl.total_cost,
    sl.completed,
    sl.created_at,
    sl.updated_at,
    json_agg(
        json_build_object(
            'ingredientId', si.ingredient_id,
            'name', si.name,
            'quantity', si.quantity,
            'unit', si.unit,
            'pricePerUnit', si.price_per_unit,
            'purchased', si.purchased
        ) ORDER BY si.name
    ) AS items
FROM shopping_lists sl
LEFT JOIN shopping_items si ON sl.id = si.shopping_list_id
GROUP BY sl.id, sl.week_id, sl.total_cost, sl.completed, sl.created_at, sl.updated_at;

-- ============================================================================
-- FUNCIONES ÚTILES
-- ============================================================================

-- Función para calcular el costo total de una lista de compras
CREATE OR REPLACE FUNCTION calculate_shopping_list_total(list_id VARCHAR(255))
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(quantity * price_per_unit), 0)
    INTO total
    FROM shopping_items
    WHERE shopping_list_id = list_id;
    
    UPDATE shopping_lists 
    SET total_cost = total, updated_at = CURRENT_TIMESTAMP
    WHERE id = list_id;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular el costo total de una compra
CREATE OR REPLACE FUNCTION calculate_purchase_total(purchase_id VARCHAR(255))
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(total_price), 0)
    INTO total
    FROM purchase_items
    WHERE purchase_id = purchase_id;
    
    UPDATE purchases 
    SET total_cost = total
    WHERE id = purchase_id;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTARIOS FINALES
-- ============================================================================

/*
NOTAS PARA LA MIGRACIÓN:

1. ESTRUCTURA DE DATOS:
   - Se mantiene compatibilidad con los IDs string de Dexie
   - Se añaden campos created_at/updated_at para auditoría
   - Se normalizan las relaciones many-to-many (dish_ingredients)
   - Se separan los días del menú en tabla independiente

2. MEJORAS SOBRE DEXIE:
   - Integridad referencial con foreign keys
   - Índices para mejor performance
   - Vistas para consultas complejas comunes
   - Triggers automáticos para updated_at
   - Funciones para cálculos complejos

3. COMPATIBILIDAD:
   - Los IDs mantienen el mismo formato string
   - La estructura JSON de days se puede recrear con las vistas
   - Se mantienen todos los campos originales

4. PASOS SIGUIENTES:
   - Instalar Supabase client en Angular
   - Crear servicio de migración desde Dexie
   - Actualizar servicios para usar PostgreSQL
   - Implementar sincronización offline si es necesaria
*/