CREATE TABLE IF NOT EXISTS BRAND (
  brand_id INT AUTO_INCREMENT PRIMARY KEY,
  brand_name VARCHAR(255),
  brand_country VARCHAR(255),
  image_url VARCHAR(255) NULL,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS CATEGORY (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name_th VARCHAR(255),
  category_name_en VARCHAR(255),
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS SUPPLIER (
  supplier_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_name VARCHAR(255),
  supplier_phone VARCHAR(255),
  supplier_email VARCHAR(255),
  supplier_address VARCHAR(255),
  supplier_contact_person VARCHAR(255),
  image_url VARCHAR(255) NULL,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS CUSTOMER (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_fname VARCHAR(255),
  customer_lname VARCHAR(255),
  customer_phone VARCHAR(255),
  customer_tax_number VARCHAR(255),
  customer_address VARCHAR(255),
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS PRODUCT_MODEL (
  model_id INT AUTO_INCREMENT PRIMARY KEY,
  model_name VARCHAR(255),
  model_made_in VARCHAR(255),
  model_warranty_duration INT,
  brand_id INT,
  category_id INT,
  image_url VARCHAR(255) NULL,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES BRAND(brand_id),
  FOREIGN KEY (category_id) REFERENCES CATEGORY(category_id)
);

CREATE TABLE IF NOT EXISTS PRODUCT_ITEM (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  item_serial_number VARCHAR(255),
  item_imei VARCHAR(255),
  item_lot_number VARCHAR(255),
  item_status ENUM('Available', 'Sold', 'Damaged', 'Reserved') DEFAULT 'Available',
  model_id INT,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES PRODUCT_MODEL(model_id)
);


CREATE TABLE IF NOT EXISTS SALE_ORDER (
  sale_id INT AUTO_INCREMENT PRIMARY KEY,
  sale_code VARCHAR(255),
  sale_date DATETIME,
  sale_total_amount DECIMAL(10, 2),
  sale_status ENUM('Pending', 'Completed', 'Cancelled') DEFAULT 'Pending',
  customer_id INT,
  create_by VARCHAR(255) NULL,
  update_by VARCHAR(255) NULL,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES CUSTOMER(customer_id)
);

CREATE TABLE IF NOT EXISTS SALE_ORDER_ITEM (
  sale_item_id INT AUTO_INCREMENT PRIMARY KEY,
  sale_price DECIMAL(10, 2),
  sale_id INT,
  item_id INT,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES SALE_ORDER(sale_id),
  FOREIGN KEY (item_id) REFERENCES PRODUCT_ITEM(item_id)
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
  repair_problem_desc TEXT,
  repair_technician_note TEXT,
  repair_date_received DATETIME,
  repair_date_completed DATETIME,
  repair_labor_cost DECIMAL(10, 2),
  repair_status ENUM('received', 'in_progress', 'completed', 'cancelled') DEFAULT 'received',
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

