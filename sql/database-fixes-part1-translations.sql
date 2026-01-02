-- ========================================
-- PART 1: INTERNATIONALIZATION INFRASTRUCTURE
-- Critical P0 Fix for Global Market Support
-- ========================================

-- 1. CREATE TRANSLATION SYSTEM
CREATE TABLE IF NOT EXISTS public.translations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_type TEXT NOT NULL,
    resource_id UUID NOT NULL,
    locale TEXT NOT NULL,
    field_name TEXT NOT NULL,
    translated_value TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    
    UNIQUE(resource_type, resource_id, locale, field_name),
    CHECK (locale ~ '^[a-z]{2}-[A-Z]{2}$'),
    CHECK (resource_type != ''),
    CHECK (field_name != ''),
    CHECK (translated_value != '')
);

-- Supported locales configuration
CREATE TABLE IF NOT EXISTS public.locales (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    native_name TEXT NOT NULL,
    language_code TEXT NOT NULL,
    country_code TEXT NOT NULL,
    rtl BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CHECK (id ~ '^[a-z]{2}-[A-Z]{2}$'),
    CHECK (language_code ~ '^[a-z]{2}$'),
    CHECK (country_code ~ '^[A-Z]{2}$')
);

-- Currency and formatting per locale
CREATE TABLE IF NOT EXISTS public.locale_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    locale_id TEXT REFERENCES public.locales(id) ON DELETE CASCADE,
    currency_code TEXT NOT NULL DEFAULT 'USD',
    currency_symbol TEXT NOT NULL DEFAULT '$',
    currency_position TEXT DEFAULT 'before' CHECK (currency_position IN ('before', 'after')),
    decimal_separator TEXT DEFAULT '.',
    thousand_separator TEXT DEFAULT ',',
    date_format TEXT DEFAULT 'MM/DD/YYYY',
    time_format TEXT DEFAULT '12' CHECK (time_format IN ('12', '24')),
    number_format JSONB DEFAULT '{"decimal_places": 2, "grouping": [3]}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(locale_id)
);

-- 2. CRITICAL INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_translations_lookup 
ON public.translations (resource_type, resource_id, locale);

CREATE INDEX IF NOT EXISTS idx_translations_field 
ON public.translations (resource_type, field_name, locale);

CREATE INDEX IF NOT EXISTS idx_translations_approved 
ON public.translations (resource_type, resource_id, locale, is_approved) 
WHERE is_approved = true;

CREATE INDEX IF NOT EXISTS idx_translations_fts 
ON public.translations USING gin(to_tsvector('simple', translated_value));

-- 3. RLS POLICIES
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locale_settings ENABLE ROW LEVEL SECURITY;

-- Public read approved translations
CREATE POLICY "read_approved_translations" ON public.translations
    FOR SELECT USING (is_approved = true);

-- Admin manage all
CREATE POLICY "admin_manage_translations" ON public.translations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Public read locales
CREATE POLICY "read_active_locales" ON public.locales
    FOR SELECT USING (is_active = true);

CREATE POLICY "admin_manage_locales" ON public.locales
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "read_locale_settings" ON public.locale_settings
    FOR SELECT USING (true);

CREATE POLICY "admin_manage_locale_settings" ON public.locale_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

