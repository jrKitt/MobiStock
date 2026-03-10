CREATE TABLE IF NOT EXISTS BRAND (
  brand_id INT AUTO_INCREMENT PRIMARY KEY,
  brand_name VARCHAR(255) NOT NULL,
  brand_country VARCHAR(255),
  image_url VARCHAR(255) NULL,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_brand_name_not_empty CHECK (brand_name != '')
);

CREATE TABLE IF NOT EXISTS CATEGORY (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name_th VARCHAR(255) NOT NULL,
  category_name_en VARCHAR(255),
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_category_th_not_empty CHECK (category_name_th != '')
);

CREATE TABLE IF NOT EXISTS SUPPLIER (
  supplier_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_name VARCHAR(255) NOT NULL,
  supplier_phone VARCHAR(20),
  supplier_email VARCHAR(100),
  supplier_address TEXT,
  supplier_contact_person VARCHAR(255),
  image_url VARCHAR(255) NULL,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_supplier_name_not_empty CHECK (supplier_name != ''),
  CONSTRAINT chk_supplier_phone_format CHECK (supplier_phone IS NULL OR supplier_phone REGEXP '^[0-9]{9,15}$'),
  CONSTRAINT chk_supplier_email_format CHECK (supplier_email IS NULL OR supplier_email LIKE '%@%.%')
);

CREATE TABLE IF NOT EXISTS CUSTOMER (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_fname VARCHAR(255) NOT NULL,
  customer_lname VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_tax_number VARCHAR(20),
  customer_address TEXT,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_customer_fname_not_empty CHECK (customer_fname != ''),
  CONSTRAINT chk_customer_lname_not_empty CHECK (customer_lname != ''),
  CONSTRAINT chk_customer_phone_not_empty CHECK (customer_phone != ''),
  CONSTRAINT chk_customer_phone_format CHECK (customer_phone REGEXP '^[0-9]{9,15}$'),
  CONSTRAINT chk_customer_tax_format CHECK (customer_tax_number IS NULL OR customer_tax_number REGEXP '^[0-9]{13}$')
);

CREATE TABLE IF NOT EXISTS PRODUCT_MODEL (
  model_id INT AUTO_INCREMENT PRIMARY KEY,
  model_name VARCHAR(255) NOT NULL,
  model_made_in VARCHAR(100),
  model_warranty_duration INT DEFAULT 12,
  brand_id INT NOT NULL,
  category_id INT NOT NULL,
  image_url VARCHAR(255) NULL,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES BRAND(brand_id),
  FOREIGN KEY (category_id) REFERENCES CATEGORY(category_id),
  CONSTRAINT chk_model_name_not_empty CHECK (model_name != ''),
  CONSTRAINT chk_model_warranty_positive CHECK (model_warranty_duration >= 0)
);

CREATE TABLE IF NOT EXISTS PRODUCT_ITEM (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  item_serial_number VARCHAR(100) UNIQUE,
  item_imei VARCHAR(15) UNIQUE,
  item_lot_number VARCHAR(50),
  item_status ENUM('Available', 'Sold', 'Damaged', 'Reserved') DEFAULT 'Available',
  model_id INT NOT NULL,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES PRODUCT_MODEL(model_id),
  CONSTRAINT chk_imei_format CHECK (item_imei IS NULL OR item_imei REGEXP '^[0-9]{15}$')
);


CREATE TABLE IF NOT EXISTS SALE_ORDER (
  sale_id INT AUTO_INCREMENT PRIMARY KEY,
  sale_code VARCHAR(50) NOT NULL UNIQUE,
  sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sale_total_amount DECIMAL(10, 2) NOT NULL,
  sale_additional_cost DECIMAL(10, 2) DEFAULT 0,
  sale_status ENUM('Pending', 'Completed', 'Cancelled') DEFAULT 'Pending',
  customer_id INT NOT NULL,
  create_by VARCHAR(255) NULL,
  update_by VARCHAR(255) NULL,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES CUSTOMER(customer_id),
  CONSTRAINT chk_sale_total_positive CHECK (sale_total_amount > 0),
  CONSTRAINT chk_sale_additional_cost_positive CHECK (sale_additional_cost >= 0)
);

CREATE TABLE IF NOT EXISTS SALE_ORDER_ITEM (
  sale_item_id INT AUTO_INCREMENT PRIMARY KEY,
  sale_price DECIMAL(10, 2) NOT NULL,
  sale_id INT NOT NULL,
  item_id INT NOT NULL,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES SALE_ORDER(sale_id),
  FOREIGN KEY (item_id) REFERENCES PRODUCT_ITEM(item_id),
  CONSTRAINT chk_sale_price_positive CHECK (sale_price > 0)
);

CREATE TABLE IF NOT EXISTS SALE_ORDER_IMAGE (
  image_id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  image_caption VARCHAR(255) NULL,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES SALE_ORDER(sale_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS SPARE_PART (
  part_id INT AUTO_INCREMENT PRIMARY KEY,
  part_name VARCHAR(255),
  part_quantity INT DEFAULT 0,
  -- part_status ENUM('Available', 'Out of Stock') DEFAULT 'Available',
  image_url VARCHAR(255) NULL,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS SUPPLIER_SPARE_PART (
  supplier_id INT,
  part_id INT,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (supplier_id, part_id),
  FOREIGN KEY (supplier_id) REFERENCES SUPPLIER(supplier_id),
  FOREIGN KEY (part_id) REFERENCES SPARE_PART(part_id)
);

CREATE TABLE IF NOT EXISTS REPAIR_ORDER (
  repair_id INT AUTO_INCREMENT PRIMARY KEY,
  repair_code VARCHAR(255) NULL,
  repair_problem_desc TEXT,
  repair_technician_note TEXT,
  repair_date_received DATETIME,
  repair_date_completed DATETIME,
  repair_labor_cost DECIMAL(10, 2),
  repair_status ENUM('received', 'in_progress', 'waiting_payment', 'completed', 'cancelled') DEFAULT 'received',
  customer_id INT,
  item_id INT,
  create_by VARCHAR(255) NULL,
  update_by VARCHAR(255) NULL,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES CUSTOMER(customer_id),
  FOREIGN KEY (item_id) REFERENCES PRODUCT_ITEM(item_id)
);

CREATE TABLE IF NOT EXISTS REPAIR_ORDER_PART (
  repair_id INT,
  part_id INT,
  repair_part_quantity INT,
  repair_part_unit_price DECIMAL(10, 2),
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (repair_id, part_id),
  FOREIGN KEY (repair_id) REFERENCES REPAIR_ORDER(repair_id),
  FOREIGN KEY (part_id) REFERENCES SPARE_PART(part_id)
);

CREATE TABLE IF NOT EXISTS REPAIR_ORDER_IMAGE (
  image_id INT AUTO_INCREMENT PRIMARY KEY,
  repair_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  image_caption VARCHAR(255) NULL,
  image_type ENUM('received', 'completed') DEFAULT 'received',
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repair_id) REFERENCES REPAIR_ORDER(repair_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS CLAIM_ORDER (
  claim_id INT AUTO_INCREMENT PRIMARY KEY,
  claim_code VARCHAR(255),
  claim_date_received DATETIME,
  claim_date_returned DATETIME,
  claim_status ENUM('pending', 'in_review', 'resolved', 'rejected') DEFAULT 'pending',
  claim_resolution ENUM('unknown', 'replacement', 'refund', 'repair') DEFAULT 'unknown',
  supplier_id INT NULL,
  customer_id INT,
  item_id INT,
  create_by VARCHAR(255) NULL,
  update_by VARCHAR(255) NULL,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES SUPPLIER(supplier_id),
  FOREIGN KEY (customer_id) REFERENCES CUSTOMER(customer_id),
  FOREIGN KEY (item_id) REFERENCES PRODUCT_ITEM(item_id)
);

CREATE TABLE IF NOT EXISTS ORDER_HISTORY_LOG (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  order_type ENUM('sale', 'repair', 'claim') NOT NULL,
  order_id INT NOT NULL,
  action ENUM('created', 'updated', 'deleted', 'status_changed') NOT NULL,
  description TEXT NULL,
  old_data JSON NULL,
  new_data JSON NULL,
  action_by VARCHAR(255) NULL,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS User (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

