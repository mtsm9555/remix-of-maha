ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all for now" ON public.conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all for now" ON public.messages FOR ALL USING (true) WITH CHECK (true);