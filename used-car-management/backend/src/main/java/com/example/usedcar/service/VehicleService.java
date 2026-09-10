package com.example.usedcar.service;

import com.example.usedcar.entity.Vehicle;
import com.example.usedcar.mapper.VehicleMapper;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VehicleService {
  private final VehicleMapper vehicleMapper;

  public VehicleService(VehicleMapper vehicleMapper) {
    this.vehicleMapper = vehicleMapper;
  }

  public List<Vehicle> findAll() {
    return vehicleMapper.findAll();
  }

  public Vehicle findById(Long id) {
    Vehicle vehicle = vehicleMapper.findById(id);
    if (vehicle == null) {
      throw new IllegalArgumentException("車両が見つかりません: " + id);
    }
    return vehicle;
  }

  @Transactional
  public Vehicle create(Vehicle vehicle) {
    vehicleMapper.insert(vehicle);
    return vehicle;
  }

  @Transactional
  public Vehicle update(Long id, Vehicle vehicle) {
    findById(id);
    vehicle.setId(id);
    vehicleMapper.update(vehicle);
    return findById(id);
  }

  @Transactional
  public void delete(Long id) {
    findById(id);
    vehicleMapper.deleteById(id);
  }
}
