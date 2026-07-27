package com.example.usedcar.controller;

import com.example.usedcar.entity.Vehicle;
import com.example.usedcar.service.VehicleService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "http://127.0.0.1:5173")
public class VehicleController {
  private final VehicleService vehicleService;

  public VehicleController(VehicleService vehicleService) {
    this.vehicleService = vehicleService;
  }

  @GetMapping
  public List<Vehicle> findAll() {
    return vehicleService.findAll();
  }

  @GetMapping("/{id}")
  public Vehicle findById(@PathVariable Long id) {
    return vehicleService.findById(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Vehicle create(@RequestBody Vehicle vehicle) {
    return vehicleService.create(vehicle);
  }

  @PutMapping("/{id}")
  public Vehicle update(@PathVariable Long id, @RequestBody Vehicle vehicle) {
    return vehicleService.update(id, vehicle);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    vehicleService.delete(id);
  }
}
