package com.example.usedcar.entity;

public class Store {
  private Long id;
  private String name;
  private String prefecture;
  private String phone;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getPrefecture() {
    return prefecture;
  }

  public void setPrefecture(String prefecture) {
    this.prefecture = prefecture;
  }

  public String getPhone() {
    return phone;
  }

  public void setPhone(String phone) {
    this.phone = phone;
  }
}
