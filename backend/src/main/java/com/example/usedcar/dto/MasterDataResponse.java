package com.example.usedcar.dto;

import com.example.usedcar.entity.Maker;
import com.example.usedcar.entity.Store;
import com.example.usedcar.entity.VehicleStatus;
import java.util.List;

public class MasterDataResponse {
  private List<Maker> makers;
  private List<Store> stores;
  private List<VehicleStatus> statuses;

  public MasterDataResponse(List<Maker> makers, List<Store> stores, List<VehicleStatus> statuses) {
    this.makers = makers;
    this.stores = stores;
    this.statuses = statuses;
  }

  public List<Maker> getMakers() {
    return makers;
  }

  public void setMakers(List<Maker> makers) {
    this.makers = makers;
  }

  public List<Store> getStores() {
    return stores;
  }

  public void setStores(List<Store> stores) {
    this.stores = stores;
  }

  public List<VehicleStatus> getStatuses() {
    return statuses;
  }

  public void setStatuses(List<VehicleStatus> statuses) {
    this.statuses = statuses;
  }
}
