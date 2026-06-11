-- Fix numeric overflow for large project budgets in kpi_details (MySQL)
ALTER TABLE kpi_details MODIFY COLUMN value DECIMAL(20, 2);
