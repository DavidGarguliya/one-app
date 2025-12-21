INSERT INTO tags (id, type, slug, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'genre', 'electronic', 'Electronic'),
  ('00000000-0000-0000-0000-000000000002', 'mood', 'focus', 'Focus')
ON CONFLICT DO NOTHING;

INSERT INTO tracks (id, title, artist, duration, audio_url, cover_url, status)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'Night Drive', 'Analog Waves', 215, 'http://minio:9000/audio/night-drive.mp3', 'http://minio:9000/covers/night-drive.jpg', 'published'),
  ('00000000-0000-0000-0000-000000000102', 'Skyline', 'Analog Waves', 198, 'http://minio:9000/audio/skyline.mp3', 'http://minio:9000/covers/skyline.jpg', 'draft')
ON CONFLICT DO NOTHING;

INSERT INTO playlists (id, title, description, cover_url, status)
VALUES
  ('00000000-0000-0000-0000-000000000201', 'Deep Focus', 'Minimal beats to stay in flow', 'http://minio:9000/covers/deep-focus.jpg', 'published')
ON CONFLICT DO NOTHING;

INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 1),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000102', 2)
ON CONFLICT DO NOTHING;
