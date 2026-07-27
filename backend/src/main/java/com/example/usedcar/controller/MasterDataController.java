package com.example.usedcar.controller;

import com.example.usedcar.dto.MasterDataResponse;
import com.example.usedcar.service.MasterDataService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/master-data")
@CrossOrigin(origins = "http://127.0.0.1:5173")
public class MasterDataController {
  private final MasterDataService masterDataService;

  public MasterDataController(MasterDataService masterDataService) {
    this.masterDataService = masterDataService;
  }

  @GetMapping
  public MasterDataResponse findAll() {
    return masterDataService.findAll();
  }
}
