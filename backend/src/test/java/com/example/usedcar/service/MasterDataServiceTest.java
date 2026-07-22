package com.example.usedcar.service;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.usedcar.dto.MasterDataResponse;
import com.example.usedcar.entity.Maker;
import com.example.usedcar.entity.Store;
import com.example.usedcar.entity.VehicleStatus;
import com.example.usedcar.mapper.MasterDataMapper;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MasterDataServiceTest {
  @Mock
  private MasterDataMapper masterDataMapper;

  @InjectMocks
  private MasterDataService masterDataService;

  @Test
  void findAll_buildsResponseFromMapperData() {
    List<Maker> makers = List.of(new Maker());
    List<Store> stores = List.of(new Store());
    List<VehicleStatus> statuses = List.of(new VehicleStatus());
    when(masterDataMapper.findMakers()).thenReturn(makers);
    when(masterDataMapper.findStores()).thenReturn(stores);
    when(masterDataMapper.findStatuses()).thenReturn(statuses);

    MasterDataResponse response = masterDataService.findAll();

    assertSame(makers, response.getMakers());
    assertSame(stores, response.getStores());
    assertSame(statuses, response.getStatuses());
    verify(masterDataMapper).findMakers();
    verify(masterDataMapper).findStores();
    verify(masterDataMapper).findStatuses();
  }
}
