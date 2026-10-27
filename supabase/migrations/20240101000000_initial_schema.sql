-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for component types if needed
-- CREATE TYPE component_type AS ENUM ('text', 'image', 'chart', 'table');

-- Note: Supabase handles JWT automatically, no need to set app.jwt_secret
-- The JWT secret can be accessed in RLS policies using current_setting('request.jwt.claim.sub', true)::uuid

-- Create tables
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- Using TEXT instead of ENUM for simplicity
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  "order" INTEGER NOT NULL DEFAULT 0
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;

-- Create policies for reports
CREATE POLICY "Users can view their own reports" 
  ON public.reports FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports" 
  ON public.reports FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" 
  ON public.reports FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" 
  ON public.reports FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for components
CREATE POLICY "Users can view components of their reports" 
  ON public.components FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.reports 
    WHERE reports.id = components.report_id 
    AND reports.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert components into their reports" 
  ON public.components FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.reports 
    WHERE reports.id = components.report_id 
    AND reports.user_id = auth.uid()
  ));

CREATE POLICY "Users can update components in their reports" 
  ON public.components FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.reports 
    WHERE reports.id = components.report_id 
    AND reports.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete components from their reports" 
  ON public.components FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.reports 
    WHERE reports.id = components.report_id 
    AND reports.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_components_report_id ON public.components(report_id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_components_updated_at
BEFORE UPDATE ON public.components
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for batch updating component orders
CREATE OR REPLACE FUNCTION batch_update_components_order(updates JSONB[])
RETURNS void AS $$
DECLARE
  update_item JSONB;
BEGIN
  FOREACH update_item IN ARRAY updates LOOP
    UPDATE public.components 
    SET "order" = (update_item->>'order')::int,
        updated_at = NOW()
    WHERE id = (update_item->>'id')::uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
