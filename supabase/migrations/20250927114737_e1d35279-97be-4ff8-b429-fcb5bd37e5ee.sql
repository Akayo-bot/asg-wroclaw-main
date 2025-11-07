-- Fix function search path security issue
ALTER FUNCTION validate_event_limits() SET search_path = public;