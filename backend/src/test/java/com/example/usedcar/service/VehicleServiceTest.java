package com.example.usedcar.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.usedcar.entity.Vehicle;
import com.example.usedcar.mapper.VehicleMapper;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {
  @Mock
  private VehicleMapper vehicleMapper;

  @InjectMocks
  private VehicleService vehicleService;

  @Test
  void findAll_returnsVehiclesFromMapper() {
    List<Vehicle> expected = List.of(new Vehicle());
    when(vehicleMapper.findAll()).thenReturn(expected);

    List<Vehicle> actual = vehicleService.findAll();

    assertSame(expected, actual);
    verify(vehicleMapper).findAll();
  }

  @Test
  void findById_returnsVehicleWhenPresent() {
    Vehicle expected = new Vehicle();
    when(vehicleMapper.findById(7L)).thenReturn(expected);

    Vehicle actual = vehicleService.findById(7L);

    assertSame(expected, actual);
    verify(vehicleMapper).findById(7L);
  }

  @Test
  void findById_throwsWhenVehicleMissing() {
    when(vehicleMapper.findById(99L)).thenReturn(null);

    IllegalArgumentException exception = assertThrows(
        IllegalArgumentException.class,
        () -> vehicleService.findById(99L)
    );

    assertEquals("車両が見つかりません: 99", exception.getMessage());
    verify(vehicleMapper).findById(99L);
  }

  @Test
  void create_insertsVehicleAndReturnsIt() {
    Vehicle vehicle = new Vehicle();

    Vehicle created = vehicleService.create(vehicle);

    assertSame(vehicle, created);
    verify(vehicleMapper).insert(vehicle);
  }

  @Test
  void update_setsIdAndPersistsUpdatedVehicle() {
    Vehicle existing = new Vehicle();
    Vehicle input = new Vehicle();
    when(vehicleMapper.findById(3L)).thenReturn(existing);

    Vehicle updated = vehicleService.update(3L, input);

    assertEquals(3L, input.getId());
    assertSame(existing, updated);
    verify(vehicleMapper).update(input);
    verify(vehicleMapper).findById(3L);
  }

  @Test
  void delete_removesExistingVehicle() {
    when(vehicleMapper.findById(4L)).thenReturn(new Vehicle());

    vehicleService.delete(4L);

    verify(vehicleMapper).deleteById(4L);
  }
}
