-- =============================================================================
-- Narayani Traders ERP — Full Database Schema
-- Owner: Hariom Suthar (1fa6b77b-455d-4745-afc8-794a5a3ab6ae)
-- Run once in: Supabase Dashboard → SQL Editor → New Query → Paste → Run
--
-- Tables (in creation order):
--   1.  profiles
--   2.  products
--   3.  customers
--   4.  suppliers
--   5.  sales
--   6.  sale_items
--   7.  purchases
--   8.  purchase_items
--   9.  payments
--   10. stock_movements
-- =============================================================================


-- =============================================================================
-- SECTION 1 — ENUM TYPES
-- =============================================================================

-- Sell / buy mode on line items
create type sell_mode      as enum ('unit', 'box');
create type buy_mode       as enum ('unit', 'box');

-- Payment methods
create type payment_method as enum ('cash', 'upi', 'card', 'bank_transfer', 'credit');

-- Sale payment status
create type payment_status as enum ('paid', 'partial', 'pending');

-- Stock movement causes
create type movement_type  as enum ('purchase', 'sale', 'adjustment', 'damage', 'opening_stock');

-- Profile roles (single owner for now — kept for future flexibility)
create type user_role      as enum ('owner');


-- =============================================================================
-- SECTION 2 — TABLES
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES
-- Single row — mirrors auth.users for the one owner.
-- Auto-populated via trigger on auth.users insert.
-- ─────────────────────────────────────────────────────────────────────────────
create table profiles (
  id          uuid        primary key references auth.users (id) on delete cascade,
  email       text        not null,
  full_name   text,
  role        user_role   not null default 'owner',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table profiles is 'Single-owner profile mirroring auth.users.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PRODUCTS
-- Supports unit and box packaging.
-- current_stock always stored in base units — never in boxes.
-- ─────────────────────────────────────────────────────────────────────────────
create table products (
  id                  uuid          primary key default gen_random_uuid(),
  name                text          not null,
  sku                 text          unique,
  description         text,
  category            text,

  -- Base unit info
  unit_name           text          not null default 'piece',  -- e.g. "piece", "kg", "litre"
  selling_price       numeric(12,2) not null default 0,        -- price per single unit
  purchase_price      numeric(12,2) not null default 0,        -- cost per single unit
  gst_rate            numeric(5,2)  not null default 0,        -- GST % e.g. 18.00 — default on sale items

  -- Box packaging (optional)
  has_box             boolean       not null default false,
  box_name            text,                                    -- e.g. "dozen", "carton", "pack"
  units_per_box       integer       check (units_per_box > 0), -- how many units in one box
  box_purchase_price  numeric(12,2),                           -- cost per full box
  box_selling_price   numeric(12,2),                           -- selling price per full box

  -- Inventory
  current_stock       numeric(12,3) not null default 0,        -- always in base units
  minimum_stock       numeric(12,3) not null default 0,        -- low-stock alert threshold
  track_inventory     boolean       not null default true,     -- if false, stock is not decremented on sale

  -- Lifecycle
  is_active           boolean       not null default true,
  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now(),

  -- Constraint: box fields must be set together
  constraint chk_box_fields check (
    (has_box = false)
    or
    (has_box = true and box_name is not null and units_per_box is not null)
  )
);
comment on table  products              is 'Inventory items — sold and purchased by unit or box.';
comment on column products.current_stock is 'Always stored in base units. Convert boxes on entry.';
comment on column products.gst_rate     is 'Default GST % applied to this product on sale/purchase items.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CUSTOMERS
-- ─────────────────────────────────────────────────────────────────────────────
create table customers (
  id               uuid          primary key default gen_random_uuid(),
  name             text          not null,
  phone            text,
  email            text,
  address          text,
  city             text,
  state            text,
  postal_code      text,
  gstin            text,

  -- Ledger
  opening_balance  numeric(12,2) not null default 0,
    -- Positive  = customer owes you (they owe money from before migration)
    -- Negative  = you owe them (advance paid before migration)
    -- Zero      = fresh start
  credit_limit     numeric(12,2) not null default 0,
    -- Max outstanding allowed before blocking new sales (0 = no limit)

  -- Lifecycle
  is_active        boolean       not null default true,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);
comment on table  customers                  is 'Customer master data.';
comment on column customers.opening_balance  is '+ve = customer owes you. -ve = you owe them (advance).';
comment on column customers.credit_limit     is '0 = no limit enforced.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SUPPLIERS
-- ─────────────────────────────────────────────────────────────────────────────
create table suppliers (
  id               uuid          primary key default gen_random_uuid(),
  name             text          not null,
  phone            text,
  email            text,
  address          text,
  city             text,
  state            text,
  postal_code      text,
  gstin            text,

  -- Ledger
  opening_balance  numeric(12,2) not null default 0,
    -- Positive  = you owe them (unpaid balance from before migration)
    -- Negative  = they owe you (advance you paid before migration)
    -- Zero      = fresh start

  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);
comment on table  suppliers                  is 'Supplier master data.';
comment on column suppliers.opening_balance  is '+ve = you owe them. -ve = they owe you (advance).';


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SALES
-- ─────────────────────────────────────────────────────────────────────────────
create table sales (
  id              uuid           primary key default gen_random_uuid(),
  invoice_number  text           not null unique,   -- e.g. INV-2024-001  (standardised from bill_number)
  customer_id     uuid           not null references customers (id),
  sale_date       date           not null default current_date,

  -- Financials
  subtotal        numeric(12,2)  not null default 0,  -- sum of line totals before tax & discount
  tax_amount      numeric(12,2)  not null default 0,  -- total GST — single column, no CGST/SGST split
  discount        numeric(12,2)  not null default 0,  -- flat discount on whole bill
  grand_total     numeric(12,2)  not null default 0,  -- subtotal + tax_amount − discount

  -- Payment
  amount_paid     numeric(12,2)  not null default 0,
  balance_due     numeric(12,2)  not null default 0,  -- grand_total − amount_paid
  payment_status  payment_status not null default 'pending',
  due_date        date,                               -- optional — for credit sales

  notes           text,
  created_at      timestamptz    not null default now()
);
comment on table  sales                is 'Sales invoices (formerly bills).';
comment on column sales.invoice_number is 'Human-readable invoice reference. Auto-generated by app.';
comment on column sales.tax_amount     is 'Total GST — no CGST/SGST split needed.';
comment on column sales.balance_due    is 'grand_total − amount_paid. Positive = customer still owes.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. SALE ITEMS
-- Each row is one line item on a sales invoice.
-- Supports selling in units OR boxes.
-- quantity is ALWAYS in base units.
-- ─────────────────────────────────────────────────────────────────────────────
create table sale_items (
  id          uuid          primary key default gen_random_uuid(),
  sale_id     uuid          not null references sales    (id) on delete cascade,
  product_id  uuid          not null references products (id),

  sell_mode   sell_mode     not null default 'unit',
  box_count   integer       check (box_count > 0),      -- number of boxes (null when sell_mode = unit)
  quantity    numeric(12,3) not null,                   -- ALWAYS base units: boxes × units_per_box, or direct qty
  unit_price  numeric(12,2) not null,                   -- price used (unit price or box price per sell_mode)
  tax_rate    numeric(5,2)  not null default 0,         -- GST % on this line
  line_total  numeric(12,2) not null,                   -- quantity × unit_price (before tax)

  constraint chk_box_count check (
    (sell_mode = 'unit'::sell_mode and box_count is null)
    or
    (sell_mode = 'box'::sell_mode  and box_count is not null)
  )
);
comment on table  sale_items          is 'Line items for each sales invoice.';
comment on column sale_items.quantity is 'Always in base units. For boxes: boxes × units_per_box.';

-- Example: Selling 2 boxes of pens (12 units/box) at ₹110/box
--   sell_mode = 'box', box_count = 2, quantity = 24, unit_price = 110, line_total = 220


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. PURCHASES
-- ─────────────────────────────────────────────────────────────────────────────
create table purchases (
  id               uuid          primary key default gen_random_uuid(),
  supplier_id      uuid          not null references suppliers (id),
  purchase_number  text          not null unique,  -- auto-generated or supplier's invoice no.
  purchase_date    date          not null default current_date,

  -- Financials
  subtotal         numeric(12,2) not null default 0,
  tax_amount       numeric(12,2) not null default 0,  -- GST paid — single column
  discount_amount  numeric(12,2) not null default 0,
  grand_total      numeric(12,2) not null default 0,

  notes            text,
  created_at       timestamptz   not null default now()
);
comment on table purchases is 'Purchase orders from suppliers.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. PURCHASE ITEMS
-- Mirrors sale_items logic — supports buying in units OR boxes.
-- quantity is ALWAYS in base units.
-- ─────────────────────────────────────────────────────────────────────────────
create table purchase_items (
  id           uuid          primary key default gen_random_uuid(),
  purchase_id  uuid          not null references purchases (id) on delete cascade,
  product_id   uuid          not null references products  (id),

  buy_mode     buy_mode      not null default 'unit',
  box_count    integer       check (box_count > 0),      -- null when buy_mode = unit
  quantity     numeric(12,3) not null,                   -- ALWAYS base units
  unit_price   numeric(12,2) not null,                   -- price paid (unit or box price per buy_mode)
  tax_rate     numeric(5,2)  not null default 0,         -- GST % on this line
  line_total   numeric(12,2) not null,

  constraint chk_box_count check (
    (buy_mode = 'unit'::buy_mode and box_count is null)
    or
    (buy_mode = 'box'::buy_mode  and box_count is not null)
  )
);
comment on table  purchase_items          is 'Line items for each purchase order.';
comment on column purchase_items.quantity is 'Always in base units. For boxes: boxes × units_per_box.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. PAYMENTS
-- Customer payments — can be linked to a sale or recorded as an advance.
-- ─────────────────────────────────────────────────────────────────────────────
create table payments (
  id               uuid           primary key default gen_random_uuid(),
  customer_id      uuid           not null references customers (id),
  sale_id          uuid           references sales (id),         -- null = advance payment (no sale yet)

  amount           numeric(12,2)  not null check (amount > 0),
  payment_method   payment_method not null,
  reference_number text,          -- UPI txn ID, cheque number, etc.
  payment_date     date           not null default current_date,
  note             text,

  created_at       timestamptz    not null default now()
);
comment on table  payments         is 'Customer payment receipts.';
comment on column payments.sale_id is 'Null for advance payments not yet applied to a sale.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 10. STOCK MOVEMENTS
-- Single source of truth for every inventory change.
-- quantity is positive for incoming, negative for outgoing.
-- ─────────────────────────────────────────────────────────────────────────────
create table stock_movements (
  id            uuid          primary key default gen_random_uuid(),
  product_id    uuid          not null references products (id),
  movement_type movement_type not null,
  quantity      numeric(12,3) not null,  -- base units · negative = outgoing (sale, damage, adjustment)
  reference_id  uuid,                   -- FK to the sale or purchase that caused this movement
  notes         text,
  created_at    timestamptz   not null default now()
);
comment on table  stock_movements              is 'Audit log of every inventory change.';
comment on column stock_movements.quantity     is 'Always base units. Negative = stock went out.';
comment on column stock_movements.reference_id is 'UUID of the sale or purchase that triggered this movement.';

-- Movement type reference:
--   purchase      → quantity +  (stock added via purchase order)
--   sale          → quantity −  (stock deducted on sale)
--   adjustment    → quantity +/−  (manual correction)
--   damage        → quantity −  (damaged / lost stock)
--   opening_stock → quantity +  (initial stock on migration)


-- =============================================================================
-- SECTION 3 — INDEXES
-- All foreign keys + frequently filtered columns.
-- Per Postgres best practice: index the referencing side of every FK.
-- =============================================================================

-- products
create index idx_products_category    on products (category);
create index idx_products_is_active   on products (is_active);
create index idx_products_sku         on products (sku);

-- customers
create index idx_customers_is_active  on customers (is_active);
create index idx_customers_phone      on customers (phone);

-- suppliers
create index idx_suppliers_name       on suppliers (name);

-- sales
create index idx_sales_customer_id    on sales (customer_id);
create index idx_sales_sale_date      on sales (sale_date desc);
create index idx_sales_payment_status on sales (payment_status);
create index idx_sales_invoice_number on sales (invoice_number);

-- sale_items
create index idx_sale_items_sale_id    on sale_items (sale_id);
create index idx_sale_items_product_id on sale_items (product_id);

-- purchases
create index idx_purchases_supplier_id    on purchases (supplier_id);
create index idx_purchases_purchase_date  on purchases (purchase_date desc);

-- purchase_items
create index idx_purchase_items_purchase_id on purchase_items (purchase_id);
create index idx_purchase_items_product_id  on purchase_items (product_id);

-- payments
create index idx_payments_customer_id   on payments (customer_id);
create index idx_payments_sale_id       on payments (sale_id);
create index idx_payments_payment_date  on payments (payment_date desc);

-- stock_movements
create index idx_stock_movements_product_id    on stock_movements (product_id);
create index idx_stock_movements_movement_type on stock_movements (movement_type);
create index idx_stock_movements_created_at    on stock_movements (created_at desc);
create index idx_stock_movements_reference_id  on stock_movements (reference_id);


-- =============================================================================
-- SECTION 4 — ROW LEVEL SECURITY
-- Single owner system — only the authenticated owner can read/write.
-- auth.uid() is wrapped in (select ...) to evaluate once per query, not per row.
-- =============================================================================

alter table profiles        enable row level security;
alter table products        enable row level security;
alter table customers       enable row level security;
alter table suppliers       enable row level security;
alter table sales           enable row level security;
alter table sale_items      enable row level security;
alter table purchases       enable row level security;
alter table purchase_items  enable row level security;
alter table payments        enable row level security;
alter table stock_movements enable row level security;


-- Helper: returns true only when the calling user is the owner.
-- Defined as SECURITY INVOKER (default) — runs as the caller, not postgres.
create or replace function is_owner()
returns boolean
language sql
stable
as $$
  select (select auth.uid()) = '1fa6b77b-455d-4745-afc8-794a5a3ab6ae'::uuid
$$;
comment on function is_owner() is
  'Returns true only for the single owner. Used in all RLS policies.';


-- ── RLS policies ─────────────────────────────────────────────────────────────
-- Pattern: one "all operations" policy per table, scoped to the owner.

create policy "owner_all" on profiles        for all to authenticated using (is_owner()) with check (is_owner());
create policy "owner_all" on products        for all to authenticated using (is_owner()) with check (is_owner());
create policy "owner_all" on customers       for all to authenticated using (is_owner()) with check (is_owner());
create policy "owner_all" on suppliers       for all to authenticated using (is_owner()) with check (is_owner());
create policy "owner_all" on sales           for all to authenticated using (is_owner()) with check (is_owner());
create policy "owner_all" on sale_items      for all to authenticated using (is_owner()) with check (is_owner());
create policy "owner_all" on purchases       for all to authenticated using (is_owner()) with check (is_owner());
create policy "owner_all" on purchase_items  for all to authenticated using (is_owner()) with check (is_owner());
create policy "owner_all" on payments        for all to authenticated using (is_owner()) with check (is_owner());
create policy "owner_all" on stock_movements for all to authenticated using (is_owner()) with check (is_owner());


-- =============================================================================
-- SECTION 5 — DATA API GRANTS
-- Required from April 2026: new tables are NOT auto-exposed to the Data API.
-- Grant SELECT/INSERT/UPDATE/DELETE to the authenticated role explicitly.
-- =============================================================================

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  profiles, products, customers, suppliers,
  sales, sale_items, purchases, purchase_items,
  payments, stock_movements
to authenticated;


-- =============================================================================
-- SECTION 6 — AUTO-UPDATE updated_at TRIGGER
-- =============================================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

create trigger trg_customers_updated_at
  before update on customers
  for each row execute function set_updated_at();

create trigger trg_suppliers_updated_at
  before update on suppliers
  for each row execute function set_updated_at();


-- =============================================================================
-- SECTION 7 — AUTO-CREATE PROFILE ON AUTH SIGN-UP
-- Trigger fires when a new row is inserted into auth.users.
-- Security definer + empty search_path = Supabase recommended pattern.
-- =============================================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'owner'
  )
  on conflict (id) do nothing;  -- safe re-runs
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- =============================================================================
-- SECTION 8 — SEED OWNER PROFILE
-- Insert the owner row (safe to re-run — ON CONFLICT does nothing).
-- =============================================================================

insert into profiles (id, email, full_name, role)
values (
  '1fa6b77b-455d-4745-afc8-794a5a3ab6ae',
  'hariomsuthar7143@gmail.com',
  'Hariom Suthar',
  'owner'
)
on conflict (id) do nothing;


-- =============================================================================
-- SECTION 9 — INVENTORY PROCEDURES / FUNCTIONS
-- =============================================================================

create or replace function increment_stock(p_product_id uuid, p_delta numeric)
returns void
language plpgsql
security invoker
as $$
begin
  update products
  set current_stock = current_stock + p_delta
  where id = p_product_id;
end;
$$;

-- Grant execution to authenticated users
grant execute on function increment_stock to authenticated;


-- =============================================================================
-- DONE ✓
-- All 10 tables and functions created with:
--   • Proper data types and constraints
--   • Indexes on all FK columns + frequently queried columns
--   • RLS enabled — single owner policy on every table
--   • Data API grants (required from April 2026)
--   • updated_at auto-trigger on mutable tables
--   • Profile auto-created on auth sign-up
--   • Owner profile seeded
-- =============================================================================
