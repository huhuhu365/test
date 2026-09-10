package com.example.usedcar.service;

import com.example.usedcar.dto.MasterDataResponse;
import com.example.usedcar.mapper.MasterDataMapper;
import org.springframework.stereotype.Service;

@Service
public class MasterDataService {
  private final MasterDataMapper masterDataMapper;

  public MasterDataService(MasterDataMapper masterDataMapper) {
    this.masterDataMapper = masterDataMapper;
  }

  public MasterDataResponse findAll() {
    return new MasterDataResponse(
        masterDataMapper.findMakers(),
        masterDataMapper.findStores(),
        masterDataMapper.findStatuses()
    );
  }
}
