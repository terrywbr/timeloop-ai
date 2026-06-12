-- DJ TTS audio cache (public bucket — stable URLs, marginal cost → 0 after warm-up)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dj-tts-cache', 'dj-tts-cache', true, 5242880, array['audio/mpeg', 'audio/mp3'])
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Service role uploads via API; objects are world-readable via public bucket URL.
