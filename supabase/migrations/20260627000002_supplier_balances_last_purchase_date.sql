-- =============================================================================
-- Extend supplier_balances with last_purchase_date
-- Must DROP + CREATE: cannot insert column before amount_owed via REPLACE.
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
  p.last_purchase_date,

  (s.opening_balance + coalesce(p.total_purchased, 0) - coalesce(sp.total_paid, 0))
    ::numeric(12,2) as amount_owed

from suppliers s
left join (
  select
    supplier_id,
    sum(grand_total) as total_purchased,
    max(purchase_date) as last_purchase_date
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
