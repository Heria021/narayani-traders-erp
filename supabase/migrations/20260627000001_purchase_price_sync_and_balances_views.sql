-- =============================================================================
-- MIGRATION: purchase price sync + receivables/payables balance views
-- =============================================================================

-- =============================================================================
-- TRIGGER: sync products.purchase_price / box_purchase_price
-- from purchase_items on fresh INSERT only.
-- =============================================================================

create or replace function sync_product_purchase_price()
returns trigger
language plpgsql
security invoker
as $$
begin
  if new.buy_mode = 'unit' then
    -- unit_price was paid per base unit — update purchase_price directly
    update products
    set purchase_price = new.unit_price
    where id = new.product_id;

  elsif new.buy_mode = 'box' then
    -- unit_price here is price per box — update box_purchase_price,
    -- and also back-derive the equivalent per-unit purchase_price
    -- so unit-mode sales/cost snapshots stay correct too
    update products
    set box_purchase_price = new.unit_price,
        purchase_price     = case
                                when units_per_box > 0
                                  then new.unit_price / units_per_box
                                else purchase_price
                              end
    where id = new.product_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_product_purchase_price on purchase_items;

create trigger trg_sync_product_purchase_price
  after insert on purchase_items
  for each row execute function sync_product_purchase_price();


-- =============================================================================
-- CUSTOMER BALANCES (view) — mirrors supplier_balances
-- =============================================================================

create or replace view customer_balances as
select
  c.id,
  c.name,
  c.phone,
  c.email,
  c.address,
  c.city,
  c.state,
  c.postal_code,
  c.gstin,
  c.opening_balance,
  c.created_at,
  c.updated_at,

  coalesce(s.total_billed, 0)::numeric(12,2)        as total_billed,
  coalesce(p.total_paid, 0)::numeric(12,2)          as total_paid,
  coalesce(p.unapplied_advance, 0)::numeric(12,2)   as unapplied_advance,

  -- net position: +ve = customer owes you
  (c.opening_balance + coalesce(s.total_billed, 0) - coalesce(p.total_paid, 0))
    ::numeric(12,2) as amount_owed

from customers c
left join (
  select customer_id, sum(grand_total) as total_billed
  from sales
  group by customer_id
) s on s.customer_id = c.id
left join (
  select
    customer_id,
    sum(amount) as total_paid,
    sum(amount) filter (where sale_id is null) as unapplied_advance
  from payments
  group by customer_id
) p on p.customer_id = c.id;

comment on view customer_balances is
  'Receivables per customer. amount_owed = opening_balance + total_billed − total_paid.
   unapplied_advance = payments not yet linked to a specific sale.';

grant select on customer_balances to authenticated;


-- =============================================================================
-- SUPPLIER BALANCES (view) — updated to also surface unapplied advances
-- Must DROP + CREATE: CREATE OR REPLACE cannot insert a new column before
-- amount_owed on an existing view (Postgres treats it as a rename).
-- =============================================================================

drop view if exists supplier_balances;

create view supplier_balances as
select
  s.id,
  s.name,
  s.phone,
  s.email,
  s.address,
  s.city,
  s.state,
  s.postal_code,
  s.gstin,
  s.opening_balance,
  s.created_at,
  s.updated_at,

  coalesce(p.total_purchased, 0)::numeric(12,2)      as total_purchased,
  coalesce(sp.total_paid, 0)::numeric(12,2)          as total_paid,
  coalesce(sp.unapplied_advance, 0)::numeric(12,2)   as unapplied_advance,

  -- net position: +ve = you owe the supplier
  (s.opening_balance + coalesce(p.total_purchased, 0) - coalesce(sp.total_paid, 0))
    ::numeric(12,2) as amount_owed

from suppliers s
left join (
  select supplier_id, sum(grand_total) as total_purchased
  from purchases
  group by supplier_id
) p on p.supplier_id = s.id
left join (
  select
    supplier_id,
    sum(amount) as total_paid,
    sum(amount) filter (where purchase_id is null) as unapplied_advance
  from supplier_payments
  group by supplier_id
) sp on sp.supplier_id = s.id;

comment on view supplier_balances is
  'Payables per supplier. amount_owed = opening_balance + total_purchased − total_paid.
   unapplied_advance = supplier_payments not yet linked to a specific purchase.';

grant select on supplier_balances to authenticated;
