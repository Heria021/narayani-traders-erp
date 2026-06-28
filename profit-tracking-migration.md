# Narayani Traders ERP — Accurate Profit Tracking

## Problem

`sale_items` records `unit_price` (what you sold at) but never the cost at
the time of sale. `products.purchase_price` is a **live snapshot** — it
changes every time you record a new purchase at a different price. So any
profit query that joins `sale_items` → `products.purchase_price` today is
silently using **today's cost** against **last month's sale**, which is
wrong the moment a supplier changes their price.

Fix: snapshot the cost onto the line item at the moment the sale is made.
Profit then becomes a stored, point-in-time-correct calculation forever —
even if purchase prices move around later.

---

## Part 1 — Migration

```sql
-- =============================================================================
-- MIGRATION: cost snapshot on sale_items (for accurate profit tracking)
-- Run once in: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- =============================================================================

-- 1. Add the column (nullable first — backfill, then optionally lock down)
alter table sale_items
  add column cost_price_at_sale numeric(12,2);

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
  -- box mode: derive per-unit cost from box_purchase_price / units_per_box
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

create trigger trg_sale_items_cost_snapshot
  before insert on sale_items
  for each row execute function set_cost_price_at_sale();
```

**Notes**

- After this migration, `cost_price_at_sale` is always in **per-base-unit**
  terms — same convention as `quantity`, so `quantity * cost_price_at_sale`
  always gives the correct line cost regardless of unit/box mode.
- The trigger only fills the value if the app didn't already supply one —
  so if you ever want to override cost manually (e.g. a one-off discount
  purchase), the app can still pass it explicitly.
- Old rows backfilled in step 2 are an approximation (we don't have true
  historical cost before this point) — everything inserted after the
  migration is fully accurate.

---

## Part 2 — Profit Queries

### A. Per-line profit (the building block)

```sql
select
  si.id              as sale_item_id,
  si.sale_id,
  si.product_id,
  si.sell_mode,
  si.quantity,
  si.box_count,
  si.unit_price,
  si.cost_price_at_sale,
  (case
    when si.sell_mode = 'box' then si.box_count * si.unit_price
    else si.quantity * si.unit_price
  end) as revenue,
  si.quantity * si.cost_price_at_sale as cost,
  (case
    when si.sell_mode = 'box' then si.box_count * si.unit_price
    else si.quantity * si.unit_price
  end) - (si.quantity * si.cost_price_at_sale) as profit
from sale_items si;
```

### B. Overall profit (all-time)

```sql
select
  count(distinct si.sale_id) as total_sales,
  sum(case
    when si.sell_mode = 'box' then si.box_count * si.unit_price
    else si.quantity * si.unit_price
  end) as total_revenue,
  sum(si.quantity * si.cost_price_at_sale) as total_cost,
  sum(
    (case
      when si.sell_mode = 'box' then si.box_count * si.unit_price
      else si.quantity * si.unit_price
    end) - (si.quantity * si.cost_price_at_sale)
  ) as total_profit,
  round(
    sum(
      (case
        when si.sell_mode = 'box' then si.box_count * si.unit_price
        else si.quantity * si.unit_price
      end) - (si.quantity * si.cost_price_at_sale)
    )
    / nullif(sum(case
        when si.sell_mode = 'box' then si.box_count * si.unit_price
        else si.quantity * si.unit_price
      end), 0) * 100, 2
  ) as profit_margin_pct
from sale_items si;
```

### C. Profit per invoice (drives the Sales list "Profit" column)

```sql
select
  si.sale_id,
  sum(case
    when si.sell_mode = 'box' then si.box_count * si.unit_price
    else si.quantity * si.unit_price
  end) as revenue,
  sum(si.quantity * si.cost_price_at_sale) as cost,
  sum(
    (case
      when si.sell_mode = 'box' then si.box_count * si.unit_price
      else si.quantity * si.unit_price
    end) - (si.quantity * si.cost_price_at_sale)
  ) as profit
from sale_items si
group by si.sale_id;
```

### D. Profit per product

```sql
select
  p.id as product_id,
  p.name,
  p.sku,
  sum(si.quantity) as units_sold,
  sum(case
    when si.sell_mode = 'box' then si.box_count * si.unit_price
    else si.quantity * si.unit_price
  end) as revenue,
  sum(si.quantity * si.cost_price_at_sale) as cost,
  sum(
    (case
      when si.sell_mode = 'box' then si.box_count * si.unit_price
      else si.quantity * si.unit_price
    end) - (si.quantity * si.cost_price_at_sale)
  ) as profit,
  round(
    sum(
      (case
        when si.sell_mode = 'box' then si.box_count * si.unit_price
        else si.quantity * si.unit_price
      end) - (si.quantity * si.cost_price_at_sale)
    )
    / nullif(sum(case
        when si.sell_mode = 'box' then si.box_count * si.unit_price
        else si.quantity * si.unit_price
      end), 0) * 100, 2
  ) as profit_margin_pct
from sale_items si
join products p on p.id = si.product_id
group by p.id, p.name, p.sku
order by profit desc;
```

### E. Profit per date range

```sql
select
  s.sale_date,
  sum(case
    when si.sell_mode = 'box' then si.box_count * si.unit_price
    else si.quantity * si.unit_price
  end) as revenue,
  sum(si.quantity * si.cost_price_at_sale) as cost,
  sum(
    (case
      when si.sell_mode = 'box' then si.box_count * si.unit_price
      else si.quantity * si.unit_price
    end) - (si.quantity * si.cost_price_at_sale)
  ) as profit
from sale_items si
join sales s on s.id = si.sale_id
where s.sale_date between :start_date and :end_date
group by s.sale_date
order by s.sale_date;
```

**Monthly rollup variant:**

```sql
select
  date_trunc('month', s.sale_date)::date as month,
  sum(case
    when si.sell_mode = 'box' then si.box_count * si.unit_price
    else si.quantity * si.unit_price
  end) as revenue,
  sum(si.quantity * si.cost_price_at_sale) as cost,
  sum(
    (case
      when si.sell_mode = 'box' then si.box_count * si.unit_price
      else si.quantity * si.unit_price
    end) - (si.quantity * si.cost_price_at_sale)
  ) as profit
from sale_items si
join sales s on s.id = si.sale_id
group by 1
order by 1;
```

### F. Invoice-adjusted profit (accounts for invoice-level discount/tax)

```sql
with sale_line_share as (
  select
    si.sale_id,
    si.id as sale_item_id,
    (case
      when si.sell_mode = 'box' then si.box_count * si.unit_price
      else si.quantity * si.unit_price
    end) as line_revenue,
    si.quantity * si.cost_price_at_sale as line_cost,
    (case
      when si.sell_mode = 'box' then si.box_count * si.unit_price
      else si.quantity * si.unit_price
    end)
      / nullif(sum(case
          when si.sell_mode = 'box' then si.box_count * si.unit_price
          else si.quantity * si.unit_price
        end) over (partition by si.sale_id), 0)
      * s.discount as line_discount_share
  from sale_items si
  join sales s on s.id = si.sale_id
)
select
  sale_id,
  sum(line_revenue) as gross_revenue,
  sum(line_discount_share) as allocated_discount,
  sum(line_revenue - line_discount_share) as net_revenue,
  sum(line_cost) as total_cost,
  sum(line_revenue - line_discount_share - line_cost) as net_profit
from sale_line_share
group by sale_id
order by sale_id;
```

### G. Total invested vs. recovered (unaffected by this bug — no change)

This one already used `purchases.grand_total` / `sales.grand_total` /
`sales.amount_paid` directly, not `sale_items` math, so it was never
affected. Included here only for completeness/reference:

```sql
select
  (select coalesce(sum(grand_total), 0) from purchases) as total_invested,
  (select coalesce(sum(grand_total), 0) from sales) as total_billed,
  (select coalesce(sum(amount_paid), 0) from sales) as total_collected,
  (select coalesce(sum(
      (case
        when sell_mode = 'box' then box_count * unit_price
        else quantity * unit_price
      end) - (quantity * cost_price_at_sale)
    ), 0)
   from sale_items) as total_gross_profit;
```

---

## Part 3 — Recommended app-layer changes

1. When inserting a `sale_items` row, you no longer need to manually fetch
   and pass cost — the trigger does it. But if your app already computes
   it client-side for display purposes, you *can* pass it explicitly and
   the trigger will respect your value instead of overwriting it.
2. Add a **Profit** card to whatever dashboard currently shows revenue —
   wire it to query B (overall) and D (date range) above.
3. For the product list/detail view, surface query C's `profit_margin_pct`
   next to each product — useful for spotting low-margin SKUs fast.
