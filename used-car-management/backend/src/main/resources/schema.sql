DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS vehicle_statuses;
DROP TABLE IF EXISTS stores;
DROP TABLE IF EXISTS makers;

CREATE TABLE makers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(40) NOT NULL UNIQUE,
  country VARCHAR(40) NOT NULL
);

CREATE TABLE stores (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  prefecture VARCHAR(40) NOT NULL,
  phone VARCHAR(30) NOT NULL
);

CREATE TABLE vehicle_statuses (
  code VARCHAR(30) PRIMARY KEY,
  label VARCHAR(40) NOT NULL,
  display_order INT NOT NULL
);

CREATE TABLE vehicles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  stock_no VARCHAR(40) NOT NULL UNIQUE,
  maker_id BIGINT NOT NULL,
  store_id BIGINT NOT NULL,
  status_code VARCHAR(30) NOT NULL,
  model_year INT NOT NULL,
  mileage INT NOT NULL,
  price BIGINT NOT NULL,
  fuel VARCHAR(40) NOT NULL,
  color VARCHAR(40) DEFAULT '未設定' NOT NULL,
  transmission VARCHAR(20) NOT NULL,
  inspection VARCHAR(20) NOT NULL,
  CONSTRAINT fk_vehicles_maker
    FOREIGN KEY (maker_id) REFERENCES makers(id),
  CONSTRAINT fk_vehicles_store
    FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT fk_vehicles_status
    FOREIGN KEY (status_code) REFERENCES vehicle_statuses(code)
);
