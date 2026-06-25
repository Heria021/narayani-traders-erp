-- Apply to hosted Supabase: atomic stock movement + current_stock update.
-- Respects products.track_inventory (skips both writes when false).

create or replace function apply_stock_movement(
  p_product_id    uuid,
  p_delta         numeric,
  p_movement_type movement_type,
  p_reference_id  uuid    default null,
  p_notes         text    default null
)
returns void
language plpgsql
security invoker
as $$
declare
  v_track_inventory boolean;
begin
  select track_inventory into v_track_inventory
  from products
  where id = p_product_id;

  if not found then
    raise exception 'Product not found: %', p_product_id;
  end if;

  if not v_track_inventory then
    return;
  end if;

  insert into stock_movements (product_id, movement_type, quantity, reference_id, notes)
  values (p_product_id, p_movement_type, p_delta, p_reference_id, p_notes);

  update products
  set current_stock = current_stock + p_delta
  where id = p_product_id;
end;
$$;

grant execute on function apply_stock_movement(uuid, numeric, movement_type, uuid, text) to authenticated;
