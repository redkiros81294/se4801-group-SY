package com.chaintrack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ChaintrackApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChaintrackApplication.class, args);
    }
}// trigger rebuild
