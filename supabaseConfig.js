/* ============================================================
   SirrApp — إعداد اتصال Supabase
   ============================================================
   ⚠️ استبدل القيم التالية بمعلومات مشروعك في Supabase:
      - SUPABASE_URL       : عنوان المشروع (Project URL)
      - SUPABASE_ANON_KEY  : المفتاح العام (anon public key)
   ------------------------------------------------------------
   ملاحظة: المفتاح anon آمن للعرض في الواجهة لأنه محمي
   بواسطة سياسات RLS (Row Level Security) على مستوى قاعدة البيانات.
   ============================================================ */

const SUPABASE_URL = 'https://YOUR-PROJECT-ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY-HERE';

/* إنشاء عميل Supabase العام (Singleton) */
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'sirrapp-auth-token'
  },
  realtime: {
    params: {
      eventsPerSecond: 20
    }
  }
});

/* إتاحة العميل عالمياً لبقية الملفات */
window.supabaseClient = supabaseClient;

/* ============================================================
   📌 SQL Schema المقترح لتنفيذه في Supabase SQL Editor
   ============================================================
   -- 1) جدول الملفات الشخصية
   create table if not exists public.profiles (
     id          uuid primary key references auth.users(id) on delete cascade,
     email       text unique not null,
     username    text unique not null,
     full_name   text not null,
     age         int  not null check (age >= 16 and age <= 120),
     phone       text,
     avatar_url  text,
     created_at  timestamptz default now(),
     updated_at  timestamptz default now()
   );

   -- 2) تفعيل RLS
   alter table public.profiles enable row level security;

   -- 3) سياسات الوصول
   create policy "Profiles are viewable by authenticated users"
     on public.profiles for select
     to authenticated using (true);

   create policy "Users can insert own profile"
     on public.profiles for insert
     to authenticated with check (auth.uid() = id);

   create policy "Users can update own profile"
     on public.profiles for update
     to authenticated using (auth.uid() = id);

   -- 4) Trigger لإنشاء ملف تلقائياً بعد التسجيل (اختياري)
   create or replace function public.handle_new_user()
   returns trigger language plpgsql security definer as $$
   begin
     insert into public.profiles (id, email, username, full_name, age, phone)
     values (
       new.id,
       new.email,
       coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text,1,8)),
       coalesce(new.raw_user_meta_data->>'full_name', 'User'),
       coalesce((new.raw_user_meta_data->>'age')::int, 16),
       new.raw_user_meta_data->>'phone'
     );
     return new;
   end; $$ language plpgsql;

   drop trigger if exists on_auth_user_created on auth.users;
   create trigger on_auth_user_created
     after insert on auth.users
     for each row execute function public.handle_new_user();

   -- ⚠️ ملاحظة مهمة:
   -- لا يوجد جدول للرسائل — الرسائل تُنقل عبر Supabase Realtime
   -- Broadcast فقط (بدون تخزين) لضمان السرية التامة.
   ============================================================ */