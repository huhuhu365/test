package com.example.usedcar;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.example.usedcar.mapper")
public class UsedCarManagementApplication {
  public static void main(String[] args) {
    SpringApplication.run(UsedCarManagementApplication.class, args);
  }
}
