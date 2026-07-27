package com.example.usedcar.mapper;

import com.example.usedcar.entity.Maker;
import com.example.usedcar.entity.Store;
import com.example.usedcar.entity.VehicleStatus;
import java.util.List;

public interface MasterDataMapper {
  List<Maker> findMakers();

  List<Store> findStores();

  List<VehicleStatus> findStatuses();
}
