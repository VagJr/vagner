PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admins (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('admin','sales','finance')));
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, admin_id TEXT NOT NULL REFERENCES admins(id), csrf TEXT NOT NULL, expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS config (id TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS images (id TEXT PRIMARY KEY, mime TEXT NOT NULL, body TEXT NOT NULL, width INTEGER NOT NULL, height INTEGER NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('vehicle','part')), title TEXT NOT NULL, price INTEGER NOT NULL CHECK(price >= 0), cost INTEGER NOT NULL DEFAULT 0 CHECK(cost >= 0), quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity >= 0), status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','available','reserved','sold','archived')), data TEXT NOT NULL DEFAULT '{}', revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, type TEXT NOT NULL, product_id TEXT REFERENCES products(id), stage TEXT NOT NULL DEFAULT 'new' CHECK(stage IN ('new','contact','proposal','won','lost')), owner TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', data TEXT NOT NULL DEFAULT '{}', source TEXT NOT NULL DEFAULT 'site', consent INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sales (id TEXT PRIMARY KEY, customer TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', lead_id TEXT REFERENCES leads(id), total INTEGER NOT NULL CHECK(total > 0), status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled')), request_key TEXT UNIQUE NOT NULL, due_date TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sale_items (id TEXT PRIMARY KEY, sale_id TEXT NOT NULL REFERENCES sales(id), product_id TEXT NOT NULL REFERENCES products(id), title TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity > 0), unit_price INTEGER NOT NULL CHECK(unit_price >= 0), unit_cost INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS ledger (id TEXT PRIMARY KEY, sale_id TEXT UNIQUE REFERENCES sales(id), kind TEXT NOT NULL CHECK(kind IN ('income','expense')), description TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount > 0), due_date TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','cancelled')), paid_at TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS movements (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id TEXT NOT NULL REFERENCES products(id), delta INTEGER NOT NULL, reason TEXT NOT NULL, reference TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, phone TEXT NOT NULL, direction TEXT NOT NULL CHECK(direction IN ('in','out')), text TEXT NOT NULL, status TEXT NOT NULL, provider_id TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS conversations (phone TEXT PRIMARY KEY, handoff INTEGER NOT NULL DEFAULT 0, last_inbound TEXT NOT NULL, lead_id TEXT REFERENCES leads(id));
CREATE TABLE IF NOT EXISTS bot_rules (id TEXT PRIMARY KEY, title TEXT NOT NULL, keywords TEXT NOT NULL, response TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, priority INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','scheduled','processing','sent','failed','cancelled','uncertain')), due_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, lease_until TEXT, provider_id TEXT, error TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS webhook_events (id TEXT PRIMARY KEY, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS fiscal (id TEXT PRIMARY KEY, sale_id TEXT UNIQUE REFERENCES sales(id), environment TEXT NOT NULL, status TEXT NOT NULL, payload TEXT NOT NULL, provider_id TEXT, response TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, action TEXT NOT NULL, entity TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS rate_limits (id TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS jobs_due ON jobs(status,due_at);
CREATE INDEX IF NOT EXISTS leads_created ON leads(created_at);
CREATE INDEX IF NOT EXISTS messages_phone ON messages(phone,created_at);
CREATE TRIGGER IF NOT EXISTS sale_stock_guard BEFORE INSERT ON sale_items BEGIN
 SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM products WHERE id=NEW.product_id AND status IN ('available','reserved') AND quantity >= NEW.quantity) THEN RAISE(ABORT,'STOCK_UNAVAILABLE') END;
END;
CREATE TRIGGER IF NOT EXISTS sale_stock_apply AFTER INSERT ON sale_items BEGIN
 UPDATE products SET quantity=quantity-NEW.quantity, status=CASE WHEN quantity-NEW.quantity=0 THEN 'sold' ELSE status END, revision=revision+1, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.product_id;
 INSERT INTO movements(product_id,delta,reason,reference,created_at) VALUES(NEW.product_id,-NEW.quantity,'sale',NEW.sale_id,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;
CREATE TRIGGER IF NOT EXISTS sale_cancel_guard BEFORE UPDATE OF status ON sales WHEN NEW.status='cancelled' AND OLD.status='confirmed' BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM ledger WHERE sale_id=OLD.id AND status='paid') THEN RAISE(ABORT,'REFUND_REQUIRED') END;
END;
CREATE TRIGGER IF NOT EXISTS sale_cancel_stock AFTER UPDATE OF status ON sales WHEN NEW.status='cancelled' AND OLD.status='confirmed' BEGIN
 UPDATE products SET quantity=quantity+(SELECT quantity FROM sale_items WHERE sale_id=NEW.id AND product_id=products.id),status='available',revision=revision+1 WHERE id IN (SELECT product_id FROM sale_items WHERE sale_id=NEW.id);
 INSERT INTO movements(product_id,delta,reason,reference,created_at) SELECT product_id,quantity,'cancel',NEW.id,strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM sale_items WHERE sale_id=NEW.id;
 UPDATE ledger SET status='cancelled' WHERE sale_id=NEW.id;
END;
