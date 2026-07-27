INSERT INTO makers (name, country) VALUES
('トヨタ', '日本'),
('ホンダ', '日本'),
('日産', '日本'),
('マツダ', '日本'),
('スバル', '日本'),
('レクサス', '日本'),
('スズキ', '日本'),
('BMW', 'ドイツ');

INSERT INTO stores (name, prefecture, phone) VALUES
('東京本店', '東京都', '03-0000-1001'),
('横浜店', '神奈川県', '045-000-1002'),
('千葉店', '千葉県', '043-000-1003'),
('大宮店', '埼玉県', '048-000-1004');

INSERT INTO vehicle_statuses (code, label, display_order) VALUES
('available', '販売中', 1),
('reserved', '商談中', 2),
('sold', '成約済み', 3),
('maintenance', '整備中', 4);

INSERT INTO vehicles (
  name, stock_no, maker_id, store_id, status_code, model_year, mileage, price, fuel, color, transmission, inspection
) VALUES
('トヨタ プリウス Sツーリング', 'UC-2026-001', 1, 1, 'available', 2021, 24800, 2180000, 'ハイブリッド', 'ホワイト', 'AT', '2027/04'),
('ホンダ フィット e:HEV', 'UC-2026-002', 2, 2, 'available', 2022, 18200, 1680000, 'ハイブリッド', 'ブルー', 'AT', '2027/09'),
('日産 ノート X', 'UC-2026-003', 3, 3, 'reserved', 2020, 35600, 1320000, 'ガソリン', 'シルバー', 'AT', '2026/11'),
('マツダ CX-5 XD', 'UC-2026-004', 4, 1, 'available', 2019, 48600, 2360000, 'ディーゼル', 'レッド', 'AT', '2026/10'),
('スバル フォレスター Advance', 'UC-2026-005', 5, 4, 'maintenance', 2021, 41200, 2740000, 'ハイブリッド', 'グレー', 'AT', '2028/01'),
('レクサス UX250h', 'UC-2026-006', 6, 2, 'available', 2022, 12600, 3980000, 'ハイブリッド', 'ブラック', 'AT', '2027/12'),
('スズキ ジムニー XC', 'UC-2026-007', 7, 3, 'sold', 2020, 29800, 2260000, 'ガソリン', 'グリーン', 'MT', '2026/08'),
('BMW 320i M Sport', 'UC-2026-008', 8, 1, 'available', 2021, 33500, 3480000, 'ガソリン', 'ブラック', 'AT', '2027/06');
