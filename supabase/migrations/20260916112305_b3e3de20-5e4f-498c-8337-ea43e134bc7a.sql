CREATE OR REPLACE FUNCTION public.create_service_orders_with_action_plans(
  _hospital_id uuid,
  _year integer,
  _month integer,
  _orders jsonb
)
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _order jsonb;
  _order_id uuid;
  _goal numeric;
  _percent numeric;
  _service_type text;
  _seen_types text[] := ARRAY[]::text[];
  _duplicate_types text;
  _is_admin boolean;
  _has_any_plan_content boolean;
  _has_complete_plan boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'É necessário estar autenticado.';
  END IF;

  _is_admin := public.has_role(auth.uid(), 'admin'::public.app_role);

  IF NOT (
    _is_admin
    OR (
      public.has_role(auth.uid(), 'controlador'::public.app_role)
      AND public.is_assigned_to_hospital(auth.uid(), _hospital_id)
    )
  ) THEN
    RAISE EXCEPTION 'Você não tem permissão para cadastrar OS neste hospital.';
  END IF;

  IF _year NOT BETWEEN 2000 AND 2100 OR _month NOT BETWEEN 1 AND 12 THEN
    RAISE EXCEPTION 'Ano ou mês inválido.';
  END IF;

  IF jsonb_typeof(_orders) <> 'array' OR jsonb_array_length(_orders) < 1 OR jsonb_array_length(_orders) > 4 THEN
    RAISE EXCEPTION 'Informe entre uma e quatro ordens de serviço.';
  END IF;

  SELECT goal_percent INTO _goal FROM public.site_settings WHERE id = true;
  PERFORM pg_advisory_xact_lock(hashtextextended(_hospital_id::text || ':' || _year::text || ':' || _month::text, 0));

  FOR _order IN SELECT value FROM jsonb_array_elements(_orders)
  LOOP
    _service_type := _order->>'service_type';
    IF _service_type NOT IN ('corretiva', 'preventiva', 'calibracao', 'eletrica') THEN
      RAISE EXCEPTION 'Tipo de serviço inválido.';
    END IF;
    IF _service_type = ANY(_seen_types) THEN
      RAISE EXCEPTION 'Cada tipo de serviço pode ser incluído apenas uma vez.';
    END IF;
    IF NOT _is_admin AND nullif(trim(_order->>'analise_critica'), '') IS NULL THEN
      RAISE EXCEPTION 'A análise crítica é obrigatória para o serviço %.', _service_type;
    END IF;
    _seen_types := array_append(_seen_types, _service_type);
  END LOOP;

  SELECT string_agg(so.service_type, ', ')
  INTO _duplicate_types
  FROM public.service_orders so
  WHERE so.hospital_id = _hospital_id
    AND so.year = _year
    AND so.month = _month
    AND so.service_type = ANY(_seen_types);

  IF _duplicate_types IS NOT NULL THEN
    RAISE EXCEPTION 'Já existe uma OS cadastrada para: %. Nenhuma ordem foi salva.', _duplicate_types;
  END IF;

  FOR _order IN SELECT value FROM jsonb_array_elements(_orders)
  LOOP
    IF (_order->>'os_abertas')::integer < 0 OR (_order->>'os_finalizadas')::integer < 0
      OR (_order->>'acum_critico')::integer < 0 OR (_order->>'acum_geral')::integer < 0 THEN
      RAISE EXCEPTION 'Os valores das OS não podem ser negativos.';
    END IF;

    _percent := CASE
      WHEN (_order->>'os_abertas')::numeric > 0
      THEN ((_order->>'os_finalizadas')::numeric / (_order->>'os_abertas')::numeric) * 100
      ELSE 0
    END;

    _has_any_plan_content := (
      nullif(trim(_order#>>'{action_plan,what_action}'), '') IS NOT NULL
      OR nullif(trim(_order#>>'{action_plan,why_action}'), '') IS NOT NULL
      OR nullif(trim(_order#>>'{action_plan,due_date}'), '') IS NOT NULL
      OR nullif(trim(_order#>>'{action_plan,responsible}'), '') IS NOT NULL
      OR nullif(trim(_order#>>'{action_plan,how_action}'), '') IS NOT NULL
      OR nullif(trim(_order#>>'{action_plan,estimated_cost}'), '') IS NOT NULL
    );
    _has_complete_plan := (
      nullif(trim(_order#>>'{action_plan,what_action}'), '') IS NOT NULL
      AND nullif(trim(_order#>>'{action_plan,why_action}'), '') IS NOT NULL
      AND nullif(trim(_order#>>'{action_plan,where_action}'), '') IS NOT NULL
      AND nullif(trim(_order#>>'{action_plan,due_date}'), '') IS NOT NULL
      AND nullif(trim(_order#>>'{action_plan,responsible}'), '') IS NOT NULL
      AND nullif(trim(_order#>>'{action_plan,how_action}'), '') IS NOT NULL
    );

    IF _percent < _goal AND NOT _has_complete_plan AND (NOT _is_admin OR _has_any_plan_content) THEN
      RAISE EXCEPTION 'O plano 5W2H é obrigatório para o serviço %.', _order->>'service_type';
    END IF;

    INSERT INTO public.service_orders (
      hospital_id, year, month, service_type, os_abertas, os_finalizadas,
      acum_critico, acum_geral, analise_critica
    ) VALUES (
      _hospital_id, _year, _month, _order->>'service_type',
      (_order->>'os_abertas')::integer, (_order->>'os_finalizadas')::integer,
      (_order->>'acum_critico')::integer, (_order->>'acum_geral')::integer,
      nullif(trim(_order->>'analise_critica'), '')
    ) RETURNING id INTO _order_id;

    IF _percent < _goal AND _has_complete_plan THEN
      INSERT INTO public.service_order_action_plans (
        service_order_id, hospital_id, year, month, service_type,
        achieved_percent, goal_percent, status, what_action, why_action,
        where_action, due_date, responsible, how_action, estimated_cost, created_by
      ) VALUES (
        _order_id, _hospital_id, _year, _month, _order->>'service_type',
        round(_percent, 2), _goal, 'aberto',
        trim(_order#>>'{action_plan,what_action}'), trim(_order#>>'{action_plan,why_action}'),
        trim(_order#>>'{action_plan,where_action}'), (_order#>>'{action_plan,due_date}')::date,
        trim(_order#>>'{action_plan,responsible}'), trim(_order#>>'{action_plan,how_action}'),
        CASE WHEN nullif(trim(_order#>>'{action_plan,estimated_cost}'), '') IS NULL
          THEN NULL ELSE (_order#>>'{action_plan,estimated_cost}')::numeric END,
        auth.uid()
      );
    END IF;

    RETURN NEXT _order_id;
  END LOOP;
END;
$$;