-- Fix numeric overflow for large project budgets in kpi_details
ALTER TABLE kpi_details ALTER COLUMN value TYPE DECIMAL(20, 2);
