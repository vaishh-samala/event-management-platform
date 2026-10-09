INSERT INTO events(title,description,category,venue,city,starts_at,ends_at,capacity,price,organizer) VALUES
('Design Futures Summit','A one-day gathering for designers, founders and creative technologists.','Technology','T-Hub, Raidurg','Hyderabad',NOW()+INTERVAL '8 days',NOW()+INTERVAL '8 days 8 hours',180,499,'Studio Collective'),
('Hyderabad Food & Culture Fest','Local food stalls, live music and workshops celebrating the city.','Community','People’s Plaza, Necklace Road','Hyderabad',NOW()+INTERVAL '14 days',NOW()+INTERVAL '14 days 7 hours',500,199,'City Experiences'),
('AI Builders Meetup','Practical talks and demos on building useful AI products.','Technology','WeWork, Hitech City','Hyderabad',NOW()+INTERVAL '20 days',NOW()+INTERVAL '20 days 4 hours',120,0,'AI Hyderabad'),
('Indie Music Night','An intimate evening with independent artists and acoustic sets.','Music','The Moonshine Project','Hyderabad',NOW()+INTERVAL '25 days',NOW()+INTERVAL '25 days 5 hours',160,349,'Live Local')
ON CONFLICT DO NOTHING;
INSERT INTO agenda_items(event_id,title,speaker,starts_at,ends_at,details)
SELECT id,'Welcome & opening','Event Host',starts_at,starts_at + INTERVAL '30 minutes','Welcome session and event overview.' FROM events WHERE title='Design Futures Summit'
ON CONFLICT DO NOTHING;
