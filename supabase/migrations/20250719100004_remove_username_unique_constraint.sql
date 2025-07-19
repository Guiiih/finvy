-- Migration: Remove unique constraint from username column in profiles table

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_username_key;
