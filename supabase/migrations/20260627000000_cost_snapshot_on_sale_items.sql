-- =============================================================================
-- MIGRATION: cost snapshot on sale_items (for accurate profit tracking)
-- Safe to re-run: skips steps already applied.
-- =============================================================================

-- 1. Add the column (nullable first — backfill, then lock down)
alter table sale_items
  add column if not exists cost_price_at_sale numeric(12,2);

comment on column sale_items.cost_price_at_sale is
  'Snapshot of the product''s per-unit cost (base units) at the moment of sale.
   Captured from products.purchase_price (or box_purchase_price / units_per_box
   if sold in box mode). Never recalculated after insert — protects historical
   profit accuracy even if purchase_price changes later.';

-- 2. Backfill existing rows using current products.purchase_price
--    (best-effort — historical accuracy for old rows is approximate,
--     since we don't have cost history before this migration)
update sale_items si
set cost_price_at_sale = coalesce(
  case
    when si.sell_mode = 'box' and p.units_per_box is not null and p.box_purchase_price is not null
      then p.box_purchase_price / p.units_per_box
    else p.purchase_price
  end,
  0
)
from products p
where p.id = si.product_id
  and si.cost_price_at_sale is null;

-- 3. Make it mandatory going forward (after backfill confirms clean data)
alter table sale_items
  alter column cost_price_at_sale set not null;

alter table sale_items
  drop constraint if exists chk_cost_price_at_sale_nonneg;

alter table sale_items
  add constraint chk_cost_price_at_sale_nonneg check (cost_price_at_sale >= 0);


-- =============================================================================
-- Trigger: auto-populate cost_price_at_sale on every new sale_items insert
-- so the app layer doesn't have to remember to set it manually.
-- =============================================================================

create or replace function set_cost_price_at_sale()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_purchase_price     numeric(12,2);
  v_box_purchase_price numeric(12,2);
  v_units_per_box      integer;
begin
  -- If the app already supplied a cost (e.g. manual override), respect it
  if new.cost_price_at_sale is not null then
    return new;
  end if;

  select purchase_price, box_purchase_price, units_per_box
  into v_purchase_price, v_box_purchase_price, v_units_per_box
  from products
  where id = new.product_id;

  if new.sell_mode = 'box' and v_units_per_box is not null and v_box_purchase_price is not null then
    new.cost_price_at_sale := v_box_purchase_price / v_units_per_box;
  else
    new.cost_price_at_sale := coalesce(v_purchase_price, 0);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sale_items_cost_snapshot on sale_items;

create trigger trg_sale_items_cost_snapshot
  before insert on sale_items
  for each row execute function set_cost_price_at_sale();
