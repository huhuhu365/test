package com.example.usedcar.mapper;

import com.example.usedcar.entity.Vehicle;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface VehicleMapper {
  List<Vehicle> findAll();

  Vehicle findById(@Param("id") Long id);

  int insert(Vehicle vehicle);

  int update(Vehicle vehicle);

  int deleteById(@Param("id") Long id);
}
