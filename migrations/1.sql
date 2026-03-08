CREATE TABLE system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  current_exchange_rate_ves REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  amount_usd REAL NOT NULL,
  status TEXT,
  client_name TEXT,
  payment_method TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_settings (current_exchange_rate_ves) VALUES (36.5);