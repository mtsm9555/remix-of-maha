GRANT SELECT ON public.logs TO anon, authenticated;
GRANT ALL ON public.logs TO service_role;
GRANT SELECT ON public.tools TO anon, authenticated;
GRANT ALL ON public.tools TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT ON public.tasks TO anon;
GRANT ALL ON public.tasks TO service_role;