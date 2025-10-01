-- Script para agregar la categoría "merienda" a la base de datos existente
-- Este script actualiza las restricciones de CHECK en la tabla dishes

-- 1. Eliminar la restricción anterior
ALTER TABLE dishes 
DROP CONSTRAINT IF EXISTS dishes_category_check;

-- 2. Agregar la nueva restricción con "merienda" incluida
ALTER TABLE dishes 
ADD CONSTRAINT dishes_category_check 
CHECK (category IN ('desayuno', 'merienda', 'almuerzo', 'cafe', 'cena'));

-- 3. Comentario para documentar el cambio
COMMENT ON CONSTRAINT dishes_category_check ON dishes 
IS 'Permite las categorías: desayuno, merienda (agregada), almuerzo, cafe, cena';

-- 4. Verificar que la restricción se aplicó correctamente
-- Puedes ejecutar esta consulta para confirmar:
-- SELECT constraint_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_name = 'dishes_category_check';